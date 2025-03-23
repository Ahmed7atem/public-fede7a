-- Employee table: Store basic employee info and static health-related fields
CREATE TABLE employee (
  id BINARY(16) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  age INT NOT NULL,              -- Non-nullable, use previous reading or default if missing
  gender VARCHAR(50) NOT NULL,   -- Non-nullable, use previous reading or default if missing
  password VARCHAR(255) NOT NULL,
  children INT NOT NULL,         -- Non-nullable, default to 0 if missing
  smoker TINYINT(1) NOT NULL,    -- Non-nullable, default to 0 (non-smoker) if missing
  role ENUM('employee', 'admin') DEFAULT 'employee' NOT NULL
);

-- Health data table: Store medical lab results (up to 30 historical readings per employee)
CREATE TABLE health_data (
  id BINARY(16) PRIMARY KEY,
  employee_id BINARY(16) NOT NULL,
  recorded_at DATETIME NOT NULL, -- Timestamp of the lab result
  weight DECIMAL(10, 2) NOT NULL, -- Non-nullable, use previous reading if missing
  height DECIMAL(10, 2) NOT NULL, -- Non-nullable, use previous reading if missing
  bmi DECIMAL(10, 2) NOT NULL,    -- Non-nullable, use previous reading if missing
  hemoglobin DECIMAL(10, 2) NOT NULL, -- Non-nullable, use previous reading if missing
  cholesterol DECIMAL(10, 2) NOT NULL, -- Non-nullable, use previous reading if missing
  blood_sugar DECIMAL(10, 2) NOT NULL, -- Non-nullable, use previous reading if missing
  creatinine DECIMAL(10, 2) NOT NULL,  -- Non-nullable, use previous reading if missing
  chronic_disease TEXT,           -- Nullable, as not all employees have chronic diseases
  family_medical_history TEXT,    -- Nullable, as family history might not be provided
  FOREIGN KEY (employee_id) REFERENCES employee(id)
);

-- Wearable log table: Store daily wearable and sleep data (up to 30 readings per employee)
CREATE TABLE wearable_log (
  id BINARY(16) PRIMARY KEY,
  employee_id BINARY(16) NOT NULL,
  log_date DATE NOT NULL,               -- Non-nullable, date of the reading
  step_count INT NOT NULL,              -- Non-nullable, use previous reading if missing
  active_energy_kj DECIMAL(10, 2) NOT NULL, -- Non-nullable, use previous reading if missing
  exercise_time_min INT NOT NULL,       -- Non-nullable, use previous reading if missing
  stand_hours INT NOT NULL,             -- Non-nullable, use previous reading if missing
  stand_time_min INT NOT NULL,          -- Non-nullable, use previous reading if missing
  env_audio_exposure DECIMAL(10, 2),    -- Nullable, as IoT might not capture this
  flights_climbed DECIMAL(10, 2),       -- Nullable, as not all devices track this
  headphone_audio_exposure DECIMAL(10, 2), -- Nullable, as IoT might not capture this
  heart_rate_min INT,                   -- Nullable, as IoT might fail to record
  heart_rate_max INT,                   -- Nullable, as IoT might fail to record
  heart_rate_avg DECIMAL(10, 2),        -- Nullable, as IoT might fail to record
  heart_rate_variability DECIMAL(10, 2), -- Nullable, as IoT might fail to record
  physical_effort_met DECIMAL(10, 2),   -- Nullable, as MET might not be calculated
  resting_energy_kj DECIMAL(10, 2),     -- Nullable, as resting energy might not be recorded
  resting_heart_rate DECIMAL(10, 2),    -- Nullable, as IoT might fail to record
  walking_running_distance_km DECIMAL(10, 2) NOT NULL, -- Non-nullable, use previous reading if missing
  walking_heart_rate_avg DECIMAL(10, 2), -- Nullable, as IoT might fail to record
  walking_speed_kmh DECIMAL(10, 2),     -- Nullable, as speed might not be tracked
  walking_step_length_cm DECIMAL(10, 2), -- Nullable, as step length might not be tracked
  sleep_start TIME,                     -- Nullable, as sleep might not be tracked
  sleep_end TIME,                       -- Nullable, as sleep might not be tracked
  sleep_quality DECIMAL(10, 2),         -- Nullable, as sleep quality might not be recorded
  time_in_bed INT,                      -- Nullable, as time in bed might not be recorded
  heart_rate_sleep INT,                 -- Nullable, as IoT might fail to record
  notes TEXT,                           -- Nullable, as notes are optional
  FOREIGN KEY (employee_id) REFERENCES employee(id)
);

CREATE TABLE feedback_tickets (
  id BINARY(16) PRIMARY KEY,
  employee_id BINARY(16) NOT NULL,
  submitted_at DATETIME NOT NULL,
  feedback TEXT NOT NULL,
  status ENUM('pending', 'sent', 'resolved') DEFAULT 'pending' NOT NULL,
  FOREIGN KEY (employee_id) REFERENCES employee(id)
);


-- Indexes for better query performance
CREATE INDEX idx_health_data_employee_id ON health_data (employee_id);
CREATE INDEX idx_health_data_recorded_at ON health_data (recorded_at);
CREATE INDEX idx_wearable_log_employee_id ON wearable_log (employee_id);
CREATE INDEX idx_wearable_log_log_date ON wearable_log (log_date);
CREATE INDEX idx_feedback_tickets_employee_id ON feedback_tickets (employee_id);
