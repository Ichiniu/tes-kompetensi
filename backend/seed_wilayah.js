const db = require('./src/config/db');
const { getProvinces, getRegencies, getDistricts } = require('idn-area-data');

async function seed() {
  console.log('Fetching data from idn-area-data...');
  try {
    const provinces = await getProvinces();
    const regencies = await getRegencies();
    const districts = await getDistricts();

    console.log(`Found ${provinces.length} provinces, ${regencies.length} regencies, ${districts.length} districts.`);

    const provMap = {};
    for (let p of provinces) provMap[p.code] = p.name;

    const regMap = {};
    for (let r of regencies) regMap[r.code] = { name: r.name, prov: provMap[r.province_code] };

    const dataToInsert = [];
    for (let d of districts) {
      const reg = regMap[d.regency_code];
      if (reg) {
        dataToInsert.push({
          kecamatan: d.name,
          kabupaten: reg.name,
          provinsi: reg.prov
        });
      }
    }

    console.log(`Preparing to insert ${dataToInsert.length} records into master_wilayah...`);

    // Clean table first
    console.log('Clearing existing master_wilayah...');
    await db('master_wilayah').del();

    console.log('Inserting data in chunks...');
    const chunkSize = 500;
    for (let i = 0; i < dataToInsert.length; i += chunkSize) {
      const chunk = dataToInsert.slice(i, i + chunkSize);
      await db('master_wilayah').insert(chunk);
      console.log(`Inserted ${i + chunk.length} / ${dataToInsert.length}`);
    }

    console.log('Seed wilayah completed successfully!');
  } catch (err) {
    console.error('Seed failed:', err);
  } finally {
    db.destroy();
  }
}

seed();
