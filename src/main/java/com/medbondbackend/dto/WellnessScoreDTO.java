package com.medbondbackend.dto;

import lombok.Data;

@Data
public class WellnessScoreDTO {
    private double wellnessScore;
    private double physicalHealthScore;
    private double lifestyleScore;
    private double insuranceUtilizationScore;

    // New fields
    private Double weight;
    private Double height;
    private Integer age;
    private String gender;
    private Double systolicBP;
    private Double diastolicBP;
    private String physicalActivityLevel;
    private String dietType;
    private String alcoholConsumption;
    private String stressLevel;
    private String sleepQuality;
    private int numberOfSteps;
    private int hoursOfSleep;

    public WellnessScoreDTO(double wellnessScore, double physicalHealthScore, double lifestyleScore, double insuranceUtilizationScore) {
        this.wellnessScore = wellnessScore;
        this.physicalHealthScore = physicalHealthScore;
        this.lifestyleScore = lifestyleScore;
        this.insuranceUtilizationScore = insuranceUtilizationScore;
    }
}