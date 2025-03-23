const pool = require('../config/database');
const { parseDate, parseTime } = require('../utils');

async function getPreviousWearableLog(employeeId, logDate) {
  const [previous] = await pool.query(
    'SELECT * FROM wearable_log WHERE employee_id = ? AND log_date < ? ORDER BY log_date DESC LIMIT 1',
    [employeeId, logDate]
  );
  return previous.length > 0 ? previous[0] : null;
}

exports.getWearableLogsByEmployeeId = async (req, res) => {
  try {
    const employeeId = Buffer.from(req.params.employeeId.replace(/-/g, ''), 'hex');
    const [rows] = await pool.query(
      'SELECT HEX(id) AS id, HEX(employee_id) AS employee_id, log_date, step_count, active_energy_kj, exercise_time_min, stand_hours, stand_time_min, env_audio_exposure, flights_climbed, headphone_audio_exposure, heart_rate_min, heart_rate_max, heart_rate_avg, heart_rate_variability, physical_effort_met, resting_energy_kj, resting_heart_rate, walking_running_distance_km, walking_heart_rate_avg, walking_speed_kmh, walking_step_length_cm, sleep_start, sleep_end, sleep_quality, time_in_bed, heart_rate_sleep, notes FROM wearable_log WHERE employee_id = ? ORDER BY log_date DESC LIMIT 30',
      [employeeId]
    );
    res.json(rows.map(row => ({
      ...row,
      employee_id: row.employee_id ? `${row.employee_id.match(/.{1,8}/g).join('-')}` : null,
      id: row.id ? `${row.id.match(/.{1,8}/g).join('-')}` : null
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createWearableLog = async (req, res) => {
  try {
    const {
      employee_id,
      log_date,
      step_count,
      active_energy_kj,
      exercise_time_min,
      stand_hours,
      stand_time_min,
      env_audio_exposure,
      flights_climbed,
      headphone_audio_exposure,
      heart_rate_min,
      heart_rate_max,
      heart_rate_avg,
      heart_rate_variability,
      physical_effort_met,
      resting_energy_kj,
      resting_heart_rate,
      walking_running_distance_km,
      walking_heart_rate_avg,
      walking_speed_kmh,
      walking_step_length_cm,
      sleep_start,
      sleep_end,
      sleep_quality,
      time_in_bed,
      heart_rate_sleep,
      notes
    } = req.body;

    if (!employee_id || !log_date) return res.status(400).json({ error: 'Employee ID and log date are required' });
    const employeeId = Buffer.from(employee_id.replace(/-/g, ''), 'hex');
    const parsedLogDate = parseDate(log_date);

    const previous = await getPreviousWearableLog(employeeId, parsedLogDate);
    const defaults = previous || {
      step_count: 0,
      active_energy_kj: 0,
      exercise_time_min: 0,
      stand_hours: 0,
      stand_time_min: 0,
      walking_running_distance_km: 0
    };

    const wearableLog = {
      id: Buffer.from(require('crypto').randomUUID().replace(/-/g, ''), 'hex'),
      employee_id: employeeId,
      log_date: parsedLogDate,
      step_count: step_count != null ? parseInt(step_count) : defaults.step_count,
      active_energy_kj: active_energy_kj != null ? parseFloat(active_energy_kj) : defaults.active_energy_kj,
      exercise_time_min: exercise_time_min != null ? parseInt(exercise_time_min) : defaults.exercise_time_min,
      stand_hours: stand_hours != null ? parseInt(stand_hours) : defaults.stand_hours,
      stand_time_min: stand_time_min != null ? parseInt(stand_time_min) : defaults.stand_time_min,
      env_audio_exposure: env_audio_exposure != null ? parseFloat(env_audio_exposure) : null,
      flights_climbed: flights_climbed != null ? parseFloat(flights_climbed) : null,
      headphone_audio_exposure: headphone_audio_exposure != null ? parseFloat(headphone_audio_exposure) : null,
      heart_rate_min: heart_rate_min != null ? parseInt(heart_rate_min) : null,
      heart_rate_max: heart_rate_max != null ? parseInt(heart_rate_max) : null,
      heart_rate_avg: heart_rate_avg != null ? parseFloat(heart_rate_avg) : null,
      heart_rate_variability: heart_rate_variability != null ? parseFloat(heart_rate_variability) : null,
      physical_effort_met: physical_effort_met != null ? parseFloat(physical_effort_met) : null,
      resting_energy_kj: resting_energy_kj != null ? parseFloat(resting_energy_kj) : null,
      resting_heart_rate: resting_heart_rate != null ? parseFloat(resting_heart_rate) : null,
      walking_running_distance_km: walking_running_distance_km != null ? parseFloat(walking_running_distance_km) : defaults.walking_running_distance_km,
      walking_heart_rate_avg: walking_heart_rate_avg != null ? parseFloat(walking_heart_rate_avg) : null,
      walking_speed_kmh: walking_speed_kmh != null ? parseFloat(walking_speed_kmh) : null,
      walking_step_length_cm: walking_step_length_cm != null ? parseFloat(walking_step_length_cm) : null,
      sleep_start: sleep_start ? parseTime(sleep_start) : null,
      sleep_end: sleep_end ? parseTime(sleep_end) : null,
      sleep_quality: sleep_quality != null ? parseFloat(sleep_quality) : null,
      time_in_bed: time_in_bed != null ? parseInt(time_in_bed) : null,
      heart_rate_sleep: heart_rate_sleep != null ? parseInt(heart_rate_sleep) : null,
      notes: notes || null
    };

    // Check and enforce 30-record limit
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as count FROM wearable_log WHERE employee_id = ?',
      [employeeId]
    );
    if (countResult[0].count >= 30) {
      await pool.query(
        'DELETE FROM wearable_log WHERE employee_id = ? ORDER BY log_date ASC LIMIT 1',
        [employeeId]
      );
    }

    await pool.query(
      'INSERT INTO wearable_log SET ?',
      wearableLog
    );

    res.status(201).json({
      id: `${wearableLog.id.toString('hex').match(/.{1,8}/g).join('-')}`,
      ...wearableLog,
      employee_id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateWearableLog = async (req, res) => {
  try {
    const wearableLogId = Buffer.from(req.params.id.replace(/-/g, ''), 'hex');
    const {
      employee_id,
      log_date,
      step_count,
      active_energy_kj,
      exercise_time_min,
      stand_hours,
      stand_time_min,
      env_audio_exposure,
      flights_climbed,
      headphone_audio_exposure,
      heart_rate_min,
      heart_rate_max,
      heart_rate_avg,
      heart_rate_variability,
      physical_effort_met,
      resting_energy_kj,
      resting_heart_rate,
      walking_running_distance_km,
      walking_heart_rate_avg,
      walking_speed_kmh,
      walking_step_length_cm,
      sleep_start,
      sleep_end,
      sleep_quality,
      time_in_bed,
      heart_rate_sleep,
      notes
    } = req.body;

    if (!employee_id || !log_date) return res.status(400).json({ error: 'Employee ID and log date are required' });
    const employeeId = Buffer.from(employee_id.replace(/-/g, ''), 'hex');
    const parsedLogDate = parseDate(log_date);

    const previous = await getPreviousWearableLog(employeeId, parsedLogDate);
    const defaults = previous || {
      step_count: 0,
      active_energy_kj: 0,
      exercise_time_min: 0,
      stand_hours: 0,
      stand_time_min: 0,
      walking_running_distance_km: 0
    };

    const wearableLog = {
      employee_id: employeeId,
      log_date: parsedLogDate,
      step_count: step_count != null ? parseInt(step_count) : defaults.step_count,
      active_energy_kj: active_energy_kj != null ? parseFloat(active_energy_kj) : defaults.active_energy_kj,
      exercise_time_min: exercise_time_min != null ? parseInt(exercise_time_min) : defaults.exercise_time_min,
      stand_hours: stand_hours != null ? parseInt(stand_hours) : defaults.stand_hours,
      stand_time_min: stand_time_min != null ? parseInt(stand_time_min) : defaults.stand_time_min,
      env_audio_exposure: env_audio_exposure != null ? parseFloat(env_audio_exposure) : null,
      flights_climbed: flights_climbed != null ? parseFloat(flights_climbed) : null,
      headphone_audio_exposure: headphone_audio_exposure != null ? parseFloat(headphone_audio_exposure) : null,
      heart_rate_min: heart_rate_min != null ? parseInt(heart_rate_min) : null,
      heart_rate_max: heart_rate_max != null ? parseInt(heart_rate_max) : null,
      heart_rate_avg: heart_rate_avg != null ? parseFloat(heart_rate_avg) : null,
      heart_rate_variability: heart_rate_variability != null ? parseFloat(heart_rate_variability) : null,
      physical_effort_met: physical_effort_met != null ? parseFloat(physical_effort_met) : null,
      resting_energy_kj: resting_energy_kj != null ? parseFloat(resting_energy_kj) : null,
      resting_heart_rate: resting_heart_rate != null ? parseFloat(resting_heart_rate) : null,
      walking_running_distance_km: walking_running_distance_km != null ? parseFloat(walking_running_distance_km) : defaults.walking_running_distance_km,
      walking_heart_rate_avg: walking_heart_rate_avg != null ? parseFloat(walking_heart_rate_avg) : null,
      walking_speed_kmh: walking_speed_kmh != null ? parseFloat(walking_speed_kmh) : null,
      walking_step_length_cm: walking_step_length_cm != null ? parseFloat(walking_step_length_cm) : null,
      sleep_start: sleep_start ? parseTime(sleep_start) : null,
      sleep_end: sleep_end ? parseTime(sleep_end) : null,
      sleep_quality: sleep_quality != null ? parseFloat(sleep_quality) : null,
      time_in_bed: time_in_bed != null ? parseInt(time_in_bed) : null,
      heart_rate_sleep: heart_rate_sleep != null ? parseInt(heart_rate_sleep) : null,
      notes: notes || null
    };

    const [result] = await pool.query(
      'UPDATE wearable_log SET ? WHERE id = ?',
      [wearableLog, wearableLogId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Wearable log not found' });
    res.json({ id: req.params.id, ...wearableLog, employee_id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteWearableLog = async (req, res) => {
  try {
    const wearableLogId = Buffer.from(req.params.id.replace(/-/g, ''), 'hex');
    const [result] = await pool.query('DELETE FROM wearable_log WHERE id = ?', [wearableLogId]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Wearable log not found' });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = exports;