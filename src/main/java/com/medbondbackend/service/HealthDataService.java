package com.medbondbackend.service;

import com.medbondbackend.dto.HealthDataDTO;
import com.medbondbackend.exception.ResourceNotFoundException;
import com.medbondbackend.mapper.HealthDataMapper;
import com.medbondbackend.model.Employee;
import com.medbondbackend.model.HealthData;
import com.medbondbackend.repository.HealthDataRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class HealthDataService {


    private final HealthDataRepository healthDataRepository;
    private final HealthDataMapper healthDataMapper;

    //Constructor injection
    @Autowired
    public HealthDataService(HealthDataRepository healthDataRepository, HealthDataMapper healthDataMapper) {
        this.healthDataRepository = healthDataRepository;
        this.healthDataMapper = healthDataMapper;
    }

    public HealthDataDTO getHealthDataByEmployeeId(Long employeeId) {
        HealthData healthData = healthDataRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Health data not found for employee id: " + employeeId));
        return healthDataMapper.toDTO(healthData);
    }

    public HealthDataDTO createOrUpdateHealthData(Long employeeId, HealthDataDTO healthDataDTO) {
        HealthData healthData = healthDataMapper.toEntity(healthDataDTO);
        // Set the employee ID directly
        Employee employee = new Employee();
        employee.setId(employeeId); // Set the employee ID
        healthData.setEmployee(employee);
        HealthData savedHealthData = healthDataRepository.save(healthData);
        return healthDataMapper.toDTO(savedHealthData);
    }
}