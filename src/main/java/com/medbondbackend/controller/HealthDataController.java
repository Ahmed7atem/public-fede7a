package com.medbondbackend.controller;

import com.medbondbackend.dto.HealthDataDTO;
import com.medbondbackend.mapper.HealthDataMapper;
import com.medbondbackend.model.Employee;
import com.medbondbackend.model.HealthData;
import com.medbondbackend.repository.EmployeeRepository;
import com.medbondbackend.repository.HealthDataRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import com.medbondbackend.service.HealthDataService; // ✅ Import HealthDataService



import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/health-data")
public class HealthDataController {

    private final HealthDataRepository healthDataRepository;
    private final EmployeeRepository employeeRepository;
    private final HealthDataService healthDataService; // ✅ Inject Service
    private final HealthDataMapper healthDataMapper;

    public HealthDataController(HealthDataRepository healthDataRepository,
                                EmployeeRepository employeeRepository,
                                HealthDataService healthDataService,
                                HealthDataMapper healthDataMapper) {
        this.healthDataRepository = healthDataRepository;
        this.employeeRepository = employeeRepository;
        this.healthDataService = healthDataService;
        this.healthDataMapper = healthDataMapper;
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<HealthDataDTO> getHealthDataByEmployeeId(@PathVariable UUID employeeId) {
        HealthDataDTO healthData = healthDataService.getHealthDataByEmployeeId(employeeId);
        return new ResponseEntity<>(healthData, HttpStatus.OK);
    }

    @PostMapping("/employee/{employeeId}")
    public ResponseEntity<HealthDataDTO> createOrUpdateHealthData(
        @PathVariable UUID employeeId, @RequestBody HealthDataDTO healthDataDTO) {
        HealthDataDTO savedHealthData = healthDataService.createOrUpdateHealthData(employeeId, healthDataDTO);
        return new ResponseEntity<>(savedHealthData, HttpStatus.CREATED);
    }
    // DELETE health data by ID
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteHealthData(@PathVariable UUID id) {
        if (!healthDataRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        healthDataRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}