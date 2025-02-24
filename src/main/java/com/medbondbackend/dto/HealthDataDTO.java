package com.medbondbackend.dto;

import lombok.Data;

@Data
public class HealthDataDTO {
    private Long id;
    private Double bmi;
    private Double cholesterol;
    private Double bloodSugar;
    private Double hemoglobin;
    private Double creatinine;
    private boolean smoker; // Added field
    private int chronicDiseaseCount; // Added field
    private int familyChronicDiseaseCount; // Added field
    private double claimedAmount; // Added field
    private double coverage; // Added field
    private Long employeeId; // ID of the employee this health data belongs to
}