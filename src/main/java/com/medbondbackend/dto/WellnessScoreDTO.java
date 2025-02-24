package com.medbondbackend.dto;

import lombok.Data;

@Data
public class WellnessScoreDTO {
    private double wellnessScore;
    private double physicalHealthScore;
    private double lifestyleScore;
    private double insuranceUtilizationScore;

    public WellnessScoreDTO(double wellnessScore, double physicalHealthScore, double lifestyleScore, double insuranceUtilizationScore) {
        this.wellnessScore = wellnessScore;
        this.physicalHealthScore = physicalHealthScore;
        this.lifestyleScore = lifestyleScore;
        this.insuranceUtilizationScore = insuranceUtilizationScore;
    }
}