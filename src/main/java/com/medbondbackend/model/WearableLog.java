package com.medbondbackend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Getter
@Setter
public class WearableLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
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