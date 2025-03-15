package com.medbondbackend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class WearableSummaryDTO {
    private double averageHeartRate;
    private int totalSteps;

    public WearableSummaryDTO() {
    }

    public WearableSummaryDTO(double averageHeartRate, int totalSteps) {
        this.averageHeartRate = averageHeartRate;
        this.totalSteps = totalSteps;
    }
}