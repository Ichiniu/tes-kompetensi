const db = require('./src/config/db');
const tunjanganController = require('./src/controllers/tunjanganController');

async function run() {
  try {
    // Cleanup
    await db('pegawai').where('nip', 'like', 'TST_%').del();

    // Insert fresh setting to avoid any stale data
    const existing = await db('setting_tunjangan_transport')
      .where('berlaku_mulai', '2026-07-01').first();
    if (!existing) {
      await db('setting_tunjangan_transport').insert({
        base_fare: 1000, min_km: 5, max_km: 25,
        berlaku_mulai: '2026-07-01', created_by: 1
      });
    }

    // Test scenarios: [km, hari_kerja, expected_nominal, description]
    const scenarios = [
      { km: 5,   hari: 20, desc: 'km = 5 (persis di batas min)'           },
      { km: 4.9, hari: 20, desc: 'km = 4.9 (di bawah batas min)'          },
      { km: 5.1, hari: 20, desc: 'km = 5.1 (tepat di atas batas min)'     },
      { km: 0,   hari: 20, desc: 'km = 0 (nol, seharusnya tidak eligible)' },
      { km: 30,  hari: 20, desc: 'km = 30 (di atas max 25, harus di-cap)'  },
    ];

    // Calculate expected nominals with exact business rules matching controller
    // Read actual setting from DB (same query as controller)
    const setting = await db('setting_tunjangan_transport')
      .where('berlaku_mulai', '<=', '2026-08-01')
      .orderBy('berlaku_mulai', 'desc').orderBy('id', 'desc').first();
    const BASE_FARE = setting.base_fare, MIN_KM = setting.min_km, MAX_KM = setting.max_km;
    console.log(`\nSetting aktif: base_fare=${BASE_FARE}, min_km=${MIN_KM}, max_km=${MAX_KM}, berlaku=${setting.berlaku_mulai}`);

    const calcExpected = (km, hari) => {
      if (km <= MIN_KM) return 0;                        // Excluded by min km rule
      const kmCapped   = km > MAX_KM ? MAX_KM : km;     // Cap at max
      const kmRounded  = Math.round(kmCapped);           // Round (5.1→5, 25→25)
      return BASE_FARE * kmRounded * hari;
    };

    // Insert dummy PKWTT employees
    const ids = [];
    for (const s of scenarios) {
      const [id] = await db('pegawai').insert({
        nama_pegawai: `Test_${s.km}km`,
        nip: `TST_${s.km.toString().replace('.', '_')}`,
        status_kontrak: 'PKWTT',
        jarak_rumah_kantor: s.km,
        id_jabatan: 1, id_departemen: 1
      });
      ids.push(id);
    }

    // Run calculation via controller directly
    const data_hari_kerja = ids.map((id, i) => ({
      id_pegawai: id, hari_kerja: scenarios[i].hari
    }));

    let responseData = null;
    const req = {
      body: { bulan: 8, tahun: 2026, data_hari_kerja },
      user: { id: 1 }
    };
    const res = {
      status: function(code) { this._code = code; return this; },
      json:   function(data) { responseData = data; }
    };

    await tunjanganController.calculateTunjangan(req, res);

    // Fetch saved details
    const header = await db('tunjangan_transport')
      .where({ bulan: 8, tahun: 2026 }).orderBy('id', 'desc').first();
    const details = await db('tunjangan_transport_detail')
      .where({ id_tunjangan_transport: header.id })
      .whereIn('id_pegawai', ids);

    console.log('\n╔══════════════════════════════════════════════════════════════════════════╗');
    console.log('║                     HASIL TEST KALKULASI TUNJANGAN                      ║');
    console.log('╠════╦══════════════════════════════════╦══════════╦══════════╦══════════╗');
    console.log('║ NO ║ SKENARIO                         ║ EXPECTED ║  ACTUAL  ║  STATUS  ║');
    console.log('╠════╬══════════════════════════════════╬══════════╬══════════╬══════════╣');

    for (let i = 0; i < scenarios.length; i++) {
      const s = scenarios[i];
      const peg = await db('pegawai').where({ nip: `TST_${s.km.toString().replace('.', '_')}` }).first();
      const det = details.find(d => d.id_pegawai === peg.id);
      const expected = calcExpected(s.km, s.hari);
      const actual = det ? det.nominal : -1;
      const pass = actual === expected;

      // Extra check: km=30 should be stored as km_dihitung=25 (capped)
      const kmStored = det ? det.km_dihitung : '?';
      const kmNote = s.km === 30 ? ` [km_stored=${kmStored}]` : '';

      const status = pass ? '  PASS ✓  ' : '  FAIL ✗  ';
      const desc = s.desc.padEnd(32).substring(0, 32);
      const exp = String('Rp ' + expected.toLocaleString()).padEnd(10).substring(0, 10);
      const act = String('Rp ' + actual.toLocaleString()).padEnd(10).substring(0, 10);
      console.log(`║ ${String(i+1).padStart(2)} ║ ${desc} ║ ${exp} ║ ${act} ║${status}║`);

      if (kmNote) {
        console.log(`║    ║   → Bonus check km capping: km_input=${s.km}, ${kmNote.trim()}         ║          ║          ║          ║`);
      }
    }

    console.log('╚════╩══════════════════════════════════╩══════════╩══════════╩══════════╝');

    // Cleanup
    await db('pegawai').whereIn('id', ids).del();
    await db('tunjangan_transport_detail').where({ id_tunjangan_transport: header.id }).del();
    await db('tunjangan_transport').where('id', header.id).del();
    process.exit(0);

  } catch (err) {
    console.error('Test Error:', err.message);
    process.exit(1);
  }
}

run();
