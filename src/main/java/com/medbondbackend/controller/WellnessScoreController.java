package com.medbondbackend.controller;

import com.medbondbackend.dto.HealthDataDTO;
import com.medbondbackend.dto.WellnessScoreDTO;
import com.medbondbackend.service.WellnessScoreService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/wellness-score")
public class WellnessScoreController {

    private final WellnessScoreService wellnessScoreService;

    //Constructor injection
    @Autowired
    public WellnessScoreController(WellnessScoreService wellnessScoreService) {
        this.wellnessScoreService = wellnessScoreService;
    }

    @PostMapping("/calculate")
    public ResponseEntity<WellnessScoreDTO> calculateWellnessScore(@RequestBody HealthDataDTO healthData) {
        WellnessScoreDTO wellnessScore = wellnessScoreService.calculateWellnessScore(healthData);
        return new ResponseEntity<>(wellnessScore, HttpStatus.OK);
    }
}