const db = require('../config/db');
const Joi = require('joi');
const PDFDocument = require('pdfkit');
const { Parser } = require('json2csv');

const pegawaiSchema = Joi.object({
  nip: Joi.string().pattern(/^\d+$/).min(8).max(30).required().messages({
    'string.pattern.base': 'NIP hanya boleh angka',
    'string.min': 'NIP minimal 8 karakter'
  }),
  nama_pegawai: Joi.string().pattern(/^[a-zA-Z0-9\s']+$/).max(255).required().messages({
    'string.pattern.base': 'Nama hanya boleh huruf, angka, spasi, dan petik atas'
  }),
  email: Joi.string().email().lowercase().pattern(/@gmail\.com$/).required().messages({
    'string.pattern.base': 'Email harus menggunakan @gmail.com'
  }),
  nomor_hp: Joi.string().pattern(/^\+62\d{1,11}$/).required().messages({
    'string.pattern.base': 'Nomor HP harus diawali +62 dan maksimal 13 digit angka'
  }),
  tempat_lahir: Joi.string().max(100).required(),
  id_kecamatan: Joi.number().integer().required(),
  alamat_lengkap: Joi.string().required(),
  jarak_rumah_kantor: Joi.number().integer().min(0).max(99).required(),
  tanggal_lahir: Joi.date().iso().required(),
  jenis_kelamin: Joi.string().valid('Laki-laki', 'Perempuan').required(),
  status_kawin: Joi.string().valid('kawin', 'tidak kawin').required(),
  jumlah_anak: Joi.number().integer().min(0).max(99).required(),
  tanggal_masuk: Joi.date().iso().required(),
  id_jabatan: Joi.number().integer().required(),
  id_departemen: Joi.number().integer().required(),
  status_kontrak: Joi.string().valid('PKWTT', 'PKWT', 'Magang').required(),
  status: Joi.string().valid('Aktif', 'Nonaktif').required(),
  pendidikan: Joi.array().items(Joi.object({
    tingkat_pendidikan: Joi.string().max(50).required(),
    nama_sekolah: Joi.string().max(255).required(),
    tahun_lulus: Joi.number().integer().required()
  })).max(5).optional().messages({
    'array.max': 'Pendidikan maksimal 5 baris'
  })
});

exports.getList = async (req, res) => {
  try {
    const { search, jabatan, status_kontrak, masa_kerja_min, masa_kerja_max, sort_by = 'pegawai.id', sort_order = 'desc', limit = 10, page = 1 } = req.query;
    const offset = (page - 1) * limit;

    let query = db('pegawai')
      .leftJoin('master_data as j', 'pegawai.id_jabatan', 'j.id')
      .leftJoin('master_data as d', 'pegawai.id_departemen', 'd.id')
      .select('pegawai.*', 'j.nama as nama_jabatan', 'd.nama as nama_departemen');

    const applyFilters = (q) => {
      if (search) {
        q.where(builder => {
          builder.where('pegawai.nama_pegawai', 'like', `%${search}%`)
                 .orWhere('pegawai.nip', 'like', `%${search}%`)
                 .orWhere('j.nama', 'like', `%${search}%`);
        });
      }
      if (jabatan) {
        // Handle array multiple select format from query params (e.g., jabatan=1&jabatan=2 or jabatan[]=1&jabatan[]=2 or jabatan=1,2)
        let jList = Array.isArray(jabatan) ? jabatan : String(jabatan).split(',');
        q.whereIn('pegawai.id_jabatan', jList);
      }
      if (status_kontrak) {
        q.where('pegawai.status_kontrak', status_kontrak);
      }
      // SQLite mix types support: some rows have tanggal_masuk as string 'YYYY-MM-DD', others as integer (unix ms)
      const jdMasaKerja = `(CASE WHEN typeof(pegawai.tanggal_masuk) = 'integer' OR typeof(pegawai.tanggal_masuk) = 'real' THEN julianday(pegawai.tanggal_masuk / 1000.0, 'unixepoch') ELSE julianday(pegawai.tanggal_masuk) END)`;

      if (masa_kerja_min !== undefined && masa_kerja_min !== '') {
        q.whereRaw(`CAST((julianday('now') - ${jdMasaKerja}) / 365.25 AS INTEGER) >= ?`, [parseInt(masa_kerja_min)]);
      }
      if (masa_kerja_max !== undefined && masa_kerja_max !== '') {
        q.whereRaw(`CAST((julianday('now') - ${jdMasaKerja}) / 365.25 AS INTEGER) <= ?`, [parseInt(masa_kerja_max)]);
      }
    };

    applyFilters(query);

    // Sorting handling
    // Valid sort_by: nip, nama_pegawai, nama_jabatan, tanggal_masuk, masa_kerja
    let orderColumn = sort_by;
    if (sort_by === 'Masa Kerja' || sort_by === 'masa_kerja') {
      orderColumn = 'pegawai.tanggal_masuk'; 
      // Note: sort order is reversed because older tanggal_masuk = longer masa_kerja
      const realOrder = sort_order.toLowerCase() === 'asc' ? 'desc' : 'asc';
      query.orderBy(orderColumn, realOrder);
    } else {
      // Map frontend column names to db columns if necessary
      if (sort_by === 'Nama' || sort_by === 'nama') orderColumn = 'pegawai.nama_pegawai';
      if (sort_by === 'NIP' || sort_by === 'nip') orderColumn = 'pegawai.nip';
      if (sort_by === 'Jabatan' || sort_by === 'jabatan') orderColumn = 'j.nama';
      if (sort_by === 'Tanggal Masuk' || sort_by === 'tanggal_masuk') orderColumn = 'pegawai.tanggal_masuk';
      
      query.orderBy(orderColumn, sort_order);
    }

    const data = await query.limit(limit).offset(offset);
    
    // Get total for pagination
    let countQuery = db('pegawai').leftJoin('master_data as j', 'pegawai.id_jabatan', 'j.id');
    applyFilters(countQuery);
    const [{ total }] = await countQuery.count('pegawai.id as total');

    // Calculate masa_kerja dynamically
    const now = new Date();
    const list = data.map(p => {
      const masuk = new Date(p.tanggal_masuk);
      const diffTime = Math.abs(now - masuk);
      const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365));
      return { ...p, masa_kerja: `${diffYears} Tahun` };
    });

    res.json({ data: list, total, page, limit });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching data' });
  }
};

exports.getDetail = async (req, res) => {
  try {
    const id = req.params.id;
    const pegawai = await db('pegawai')
      .leftJoin('master_data as j', 'pegawai.id_jabatan', 'j.id')
      .leftJoin('master_data as d', 'pegawai.id_departemen', 'd.id')
      .leftJoin('master_wilayah as w', 'pegawai.id_kecamatan', 'w.id')
      .select('pegawai.*', 'j.nama as nama_jabatan', 'd.nama as nama_departemen', 'w.kecamatan', 'w.kabupaten', 'w.provinsi')
      .where('pegawai.id', id).first();
      
    if (!pegawai) return res.status(404).json({ message: 'Not found' });

    const pendidikan = await db('pegawai_pendidikan').where('id_pegawai', id);
    res.json({ ...pegawai, pendidikan });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching data' });
  }
};

exports.create = async (req, res) => {
  try {
    if (req.body.pendidikan && typeof req.body.pendidikan === 'string') {
      try { req.body.pendidikan = JSON.parse(req.body.pendidikan); } catch (e) {}
    }

    const { error, value } = pegawaiSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    // Calculate usia
    const tanggalLahir = new Date(value.tanggal_lahir);
    const usia = Math.floor((new Date() - tanggalLahir) / (1000 * 60 * 60 * 24 * 365));
    if (usia < 20) {
      return res.status(400).json({ message: 'Usia pegawai minimal 20 tahun' });
    }
    
    const { pendidikan, ...pegawaiData } = value;
    pegawaiData.usia = usia;
    if (req.file) {
      pegawaiData.foto_path = req.file.filename;
    }

    await db.transaction(async trx => {
      const [id] = await trx('pegawai').insert(pegawaiData);
      if (pendidikan && pendidikan.length > 0) {
        const pdData = pendidikan.map(p => ({ ...p, id_pegawai: id }));
        await trx('pegawai_pendidikan').insert(pdData);
      }
    });

    res.status(201).json({ message: 'Data created successfully' });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT' || error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'NIP atau Email sudah terdaftar' });
    }
    console.error(error);
    res.status(500).json({ message: 'Error creating data' });
  }
};

exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    if (req.body.pendidikan && typeof req.body.pendidikan === 'string') {
      try { req.body.pendidikan = JSON.parse(req.body.pendidikan); } catch (e) {}
    }

    const { error, value } = pegawaiSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const tanggalLahir = new Date(value.tanggal_lahir);
    const usia = Math.floor((new Date() - tanggalLahir) / (1000 * 60 * 60 * 24 * 365));
    if (usia < 20) {
      return res.status(400).json({ message: 'Usia pegawai minimal 20 tahun' });
    }
    
    const { pendidikan, ...pegawaiData } = value;
    pegawaiData.usia = usia;
    if (req.file) {
      pegawaiData.foto_path = req.file.filename;
    }

    await db.transaction(async trx => {
      await trx('pegawai').where({ id }).update(pegawaiData);
      
      if (pendidikan) {
        await trx('pegawai_pendidikan').where({ id_pegawai: id }).del();
        if (pendidikan.length > 0) {
          const pdData = pendidikan.map(p => ({ ...p, id_pegawai: id }));
          await trx('pegawai_pendidikan').insert(pdData);
        }
      }
    });

    res.json({ message: 'Data updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating data' });
  }
};

exports.delete = async (req, res) => {
  try {
    const id = req.params.id;
    
    // Cek apakah pegawai ini adalah superadmin
    const userL = await db('user').where({ id_pegawai: id, id_role: 1 }).first();
    if (userL) {
      return res.status(403).json({ message: 'Cannot delete data pegawai superadmin' });
    }
    
    await db('pegawai').where({ id }).del();
    res.json({ message: 'Data deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting data' });
  }
};

exports.bulkAction = async (req, res) => {
  try {
    const { action, ids, status } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Belum ada data yang dipilih' });
    }

    if (action === 'delete') {
      // Cek apakah ada pegawai superadmin di list ids
      const superadmins = await db('user')
        .whereIn('id_pegawai', ids)
        .andWhere('id_role', 1);
      
      if (superadmins.length > 0) {
        return res.status(403).json({ message: 'Tidak dapat menghapus data pegawai superadmin via bulk delete' });
      }

      await db('pegawai').whereIn('id', ids).del();
      return res.json({ message: 'Data berhasil dihapus' });
    } else if (action === 'status') {
      if (!status) return res.status(400).json({ message: 'Status tidak valid' });
      await db('pegawai').whereIn('id', ids).update({ status });
      return res.json({ message: 'Status berhasil diubah' });
    } else {
      return res.status(400).json({ message: 'Aksi tidak valid' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan pada aksi bulk' });
  }
};

exports.autosuggest = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json([]);
    
    const data = await db('pegawai')
      .where('nama_pegawai', 'like', `%${q}%`)
      .select('id', 'nama_pegawai', 'nip')
      .limit(10);
      
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Error searching' });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const stats = await db('pegawai').select(
      db.raw('COUNT(*) as total'),
      db.raw(`COALESCE(SUM(CASE WHEN status_kontrak = 'PKWTT' THEN 1 ELSE 0 END), 0) as total_tetap`),
      db.raw(`COALESCE(SUM(CASE WHEN status_kontrak = 'PKWT' THEN 1 ELSE 0 END), 0) as total_kontrak`),
      db.raw(`COALESCE(SUM(CASE WHEN status_kontrak = 'Magang' THEN 1 ELSE 0 END), 0) as total_magang`),
      db.raw(`COALESCE(SUM(CASE WHEN jenis_kelamin = 'Laki-laki' THEN 1 ELSE 0 END), 0) as total_laki`),
      db.raw(`COALESCE(SUM(CASE WHEN jenis_kelamin = 'Perempuan' THEN 1 ELSE 0 END), 0) as total_perempuan`)
    ).first();

    const terbaru = await db('pegawai')
      .leftJoin('master_data as j', 'pegawai.id_jabatan', 'j.id')
      .select('pegawai.id', 'pegawai.nip', 'pegawai.nama_pegawai', 'pegawai.tanggal_masuk', 'pegawai.status_kontrak', 'j.nama as nama_jabatan')
      .orderBy('pegawai.id', 'desc')
      .limit(5);

    res.json({ stats, terbaru });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching dashboard stats' });
  }
};

exports.exportPdf = async (req, res) => {
  try {
    const data = await db('pegawai')
      .leftJoin('master_data as j', 'pegawai.id_jabatan', 'j.id')
      .select('pegawai.*', 'j.nama as nama_jabatan');
    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=daftar_pegawai.pdf');
    
    doc.pipe(res);
    doc.fontSize(16).font('Helvetica-Bold').text('Daftar Pegawai', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica').fillColor('#666').text(`Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, { align: 'center' });
    doc.moveDown(1);
    
    let currentY = doc.y;
    doc.font('Helvetica-Bold').fillColor('#333').fontSize(10);
    doc.text('No', 40, currentY, { width: 30 });
    doc.text('NIP', 70, currentY, { width: 100 });
    doc.text('Nama Pegawai', 170, currentY, { width: 150 });
    doc.text('Jabatan', 320, currentY, { width: 100 });
    doc.text('Status', 420, currentY, { width: 120 });
    
    doc.moveTo(35, currentY + 15).lineTo(560, currentY + 15).stroke('#ccc');
    currentY += 20;
    
    doc.font('Helvetica').fillColor('#000');
    data.forEach((p, i) => {
      if (currentY > 750) {
        doc.addPage();
        currentY = 40;
      }
      doc.text(String(i + 1), 40, currentY, { width: 30 });
      doc.text(p.nip || '-', 70, currentY, { width: 100 });
      doc.text(p.nama_pegawai || '-', 170, currentY, { width: 150 });
      doc.text(p.nama_jabatan || '-', 320, currentY, { width: 100 });
      doc.text(`${p.status} | ${p.status_kontrak}`, 420, currentY, { width: 120 });
      
      currentY += Math.max(doc.heightOfString(p.nama_pegawai || '-', { width: 150 }), 15) + 5;
      doc.moveTo(35, currentY - 3).lineTo(560, currentY - 3).stroke('#eee');
    });
    
    doc.end();
  } catch (error) {
    res.status(500).json({ message: 'Export PDF failed' });
  }
};

exports.exportExcel = async (req, res) => {
  try {
    const rawData = await db('pegawai').select('nip', 'nama_pegawai', 'email', 'nomor_hp', 'status_kontrak');
    
    // Prefix numeric fields with a tab character to force Excel to treat them as text
    const data = rawData.map(p => ({
      ...p,
      nip: p.nip ? `\t${p.nip}` : '',
      nomor_hp: p.nomor_hp ? `\t${p.nomor_hp}` : ''
    }));

    
    const fields = [
      { label: 'NIP', value: 'nip' },
      { label: 'Nama Pegawai', value: 'nama_pegawai' },
      { label: 'Email', value: 'email' },
      { label: 'Nomor HP', value: 'nomor_hp' },
      { label: 'Status Kontrak', value: 'status_kontrak' }
    ];
    
    const json2csvParser = new Parser({ fields, delimiter: ';' });
    const csv = json2csvParser.parse(data);
    
    // Prepend UTF-8 BOM so Excel opens it correctly with UTF-8
    const excelCsv = '\uFEFF' + csv;
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=daftar_pegawai.csv');
    res.status(200).end(excelCsv);
  } catch (error) {
    res.status(500).json({ message: 'Export Excel failed' });
  }
};

exports.getFoto = async (req, res) => {
  try {
    const { id } = req.params;
    const pegawai = await db('pegawai').select('foto_path').where('id', id).first();
    
    if (!pegawai || !pegawai.foto_path) {
      return res.status(404).json({ message: 'Foto tidak ditemukan' });
    }

    const path = require('path');
    const fs = require('fs');
    const filePath = path.join(__dirname, '../../uploads', pegawai.foto_path);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File tidak ada' });
    }

    res.sendFile(filePath);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan saat memuat foto' });
  }
};

exports.exportDetailPdf = async (req, res) => {
  try {
    const id = req.params.id;
    const pegawai = await db('pegawai')
      .leftJoin('master_data as j', 'pegawai.id_jabatan', 'j.id')
      .leftJoin('master_data as d', 'pegawai.id_departemen', 'd.id')
      .leftJoin('master_wilayah as w', 'pegawai.id_kecamatan', 'w.id')
      .select('pegawai.*', 'j.nama as nama_jabatan', 'd.nama as nama_departemen', 'w.kecamatan', 'w.kabupaten', 'w.provinsi')
      .where('pegawai.id', id).first();

    if (!pegawai) return res.status(404).json({ message: 'Pegawai tidak ditemukan' });

    const pendidikan = await db('pegawai_pendidikan').where('id_pegawai', id);

    // Hitung masa kerja
    const now = new Date();
    const masuk = new Date(pegawai.tanggal_masuk);
    const masaKerjaTahun = Math.floor(Math.abs(now - masuk) / (1000 * 60 * 60 * 24 * 365));

    const doc = new PDFDocument({ margin: 50 });

    const safeName = pegawai.nama_pegawai.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=detail_pegawai_${safeName}.pdf`);

    doc.pipe(res);

    // Header
    doc.fontSize(18).font('Helvetica-Bold').text('Detail Data Pegawai', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica').fillColor('#666').text(`Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, { align: 'center' });
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#ccc');
    doc.moveDown();

    // Section helper
    const sectionTitle = (title) => {
      doc.moveDown(0.5);
      doc.fontSize(13).font('Helvetica-Bold').fillColor('#000').text(title, 50, doc.y, { align: 'left' });
      doc.moveDown(0.3);
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#000');
      doc.moveDown(0.5);
    };

    const row = (label, value) => {
      const y = doc.y;
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#333').text(label, 50, y, { width: 140 });
      doc.font('Helvetica').fillColor('#000').text(`: ${value || '-'}`, 190, y, { width: 350 });
      // Calculate how much space was used so the next row doesn't overlap
      doc.y = Math.max(doc.y, y + doc.heightOfString(`: ${value || '-'}`, { width: 350 }));
      doc.moveDown(0.3);
    };

    // Informasi Pribadi
    sectionTitle('Informasi Pribadi');
    row('NIP', pegawai.nip);
    row('Nama Lengkap', pegawai.nama_pegawai);
    row('Email', pegawai.email);
    row('Nomor HP', pegawai.nomor_hp);
    const tglLahir = pegawai.tanggal_lahir ? new Date(pegawai.tanggal_lahir).toLocaleDateString('id-ID') : '-';
    row('Tempat, Tgl Lahir', `${pegawai.tempat_lahir || '-'}, ${tglLahir} (${pegawai.usia || '-'} th)`);
    row('Status Pernikahan', pegawai.status_kawin);
    row('Jumlah Anak', String(pegawai.jumlah_anak || 0));

    // Alamat
    sectionTitle('Alamat');
    row('Alamat Lengkap', pegawai.alamat_lengkap);
    row('Kecamatan', pegawai.kecamatan);
    row('Kabupaten', pegawai.kabupaten);
    row('Provinsi', pegawai.provinsi);
    row('Jarak Rumah-Kantor', `${pegawai.jarak_rumah_kantor || 0} KM`);

    // Kepegawaian
    sectionTitle('Kepegawaian & Tunjangan');
    row('Jabatan', pegawai.nama_jabatan);
    row('Departemen', pegawai.nama_departemen);
    row('Status Kontrak', pegawai.status_kontrak);
    row('Status Karyawan', pegawai.status);
    row('Tanggal Masuk', pegawai.tanggal_masuk ? new Date(pegawai.tanggal_masuk).toLocaleDateString('id-ID') : '-');
    row('Masa Kerja', `${masaKerjaTahun} Tahun`);
    row('Tunjangan Transport', `Rp ${(pegawai.tunjangan_transport || 0).toLocaleString('id-ID')}`);

    // Pendidikan
    sectionTitle('Riwayat Pendidikan');
    if (pendidikan.length === 0) {
      doc.fontSize(10).font('Helvetica').fillColor('#000').text('Belum ada data pendidikan.');
    } else {
      pendidikan.forEach((edu, i) => {
        row(`Pendidikan ${i + 1}`, `${edu.tingkat_pendidikan || '-'} - ${edu.nama_sekolah || '-'} (${edu.tahun_lulus || '-'})`);
      });
    }

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Export PDF Detail gagal' });
  }
};
