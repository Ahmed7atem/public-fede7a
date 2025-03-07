package com.medbondbackend.service;

import com.medbondbackend.dto.HealthDataDTO;
import com.medbondbackend.exception.ResourceNotFoundException;
import com.medbondbackend.mapper.HealthDataMapper;
import com.medbondbackend.model.Employee;
import com.medbondbackend.model.HealthData;
import com.medbondbackend.repository.EmployeeRepository;
import com.medbondbackend.repository.HealthDataRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;


@Service
public class HealthDataService {


    private final HealthDataRepository healthDataRepository;
    private final HealthDataMapper healthDataMapper;
    private final EmployeeRepository employeeRepository;

    //Constructor injection
    @Autowired
    public HealthDataService(HealthDataRepository healthDataRepository, HealthDataMapper healthDataMapper, EmployeeRepository employeeRepository) {
        this.healthDataRepository = healthDataRepository;
        this.healthDataMapper = healthDataMapper;
        this.employeeRepository = employeeRepository;
    }

    public HealthDataDTO getHealthDataByEmployeeId(UUID employeeId) {
        HealthData healthData = healthDataRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Health data not found for employee id: " + employeeId));
        return healthDataMapper.toDTO(healthData);
    }

    public HealthDataDTO createOrUpdateHealthData(UUID employeeId, HealthDataDTO healthDataDTO) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + employeeId));

        HealthData healthData = healthDataMapper.toEntity(healthDataDTO);
        healthData.setEmployee(employee);

        HealthData savedHealthData = healthDataRepository.save(healthData);
        return healthDataMapper.toDTO(savedHealthData);
    }
    @Transactional  // Ensures all inserts are committed together
    public void saveHealthData(List<HealthData> healthDataList) {
        if (healthDataList == null || healthDataList.isEmpty()) {
            System.out.println("No data to save.");
            return;
        }

        healthDataRepository.saveAll(healthDataList); // Bulk save operation
        System.out.println("✅ Saved " + healthDataList.size() + " records successfully.");
    }

    public long countHealthData() {
        return healthDataRepository.count();
    }
}