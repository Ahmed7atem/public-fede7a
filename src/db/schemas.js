const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: 'health_predictions',
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const createTables = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create patients table
    await client.query(`
      CREATE TABLE IF NOT EXISTS patients (
        patient_id UUID PRIMARY KEY,
        age INTEGER NOT NULL,
        age_group VARCHAR(10) NOT NULL,
        gender VARCHAR(10) NOT NULL,
        weight_kg DECIMAL(5,2) NOT NULL,
        height_cm DECIMAL(5,2) NOT NULL,
        bmi DECIMAL(5,2) NOT NULL,
        children INTEGER NOT NULL,
        smoker BOOLEAN NOT NULL,
        chronic_disease VARCHAR(100),
        chronic_disease_count INTEGER NOT NULL,
        family_medical_history TEXT,
        education VARCHAR(50) NOT NULL,
        department VARCHAR(50) NOT NULL,
        recruitment_channel VARCHAR(50) NOT NULL,
        no_of_trainings INTEGER NOT NULL,
        previous_year_rating INTEGER NOT NULL,
        length_of_service INTEGER NOT NULL,
        kpis_met_80 BOOLEAN NOT NULL,
        avg_training_score INTEGER NOT NULL
      );
    `);

    // Create insurance_policies table
    await client.query(`
      CREATE TABLE IF NOT EXISTS insurance_policies (
        policy_id UUID PRIMARY KEY,
        patient_id UUID REFERENCES patients(patient_id),
        plan_name VARCHAR(50) NOT NULL,
        coverage_details TEXT NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        claimed_amount DECIMAL(10,2) NOT NULL
      );
    `);

    // Create health_metrics table
    await client.query(`
      CREATE TABLE IF NOT EXISTS health_metrics (
        patient_id UUID REFERENCES patients(patient_id),
        hemoglobin DECIMAL(5,2) NOT NULL,
        cholesterol DECIMAL(5,2) NOT NULL,
        blood_sugar DECIMAL(5,2) NOT NULL,
        creatinine DECIMAL(5,2) NOT NULL,
        insurance_score DECIMAL(3,2) NOT NULL,
        smoker_score DECIMAL(3,2) NOT NULL,
        family_score DECIMAL(3,2) NOT NULL,
        lifestyle_score DECIMAL(3,2) NOT NULL,
        bmi_score DECIMAL(3,2) NOT NULL,
        hemoglobin_score DECIMAL(3,2) NOT NULL,
        sugar_score DECIMAL(3,2) NOT NULL,
        cholesterol_score DECIMAL(3,2) NOT NULL,
        creatinine_score DECIMAL(3,2) NOT NULL,
        physical_score DECIMAL(3,2) NOT NULL,
        wellness_score DECIMAL(3,2) NOT NULL,
        PRIMARY KEY (patient_id)
      );
    `);

    await client.query('COMMIT');
    console.log('Tables created successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating tables:', err);
    throw err;
  } finally {
    client.release();
  }
};

module.exports = {
  pool,
  createTables
}; 