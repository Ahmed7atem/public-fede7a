const pool = require('../config/database');

async function getAllData() {
  try {
    // Fetch all employees
    const [employees] = await pool.query('SELECT HEX(id) AS id, name, email, age, gender, children, smoker, role FROM employee');
    const formattedEmployees = employees.map(emp => ({
      id: emp.id ? emp.id.toLowerCase().match(/.{1,8}/g).join('-') : null,
      name: emp.name,
      email: emp.email,
      age: emp.age,
      gender: emp.gender,
      children: emp.children,
      smoker: emp.smoker,
      role: emp.role,
      health_data: [],
      wearable_logs: []
    }));

    // Fetch health data (limited to 30 per employee using ROW_NUMBER)
    const [healthRows] = await pool.query(`
      SELECT HEX(h.id) AS id, HEX(h.employee_id) AS employee_id, h.recorded_at, h.weight, h.height, h.bmi, 
             h.hemoglobin, h.cholesterol, h.blood_sugar, h.creatinine, h.chronic_disease, h.family_medical_history
      FROM (
        SELECT id, employee_id, recorded_at, weight, height, bmi, hemoglobin, cholesterol, blood_sugar, creatinine, 
               chronic_disease, family_medical_history,
               ROW_NUMBER() OVER (PARTITION BY employee_id ORDER BY recorded_at DESC) AS rn
        FROM health_data
      ) h
      WHERE h.rn <= 30
    `);
    const formattedHealthData = healthRows.map(row => ({
      id: row.id ? row.id.toLowerCase().match(/.{1,8}/g).join('-') : null,
      employee_id: row.employee_id ? row.employee_id.toLowerCase().match(/.{1,8}/g).join('-') : null,
      recorded_at: row.recorded_at,
      weight: row.weight,
      height: row.height,
      bmi: row.bmi,
      hemoglobin: row.hemoglobin,
      cholesterol: row.cholesterol,
      blood_sugar: row.blood_sugar,
      creatinine: row.creatinine,
      chronic_disease: row.chronic_disease,
      family_medical_history: row.family_medical_history
    }));

    // Fetch wearable logs (limited to 30 per employee using ROW_NUMBER)
    const [wearableRows] = await pool.query(`
      SELECT HEX(w.id) AS id, HEX(w.employee_id) AS employee_id, w.log_date, w.step_count, w.active_energy_kj, 
             w.exercise_time_min, w.stand_hours, w.stand_time_min, w.env_audio_exposure, w.flights_climbed, 
             w.headphone_audio_exposure, w.heart_rate_min, w.heart_rate_max, w.heart_rate_avg, 
             w.heart_rate_variability, w.physical_effort_met, w.resting_energy_kj, w.resting_heart_rate, 
             w.walking_running_distance_km, w.walking_heart_rate_avg, w.walking_speed_kmh, 
             w.walking_step_length_cm, w.sleep_start, w.sleep_end, w.sleep_quality, w.time_in_bed, 
             w.heart_rate_sleep, w.notes
      FROM (
        SELECT id, employee_id, log_date, step_count, active_energy_kj, exercise_time_min, stand_hours, 
               stand_time_min, env_audio_exposure, flights_climbed, headphone_audio_exposure, heart_rate_min, 
               heart_rate_max, heart_rate_avg, heart_rate_variability, physical_effort_met, resting_energy_kj, 
               resting_heart_rate, walking_running_distance_km, walking_heart_rate_avg, walking_speed_kmh, 
               walking_step_length_cm, sleep_start, sleep_end, sleep_quality, time_in_bed, heart_rate_sleep, notes,
               ROW_NUMBER() OVER (PARTITION BY employee_id ORDER BY log_date DESC) AS rn
        FROM wearable_log
      ) w
      WHERE w.rn <= 30
    `);
    const formattedWearableLogs = wearableRows.map(row => ({
      id: row.id ? row.id.toLowerCase().match(/.{1,8}/g).join('-') : null,
      employee_id: row.employee_id ? row.employee_id.toLowerCase().match(/.{1,8}/g).join('-') : null,
      log_date: row.log_date,
      step_count: row.step_count,
      active_energy_kj: row.active_energy_kj,
      exercise_time_min: row.exercise_time_min,
      stand_hours: row.stand_hours,
      stand_time_min: row.stand_time_min,
      env_audio_exposure: row.env_audio_exposure,
      flights_climbed: row.flights_climbed,
      headphone_audio_exposure: row.headphone_audio_exposure,
      heart_rate_min: row.heart_rate_min,
      heart_rate_max: row.heart_rate_max,
      heart_rate_avg: row.heart_rate_avg,
      heart_rate_variability: row.heart_rate_variability,
      physical_effort_met: row.physical_effort_met,
      resting_energy_kj: row.resting_energy_kj,
      resting_heart_rate: row.resting_heart_rate,
      walking_running_distance_km: row.walking_running_distance_km,
      walking_heart_rate_avg: row.walking_heart_rate_avg,
      walking_speed_kmh: row.walking_speed_kmh,
      walking_step_length_cm: row.walking_step_length_cm,
      sleep_start: row.sleep_start,
      sleep_end: row.sleep_end,
      sleep_quality: row.sleep_quality,
      time_in_bed: row.time_in_bed,
      heart_rate_sleep: row.heart_rate_sleep,
      notes: row.notes
    }));

    // Combine the data
    for (const employee of formattedEmployees) {
      employee.health_data = formattedHealthData.filter(h => h.employee_id === employee.id);
      employee.wearable_logs = formattedWearableLogs.filter(w => w.employee_id === employee.id);
      console.log(`Employee ${employee.id}:`, {
        health_data_count: employee.health_data.length,
        wearable_logs_count: employee.wearable_logs.length
      });
    }

    return formattedEmployees;
  } catch (error) {
    throw new Error(`Failed to fetch all data: ${error.message}`);
  }
}

module.exports = { getAllData };