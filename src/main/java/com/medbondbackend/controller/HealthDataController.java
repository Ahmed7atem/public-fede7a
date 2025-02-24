package com.medbondbackend.controller;

import com.medbondbackend.dto.HealthDataDTO;
import com.medbondbackend.service.HealthDataService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/health-data")
public class HealthDataController {

    private final HealthDataService healthDataService;

    //Constructor injection
    public HealthDataController(HealthDataService healthDataService) {
        this.healthDataService = healthDataService;
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<HealthDataDTO> getHealthDataByEmployeeId(@PathVariable Long employeeId) {
        HealthDataDTO healthData = healthDataService.getHealthDataByEmployeeId(employeeId);
        return new ResponseEntity<>(healthData, HttpStatus.OK);
    }

    @PostMapping("/employee/{employeeId}")
    public ResponseEntity<HealthDataDTO> createOrUpdateHealthData(
            @PathVariable Long employeeId, @RequestBody HealthDataDTO healthDataDTO) {
        HealthDataDTO savedHealthData = healthDataService.createOrUpdateHealthData(employeeId, healthDataDTO);
        return new ResponseEntity<>(savedHealthData, HttpStatus.CREATED);
    }
}