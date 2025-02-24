package com.medbondbackend.service;

import com.medbondbackend.dto.HealthDataDTO;
import com.medbondbackend.dto.WellnessScoreDTO;
import org.springframework.stereotype.Service;

@Service
public class WellnessScoreService {

    public WellnessScoreDTO calculateWellnessScore(HealthDataDTO healthData) {
        double bmiScore = calculateBmiScore(healthData.getBmi());
        double chronicDiseaseScore = healthData.getChronicDiseaseCount();
        double hemoglobinScore = calculateHemoglobinScore(healthData.getHemoglobin());
        double cholesterolScore = calculateCholesterolScore(healthData.getCholesterol());
        double bloodSugarScore = calculateBloodSugarScore(healthData.getBloodSugar());
        double creatinineScore = calculateCreatinineScore(healthData.getCreatinine());

        double physicalHealthScore = 0.3 * bmiScore + 0.2 * chronicDiseaseScore + 0.2 * hemoglobinScore +
                0.1 * cholesterolScore + 0.1 * bloodSugarScore + 0.1 * creatinineScore;

        double lifestyleScore = calculateLifestyleScore(healthData.isSmoker(), healthData.getFamilyChronicDiseaseCount());
        double insuranceUtilizationScore = calculateInsuranceUtilizationScore(healthData.getClaimedAmount(), healthData.getCoverage());

        double wellnessScore = 0.5 * physicalHealthScore + 0.3 * lifestyleScore + 0.2 * insuranceUtilizationScore;

        return new WellnessScoreDTO(wellnessScore, physicalHealthScore, lifestyleScore, insuranceUtilizationScore);
    }

    private double calculateBmiScore(double bmi) {
        return Math.max(0, 1 - (Math.abs(bmi - 22) / 22));
    }

    private double calculateHemoglobinScore(double hemoglobin) {
        return 1 - (Math.abs(hemoglobin - 14) / 3);
    }

    private double calculateCholesterolScore(double cholesterol) {
        return 1 - (cholesterol / 200);
    }

    private double calculateBloodSugarScore(double bloodSugar) {
        return 1 - (bloodSugar / 125);
    }

    private double calculateCreatinineScore(double creatinine) {
        return 1 - ((creatinine - 0.6) / (1.3 - 0.6));
    }

    private double calculateLifestyleScore(boolean isSmoker, int familyChronicDiseaseCount) {
        return 0.6 * (isSmoker ? 1 : 0) + 0.2 * familyChronicDiseaseCount;
    }

    private double calculateInsuranceUtilizationScore(double claimedAmount, double coverage) {
        return claimedAmount / coverage;
    }
}