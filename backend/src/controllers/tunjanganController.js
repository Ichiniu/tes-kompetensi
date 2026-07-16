const db = require('../config/db');
const Joi = require('joi');

const settingSchema = Joi.object({
  base_fare: Joi.number().precision(2).required(),
  min_km: Joi.number().precision(2).required(),
  max_km: Joi.number().precision(2).required(),
  berlaku_mulai: Joi.date().iso().required()
});

exports.getSetting = async (req, res) => {
  try {
    const setting = await db('setting_tunjangan_transport').orderBy('berlaku_mulai', 'desc').orderBy('id', 'desc').first();
    res.json(setting || {});
  } catch (error) {
    res.status(500).json({ message: 'Error fetching setting' });
  }
};

exports.saveSetting = async (req, res) => {
  try {
    const { error, value } = settingSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    value.created_by = req.user.id;
    // Joi parses .date() into a Date object. Knex saves Date objects as Unix ms in SQLite. 
    // We must format it as YYYY-MM-DD string so orderBy('berlaku_mulai') works consistently!
    value.berlaku_mulai = new Date(value.berlaku_mulai).toISOString().split('T')[0];
    await db('setting_tunjangan_transport').insert(value);

    res.status(201).json({ message: 'Setting saved successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error saving setting' });
  }
};

exports.getTunjanganList = async (req, res) => {
  try {
    const { tahun } = req.query;
    let query = db('tunjangan_transport');
    if (tahun) {
      query = query.where('tahun', tahun);
    }
    const data = await query.orderBy('tahun', 'desc').orderBy('bulan', 'desc');
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tunjangan list' });
  }
};

exports.getTunjanganDetail = async (req, res) => {
  try {
    const id = req.params.id;
    const header = await db('tunjangan_transport').where('id', id).first();
    if (!header) return res.status(404).json({ message: 'Not found' });

    const detail = await db('tunjangan_transport_detail')
      .join('pegawai', 'tunjangan_transport_detail.id_pegawai', 'pegawai.id')
      .where('id_tunjangan_transport', id)
      .select('tunjangan_transport_detail.*', 'pegawai.nama_pegawai', 'pegawai.nip');

    res.json({ header, detail });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tunjangan detail' });
  }
};

// Input: { bulan: 7, tahun: 2026, data_hari_kerja: [{ id_pegawai: 1, hari_kerja: 20 }, ...] }
exports.calculateTunjangan = async (req, res) => {
  try {
    const { bulan, tahun, data_hari_kerja } = req.body;
    
    if (!bulan || !tahun || !Array.isArray(data_hari_kerja)) {
      return res.status(400).json({ message: 'Bulan, tahun, dan data_hari_kerja wajib diisi' });
    }

    const setting = await db('setting_tunjangan_transport')
      .where('berlaku_mulai', '<=', `${tahun}-${String(bulan).padStart(2, '0')}-01`)
      .orderBy('berlaku_mulai', 'desc')
      .orderBy('id', 'desc')
      .first();

    if (!setting) {
      return res.status(400).json({ message: 'Setting tunjangan untuk periode ini tidak ditemukan' });
    }

    const baseFare = setting.base_fare;
    const minKm = setting.min_km;
    const maxKm = setting.max_km;

    // Get eligible pegawais (only PKWTT/Tetap)
    const pegawaiIds = data_hari_kerja.map(d => d.id_pegawai);
    const pegawais = await db('pegawai').whereIn('id', pegawaiIds);
    const pegawaiMap = pegawais.reduce((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {});

    let totalPenerima = 0;
    let totalTunjangan = 0;
    const detailToInsert = [];

    for (const data of data_hari_kerja) {
      const p = pegawaiMap[data.id_pegawai];
      if (!p) continue;

      if (data.hari_kerja > 26) {
        return res.status(400).json({ message: `Hari kerja aktual untuk pegawai ${p.nama_pegawai} melebihi batas maksimal 26 hari.` });
      }

      let eligible = true;
      let nominal = 0;
      let keterangan = '';
      let kmDihitung = p.jarak_rumah_kantor;

      // Rules check
      if (p.status_kontrak !== 'PKWTT') {
        eligible = false;
        keterangan = 'Bukan pegawai tetap';
      } else if (data.hari_kerja < 19) {
        eligible = false;
        keterangan = 'Hari kerja kurang dari 19 hari';
      } else if (kmDihitung <= minKm) {
        eligible = false;
        keterangan = `Jarak kurang atau sama dengan batas minimum (${minKm} km)`;
      }

      if (eligible) {
        if (kmDihitung > maxKm) kmDihitung = maxKm;
        
        // Pembulatan km (desimal < 0.5 bulat bawah, >= 0.5 bulat atas)
        kmDihitung = Math.round(kmDihitung);

        nominal = baseFare * kmDihitung * data.hari_kerja;
        totalPenerima++;
        totalTunjangan += nominal;
      } else {
        kmDihitung = 0;
        nominal = 0;
      }

      detailToInsert.push({
        id_pegawai: p.id,
        km_dihitung: kmDihitung,
        hari_kerja: data.hari_kerja,
        base_fare_snapshot: baseFare,
        nominal,
        eligible,
        keterangan
      });
    }

    await db.transaction(async trx => {
      // Check if existing calculation
      const existing = await trx('tunjangan_transport').where({ bulan, tahun }).first();
      let headerId;

      if (existing) {
        // Delete old detail to replace
        await trx('tunjangan_transport_detail').where({ id_tunjangan_transport: existing.id }).del();
        await trx('tunjangan_transport').where({ id: existing.id }).update({
          total_penerima: totalPenerima,
          total_tunjangan: totalTunjangan,
          dihitung_pada: trx.fn.now(),
          dihitung_oleh: req.user.id,
          status_hitung: 'sudah'
        });
        headerId = existing.id;
      } else {
        const [insertedId] = await trx('tunjangan_transport').insert({
          bulan, tahun,
          total_penerima: totalPenerima,
          total_tunjangan: totalTunjangan,
          status_hitung: 'sudah',
          dihitung_pada: trx.fn.now(),
          dihitung_oleh: req.user.id
        });
        headerId = insertedId;
      }

      const formattedDetails = detailToInsert.map(d => ({ ...d, id_tunjangan_transport: headerId }));
      await trx('tunjangan_transport_detail').insert(formattedDetails);
    });

    res.json({ message: 'Kalkulasi berhasil', total_penerima: totalPenerima, total_tunjangan: totalTunjangan });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error kalkulasi tunjangan' });
  }
};
