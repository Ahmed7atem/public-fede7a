package com.medbondbackend.config;

import com.medbondbackend.model.Employee;
import com.medbondbackend.model.HealthData;
import com.medbondbackend.model.WearableLog;
import com.medbondbackend.repository.EmployeeRepository;
import com.medbondbackend.repository.HealthDataRepository;
import com.medbondbackend.repository.WearableLogRepository;
import com.opencsv.CSVParser;
import com.opencsv.CSVParserBuilder;
import com.opencsv.CSVReader;
import com.opencsv.CSVReaderBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.io.InputStreamReader;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;

@Component
public class CsvDataLoader implements CommandLineRunner {
    private static final Logger logger = LoggerFactory.getLogger(CsvDataLoader.class);

    private final HealthDataRepository healthDataRepository;
    private final EmployeeRepository employeeRepository;
    private final WearableLogRepository wearableLogRepository;

    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("hh:mm:ss a");
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("M/d/yyyy");

    public CsvDataLoader(HealthDataRepository healthDataRepository,
                         EmployeeRepository employeeRepository,
                         WearableLogRepository wearableLogRepository) {
        this.healthDataRepository = healthDataRepository;
        this.employeeRepository = employeeRepository;
        this.wearableLogRepository = wearableLogRepository;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        loadPatientData();
        loadSleepData();
        loadAppleWatchData();
    }

    public void loadPatientData() throws Exception {
        InputStream inputStream = getClass().getResourceAsStream("/data/GP-2025-full-data.csv");
        if (inputStream == null) {
            logger.error("Patient CSV file not found: /data/GP-2025-full-data.csv");
            return;
        }
        logger.info("Loading patient data from /data/GP-2025-full-data.csv");

        CSVParser parser = new CSVParserBuilder().withSeparator(',').withIgnoreQuotations(false).build();
        try (CSVReader reader = new CSVReaderBuilder(new InputStreamReader(inputStream))
                .withCSVParser(parser)
                .build()) {

            reader.readNext(); // Skip header
            List<Employee> employeesToSave = new ArrayList<>();
            int batchSize = 1000;
            int rowCount = 0;

            String[] row;
            while ((row = reader.readNext()) != null) {
                rowCount++;
                Employee employee = parseEmployee(row);
                HealthData healthData = parseHealthData(row, employee);
                // Link HealthData to Employee for cascading
                employee.setHealthData(Collections.singletonList(healthData));

                employeesToSave.add(employee);

                if (rowCount % batchSize == 0) {
                    employeeRepository.saveAll(employeesToSave);
                    employeesToSave.clear();
                    logger.info("Processed {} patient rows", rowCount);
                }
            }

            if (!employeesToSave.isEmpty()) {
                employeeRepository.saveAll(employeesToSave);
            }
            logger.info("Finished loading patient data. Total rows: {}", rowCount);
        }
    }
    public void loadSleepData() throws Exception {
        InputStream inputStream = getClass().getResourceAsStream("/data/sleep_data.csv");
        if (inputStream == null) {
            logger.error("Sleep CSV file not found: /data/sleep_data.csv");
            return;
        }
        logger.info("Loading sleep data from /data/sleep_data.csv");

        List<Employee> employees = employeeRepository.findAll();
        if (employees.isEmpty()) {
            logger.error("No employees found to assign Sleep wearable data!");
            return;
        }

        CSVParser parser = new CSVParserBuilder().withSeparator(',').withIgnoreQuotations(false).build();
        try (CSVReader reader = new CSVReaderBuilder(new InputStreamReader(inputStream))
                .withCSVParser(parser)
                .build()) {

            reader.readNext(); // Skip header
            List<WearableLog> logsToSave = new ArrayList<>();
            int batchSize = 1000;
            int rowCount = 0;
            Random random = new Random();

            String[] row;
            while ((row = reader.readNext()) != null) {
                rowCount++;
                WearableLog log = new WearableLog();
                Employee randomEmployee = employees.get(random.nextInt(employees.size()));
                log.setPatientId(randomEmployee.getId().toString());
                log.setLogDate(parseSleepDate(row[0]));
                log.setSleepStart(parseSleepTime(row[0]));
                log.setSleepEnd(parseSleepTime(row[1]));
                log.setSleepQuality(row[2]);
                log.setTimeInBed(row[3]);
                log.setSleepNotes(row[4].isEmpty() ? null : row[4]);
                log.setHeartRateSleep(parseIntSafe(row[5]));
                logsToSave.add(log);

                if (rowCount % batchSize == 0) {
                    wearableLogRepository.saveAll(logsToSave);
                    logsToSave.clear();
                    logger.info("Processed {} sleep rows", rowCount);
                }
            }

            if (!logsToSave.isEmpty()) {
                wearableLogRepository.saveAll(logsToSave);
            }
            logger.info("Finished loading sleep data. Total rows: {}", rowCount);
        }
    }

    public void loadAppleWatchData() throws Exception {
        InputStream inputStream = getClass().getResourceAsStream("/data/apple_watch_data.csv");
        if (inputStream == null) {
            logger.error("Apple Watch CSV file not found: /data/apple_watch_data.csv");
            return;
        }
        logger.info("Loading Apple Watch data from /data/apple_watch_data.csv");

        List<Employee> employees = employeeRepository.findAll();
        if (employees.isEmpty()) {
            logger.error("No employees found to assign wearable data!");
            return;
        }

        CSVParser parser = new CSVParserBuilder().withSeparator(',').withIgnoreQuotations(false).build();
        try (CSVReader reader = new CSVReaderBuilder(new InputStreamReader(inputStream))
                .withCSVParser(parser)
                .build()) {

            reader.readNext(); // Skip header
            List<WearableLog> logsToSave = new ArrayList<>();
            int batchSize = 1000;
            int rowCount = 0;
            Random random = new Random();

            String[] row;
            while ((row = reader.readNext()) != null) {
                rowCount++;
                WearableLog log = new WearableLog();
                Employee randomEmployee = employees.get(random.nextInt(employees.size()));
                log.setPatientId(randomEmployee.getId().toString());
                log.setLogDate(LocalDate.parse(row[0], DATE_FORMATTER).atStartOfDay());
                log.setActiveEnergyKj(parseDoubleSafe(row[1]));
                log.setExerciseTimeMin(parseIntSafe(row[2]));
                log.setStandHours(parseIntSafe(row[3]));
                log.setStepCount(parseIntSafe(row[15]));
                log.setWalkingRunningDistanceKm(parseDoubleSafe(row[16]));
                log.setHeartRateAvg(parseDoubleSafe(row[10]));
                logsToSave.add(log);

                if (rowCount % batchSize == 0) {
                    wearableLogRepository.saveAll(logsToSave);
                    logsToSave.clear();
                    logger.info("Processed {} Apple Watch rows", rowCount);
                }
            }

            if (!logsToSave.isEmpty()) {
                wearableLogRepository.saveAll(logsToSave);
            }
            logger.info("Finished loading Apple Watch data. Total rows: {}", rowCount);
        }
    }

    // [Rest of the methods - parseEmployee, parseHealthData, etc. - remain unchanged]
    private Employee parseEmployee(String[] row) {
        Employee employee = new Employee();
        String patientId = row[0].trim();
        try {
            employee.setId(UUID.fromString(patientId));
        } catch (IllegalArgumentException e) {
            employee.setId(UUID.randomUUID());
        }
        employee.setEmail("patient-" + patientId + "@example.com");
        employee.setName("John Doe");
        employee.setRole("USER");
        employee.setDepartment("Default");
        return employee;
    }

    private HealthData parseHealthData(String[] row, Employee employee) {
        HealthData healthData = new HealthData();
        healthData.setEmployee(employee);

        healthData.setAge(parseIntSafe(row[1]));
        healthData.setGender(row[2].trim());
        healthData.setWeight(parseDoubleSafe(row[3]));
        healthData.setHeight(parseDoubleSafe(row[4]));
        healthData.setSmoker(row[6].trim().equalsIgnoreCase("yes"));
        healthData.setBmi(parseDoubleSafe(row[7]));
        healthData.setChronicDiseaseCount(countChronicDiseases(row[8]));
        healthData.setFamilyChronicDiseaseCount(countChronicDiseases(row[9]));
        healthData.setHemoglobin(parseDoubleSafe(row[10]));
        healthData.setCholesterol(parseDoubleSafe(row[11]));
        healthData.setBloodSugar(parseDoubleSafe(row[12]));
        healthData.setCreatinine(parseDoubleSafe(row[13]));
        healthData.setCoverageDetails(row[16].trim());
        healthData.setClaimedAmount(parseCurrencySafe(row[19]));

        return healthData;
    }

    private int countChronicDiseases(String value) {
        if (value == null || value.trim().isEmpty() || value.trim().equalsIgnoreCase("None")) {
            return 0;
        }
        return value.split(",").length;
    }

    private double parseCurrencySafe(String value) {
        if (value == null || value.trim().isEmpty()) {
            return 0.0;
        }
        try {
            String sanitized = value.trim().replaceAll("[^0-9.,-]", "").replaceAll(",", "");
            return Double.parseDouble(sanitized);
        } catch (NumberFormatException e) {
            logger.warn("Invalid currency format: {}", value);
            return 0.0;
        }
    }

    private double parseDoubleSafe(String value) {
        if (value == null || value.trim().isEmpty()) {
            return 0.0;
        }
        try {
            return Double.parseDouble(value.trim());
        } catch (NumberFormatException e) {
            logger.warn("Invalid number format: {}", value);
            return 0.0;
        }
    }

    private int parseIntSafe(String value) {
        if (value == null || value.trim().isEmpty()) {
            return 0;
        }
        try {
            return Integer.parseInt(value.trim());
        } catch (NumberFormatException e) {
            logger.warn("Invalid integer format: {}", value);
            return 0;
        }
    }

    private LocalDateTime parseSleepDate(String startTime) {
        try {
            // Parse time-only string and combine with today's date
            LocalTime time = LocalTime.parse(startTime, TIME_FORMATTER);
            return LocalDate.now().atTime(time);
        } catch (DateTimeParseException e) {
            logger.error("Failed to parse sleep date '{}': {}", startTime, e.getMessage());
            // Fallback: Use current date/time if parsing fails
            return LocalDateTime.now();
        }
    }

    private LocalDateTime parseSleepTime(String time) {
        try {
            // Parse time-only string and combine with today's date
            LocalTime localTime = LocalTime.parse(time, TIME_FORMATTER);
            return LocalDate.now().atTime(localTime);
        } catch (DateTimeParseException e) {
            logger.error("Failed to parse sleep time '{}': {}", time, e.getMessage());
            // Fallback: Use current date/time if parsing fails
            return LocalDateTime.now();
        }
    }
}