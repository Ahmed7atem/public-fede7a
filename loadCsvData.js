const fastcsv = require('fast-csv');
const fs = require('fs');
const pool = require('./config/database');
const bcrypt = require('bcryptjs');
const { parseDate, parseTime, getCurrentTimestamp } = require('./utils');

async function loadCsvData() {
  try {
    console.log('Starting CSV data loading...');

    // Load GP-2025-full-data.csv
    const gpFilePath = 'data/GP-2025-full-data.csv';
    if (fs.existsSync(gpFilePath)) {
      const [healthDataCount] = await pool.query('SELECT COUNT(*) AS count FROM health_data');
      if (healthDataCount[0].count === 0) {
        console.log('health_data table is empty, loading GP-2025-full-data.csv...');
        const gpStats = fs.statSync(gpFilePath);
        console.log(`GP-2025-full-data.csv size: ${gpStats.size} bytes`);

        const employees = [];
        const healthData = [];
        await new Promise((resolve, reject) => {
          fs.createReadStream(gpFilePath)
            .pipe(fastcsv.parse({ headers: true, ignoreEmpty: true }))
            .on('data', (row) => {
              if (!row.Patient_ID || !row.Age || !row.Gender) {
                console.warn('Skipping incomplete row (missing Patient_ID, Age, or Gender):', row);
                return;
              }
              const employeeId = Buffer.from(row.Patient_ID.replace(/-/g, ''), 'hex');
              const password = require('crypto').randomBytes(8).toString('hex');
              const hashedPassword = bcrypt.hashSync(password, 10);

              employees.push({
                id: employeeId,
                name: `Employee ${row.Patient_ID}`,
                email: `employee${row.Patient_ID.replace(/-/g, '')}@example.com`,
                age: parseInt(row.Age) || 0,
                gender: row.Gender || 'Unknown',
                password: hashedPassword,
                children: parseInt(row.children) || 0,
                smoker: row.smoker === 'yes' ? 1 : 0,
                role: 'employee',
              });

              healthData.push({
                id: Buffer.from(require('crypto').randomUUID().replace(/-/g, ''), 'hex'),
                employee_id: employeeId,
                recorded_at: getCurrentTimestamp(),
                weight: parseFloat(row.Weight_kg) || 70.0,
                height: parseFloat(row.Height_cm) || 170.0,
                bmi: parseFloat(row.BMI) || 24.0,
                hemoglobin: parseFloat(row.Hemoglobin_g_dL) || 14.0,
                cholesterol: parseFloat(row.Cholesterol_mg_dL) || 180.0,
                blood_sugar: parseFloat(row.Blood_Sugar_mg_dL) || 100.0,
                creatinine: parseFloat(row.Creatinine_mg_dL) || 1.0,
                chronic_disease: row.Chronic_Disease || null,
                family_medical_history: row.family_medical_history || null,
              });
            })
            .on('end', async (rowCount) => {
              console.log(`Parsed GP-2025-full-data.csv, processed ${rowCount} rows, prepared ${employees.length} employees and ${healthData.length} health data entries`);

              if (employees.length > 0) {
                const [result] = await pool.query(
                  'INSERT IGNORE INTO employee (id, name, email, age, gender, password, children, smoker, role) VALUES ?',
                  [employees.map(e => [e.id, e.name, e.email, e.age, e.gender, e.password, e.children, e.smoker, e.role])]
                );
                console.log(`Inserted ${result.affectedRows} employees`);
              }

              if (healthData.length > 0) {
                const [result] = await pool.query(
                  'INSERT INTO health_data (id, employee_id, recorded_at, weight, height, bmi, hemoglobin, cholesterol, blood_sugar, creatinine, chronic_disease, family_medical_history) VALUES ?',
                  [healthData.map(h => [h.id, h.employee_id, h.recorded_at, h.weight, h.height, h.bmi, h.hemoglobin, h.cholesterol, h.blood_sugar, h.creatinine, h.chronic_disease, h.family_medical_history])]
                );
                console.log(`Inserted ${result.affectedRows} health data rows`);
              }
              resolve();
            })
            .on('error', (error) => {
              console.error('Error parsing GP-2025-full-data.csv:', error.stack);
              reject(error);
            });
        });
      } else {
        console.log('health_data table already has records, skipping GP-2025-full-data.csv');
      }
    } else {
      console.error(`Error: ${gpFilePath} not found`);
    }

    // Create admin user
    const adminId = Buffer.from('61646d696e0000000000000000000000', 'hex'); // 'admin' + 12 zero bytes
    console.log('Admin ID (hex):', adminId.toString('hex'));
    const adminEmail = 'admin@example.com';
    const adminPassword = 'admin1234';
    const hashedAdminPassword = bcrypt.hashSync(adminPassword, 10);
    const [existingAdmin] = await pool.query('SELECT email FROM employee WHERE email = ?', [adminEmail]);
    if (existingAdmin.length === 0) {
      await pool.query(
        'INSERT INTO employee (id, name, email, age, gender, password, children, smoker, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [adminId, 'Admin User', adminEmail, 0, 'N/A', hashedAdminPassword, 0, 0, 'admin']
      );
      console.log('Created admin user:', adminEmail);
    } else {
      console.log('Admin user already exists with email:', existingAdmin[0].email);
    }

    // Check for rogue '\xAD' entry
    const rogueId = Buffer.from('AD', 'hex');
    const [rogueEntry] = await pool.query('SELECT HEX(id) AS id FROM employee WHERE id = ?', [rogueId]);
    if (rogueEntry.length > 0) {
      console.warn('Found rogue entry with ID \\xAD, consider running: DELETE FROM employee WHERE id = X"AD"');
    }

    // Load apple_watch_data.csv
    const appleFilePath = 'data/apple_watch_data.csv';
    if (fs.existsSync(appleFilePath)) {
      console.log('Loading apple_watch_data.csv...');
      const appleStats = fs.statSync(appleFilePath);
      console.log(`apple_watch_data.csv size: ${appleStats.size} bytes`);

      const wearableLogs = [];
      await new Promise((resolve, reject) => {
        fs.createReadStream(appleFilePath)
          .pipe(fastcsv.parse({ headers: true, ignoreEmpty: true }))
          .on('data', (row) => {
            const employeeId = Buffer.from('8f7b7927-6c04-401a-ab0b-61000132f970'.replace(/-/g, ''), 'hex');
            wearableLogs.push({
              id: Buffer.from(require('crypto').randomUUID().replace(/-/g, ''), 'hex'),
              employee_id: employeeId,
              log_date: parseDate(row.Date),
              step_count: parseInt(row['Step Count (steps)']) || 0,
              active_energy_kj: parseFloat(row['Active Energy (kJ)']) || 0,
              exercise_time_min: parseInt(row['Apple Exercise Time (min)']) || 0,
              stand_hours: parseInt(row['Apple Stand Hour (hours)']) || 0,
              stand_time_min: parseInt(row['Apple Stand Time (min)']) || 0,
              env_audio_exposure: parseFloat(row['Environmental Audio Exposure (dBASPL)']) || null,
              flights_climbed: parseFloat(row['Flights Climbed (count)']) || null,
              headphone_audio_exposure: parseFloat(row['Headphone Audio Exposure (dBASPL)']) || null,
              heart_rate_min: parseInt(row['Heart Rate [Min] (bpm)']) || null,
              heart_rate_max: parseInt(row['Heart Rate [Max] (bpm)']) || null,
              heart_rate_avg: parseFloat(row['Heart Rate [Avg] (bpm)']) || null,
              heart_rate_variability: parseFloat(row['Heart Rate Variability (ms)']) || null,
              physical_effort_met: parseFloat(row['Physical Effort (MET)']) || null,
              resting_energy_kj: parseFloat(row['Resting Energy (kJ)']) || null,
              resting_heart_rate: parseFloat(row['Resting Heart Rate (bpm)']) || null,
              walking_running_distance_km: parseFloat(row['Walking + Running Distance (km)']) || 0,
            });
          })
          .on('end', async (rowCount) => {
            if (wearableLogs.length > 0) {
              const [result] = await pool.query(
                'INSERT INTO wearable_log (id, employee_id, log_date, step_count, active_energy_kj, exercise_time_min, stand_hours, stand_time_min, env_audio_exposure, flights_climbed, headphone_audio_exposure, heart_rate_min, heart_rate_max, heart_rate_avg, heart_rate_variability, physical_effort_met, resting_energy_kj, resting_heart_rate, walking_running_distance_km) VALUES ?',
                [wearableLogs.map(w => [w.id, w.employee_id, w.log_date, w.step_count, w.active_energy_kj, w.exercise_time_min, w.stand_hours, w.stand_time_min, w.env_audio_exposure, w.flights_climbed, w.headphone_audio_exposure, w.heart_rate_min, w.heart_rate_max, w.heart_rate_avg, w.heart_rate_variability, w.physical_effort_met, w.resting_energy_kj, w.resting_heart_rate, w.walking_running_distance_km])]
              );
              console.log(`Inserted ${result.affectedRows} wearable logs from apple_watch_data.csv`);
            }
            resolve();
          })
          .on('error', (error) => {
            console.error('Error parsing apple_watch_data.csv:', error.stack);
            reject(error);
          });
        });
    } else {
      console.error(`Error: ${appleFilePath} not found`);
    }

    console.log('CSV data loading completed.');
  } catch (error) {
    console.error('Error loading CSV data:', error.stack);
    throw error;
  }
}

module.exports = loadCsvData;