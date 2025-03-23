const pool = require('../config/database');
const axios = require('axios');
require('dotenv').config();
const AI_URL = process.env.AI_URL;

async function predict(employeeId) {
  try {
    const employeeIdBinary = Buffer.from(employeeId.replace(/-/g, ''), 'hex');

    // Fetch latest health data
    const [healthRows] = await pool.query(
      'SELECT weight, height, bmi, hemoglobin, cholesterol, blood_sugar, creatinine, chronic_disease, family_medical_history FROM health_data WHERE employee_id = ? ORDER BY recorded_at DESC LIMIT 1',
      [employeeIdBinary]
    );
    if (healthRows.length === 0) {
      throw new Error('No health data available for prediction');
    }

    // Fetch last 30 days of wearable data for trends
    const [wearableRows] = await pool.query(
      'SELECT step_count, active_energy_kj, exercise_time_min, heart_rate_avg, heart_rate_variability, sleep_quality, time_in_bed, heart_rate_sleep, walking_running_distance_km FROM wearable_log WHERE employee_id = ? AND log_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) ORDER BY log_date DESC',
      [employeeIdBinary]
    );
    if (wearableRows.length === 0) {
      throw new Error('No wearable data available for prediction');
    }

    // Aggregate wearable data
    const wearableAvg = wearableRows.reduce(
      (acc, row) => ({
        step_count: acc.step_count + (row.step_count || 0),
        active_energy_kj: acc.active_energy_kj + (row.active_energy_kj || 0),
        exercise_time_min: acc.exercise_time_min + (row.exercise_time_min || 0),
        heart_rate_avg: acc.heart_rate_avg + (row.heart_rate_avg || 0),
        heart_rate_variability: acc.heart_rate_variability + (row.heart_rate_variability || 0),
        sleep_quality: acc.sleep_quality + (row.sleep_quality || 0),
        time_in_bed: acc.time_in_bed + (row.time_in_bed || 0),
        heart_rate_sleep: acc.heart_rate_sleep + (row.heart_rate_sleep || 0),
        walking_running_distance_km: acc.walking_running_distance_km + (row.walking_running_distance_km || 0),
      }),
      {
        step_count: 0,
        active_energy_kj: 0,
        exercise_time_min: 0,
        heart_rate_avg: 0,
        heart_rate_variability: 0,
        sleep_quality: 0,
        time_in_bed: 0,
        heart_rate_sleep: 0,
        walking_running_distance_km: 0,
      }
    );

    const count = wearableRows.length;
    const predictionData = {
      ...healthRows[0],
      avg_step_count: wearableAvg.step_count / count,
      avg_active_energy_kj: wearableAvg.active_energy_kj / count,
      avg_exercise_time_min: wearableAvg.exercise_time_min / count,
      avg_heart_rate: wearableAvg.heart_rate_avg / count,
      avg_heart_rate_variability: wearableAvg.heart_rate_variability / count,
      avg_sleep_quality: wearableAvg.sleep_quality / count,
      avg_time_in_bed: wearableAvg.time_in_bed / count,
      avg_heart_rate_sleep: wearableAvg.heart_rate_sleep / count,
      avg_walking_running_distance_km: wearableAvg.walking_running_distance_km / count,
    };

    const response = await axios.post(AI_URL, predictionData).catch(() => {
      return { data: { message: 'AI model not yet available' } };
    });

    return { employee_id: employeeId, prediction: response.data };
  } catch (error) {
    throw new Error(`Prediction failed: ${error.message}`);
  }
}

module.exports = {
  predict,
};