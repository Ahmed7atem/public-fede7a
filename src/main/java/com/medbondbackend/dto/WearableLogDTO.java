package com.medbondbackend.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class WearableLogDTO {
    private String patientId;
    private LocalDateTime logDate;
    private LocalDateTime sleepStart;
    private LocalDateTime sleepEnd;
    private String sleepQuality;
    private String timeInBed;
    private String sleepNotes;
    private Integer heartRateSleep;
    private Double activeEnergyKj;
    private Integer exerciseTimeMin;
    private Integer standHours;
    private Integer stepCount;
    private Double walkingRunningDistanceKm;
    private Double heartRateAvg;
}