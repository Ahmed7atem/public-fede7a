package com.medbondbackend.dto;

import lombok.Data;

import java.util.UUID;

@Data
public class HealthDataDTO {
    private UUID id;
    private Double bmi;
    private Double cholesterol;
    private Double bloodSugar;
    private Double hemoglobin;
    private Double creatinine;
    private boolean smoker;
    private int chronicDiseaseCount;
    private int familyChronicDiseaseCount;
    private double claimedAmount;
    private double coverage;
    private Double weight;
    private Double height; // Added
    private Integer age; // Added
    private String gender; // Added
    private Double systolicBP; // Added
    private Double diastolicBP; // Added
    private UUID employeeId;
}