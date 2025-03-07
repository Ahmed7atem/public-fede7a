package com.medbondbackend.config;

import com.medbondbackend.model.Employee;
import com.medbondbackend.model.HealthData;
import com.medbondbackend.repository.EmployeeRepository;
import com.medbondbackend.repository.HealthDataRepository;
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
import java.text.NumberFormat;
import java.util.*;
import java.util.stream.Collectors;

@Component
public class CsvDataLoader implements CommandLineRunner {
    private static final Logger logger = LoggerFactory.getLogger(CsvDataLoader.class);

    private final HealthDataRepository healthDataRepository;
    private final EmployeeRepository employeeRepository;

    public CsvDataLoader(HealthDataRepository healthDataRepository, EmployeeRepository employeeRepository) {
        this.healthDataRepository = healthDataRepository;
        this.employeeRepository = employeeRepository;
    }

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
    @Override
    @Transactional
    public void run(String... args) throws Exception {
        InputStream inputStream = getClass().getResourceAsStream("/data/GP-2025-full-data.csv");
        if (inputStream == null) {
            System.err.println("CSV file not found!");
            return;
        }
        System.out.println("CSV file found, starting data load...");

        CSVParser parser = new CSVParserBuilder().withSeparator(',').withIgnoreQuotations(false).build();
        try (CSVReader reader = new CSVReaderBuilder(new InputStreamReader(inputStream))
                .withCSVParser(parser)
                .build()) {

            reader.readNext(); // Skip header

            List<Employee> employeesToSave = new ArrayList<>();
            List<HealthData> healthDataToSave = new ArrayList<>();

            int batchSize = 1000; // Save every 1000 rows
            int rowCount = 0;

            String[] row;
            while ((row = reader.readNext()) != null) {
                rowCount++;
                Employee employee = parseEmployee(row);
                HealthData healthData = parseHealthData(row, employee);

                employeesToSave.add(employee);
                healthDataToSave.add(healthData);

                if (rowCount % batchSize == 0) {
                    employeeRepository.saveAll(employeesToSave); // Save employees in bulk
                    healthDataRepository.saveAll(healthDataToSave); // Save health data in bulk
                    employeesToSave.clear();
                    healthDataToSave.clear();
                    System.out.println("Processed " + rowCount + " rows...");
                }
            }

            // Save remaining records
            if (!employeesToSave.isEmpty()) {
                employeeRepository.saveAll(employeesToSave);
                healthDataRepository.saveAll(healthDataToSave);
            }

            System.out.println("Finished loading CSV. Total rows: " + rowCount);
        } catch (Exception e) {
            System.err.println("Error reading CSV: " + e.getMessage());
        }
    }


    private HealthData parseHealthData(String[] row, Employee employee) {
        HealthData healthData = new HealthData();
        healthData.setEmployee(employee);
        NumberFormat currencyFormat = NumberFormat.getCurrencyInstance(Locale.US);

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
        healthData.setClaimedAmount(parseCurrencySafe(row[19], currencyFormat));

        return healthData;
    }

    private int countChronicDiseases(String value) {
        if (value == null || value.trim().isEmpty() || value.trim().equalsIgnoreCase("None")) {
            return 0;
        }
        return value.split(",").length;
    }

    private double parseCurrencySafe(String value, NumberFormat format) {
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
}
