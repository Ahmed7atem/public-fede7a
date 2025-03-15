package com.medbondbackend.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Getter
@Setter
public class WearableLogDTO {
    private Long id;
    private UUID patientId;
    private LocalDate logDate;
    private LocalTime sleepStart;
    private LocalTime sleepEnd;
    private String sleepQuality;
    private int timeInBed;
    private String notes;
    private int heartRateSleep;
    private double activeEnergyKj;
    private int exerciseTimeMin;
    private int standHours;
    private int stepCount;
    private double walkingRunningDistanceKm;
    private double heartRateAvg;
}