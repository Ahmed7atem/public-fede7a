package com.medbondbackend.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "wearable_logs", indexes = {
        @Index(name = "idx_wearable_logs_patient_id_log_date", columnList = "patient_id, log_date")
})
@Data
public class WearableLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "patient_id", nullable = false)
    private String patientId;

    @Column(name = "log_date", nullable = false)
    private LocalDateTime logDate;

    // Sleep Data
    @Column(name = "sleep_start")
    private LocalDateTime sleepStart;
    @Column(name = "sleep_end")
    private LocalDateTime sleepEnd;
    @Column(name = "sleep_quality")
    private String sleepQuality; // e.g., "100%"
    @Column(name = "time_in_bed")
    private String timeInBed; // e.g., "8:32"
    @Column(name = "sleep_notes")
    private String sleepNotes; // e.g., "Drank coffee:Stressful day"
    @Column(name = "heart_rate_sleep")
    private Integer heartRateSleep;

    // Apple Watch Data
    @Column(name = "active_energy_kj")
    private Double activeEnergyKj;
    @Column(name = "exercise_time_min")
    private Integer exerciseTimeMin;
    @Column(name = "stand_hours")
    private Integer standHours;
    @Column(name = "step_count")
    private Integer stepCount;
    @Column(name = "walking_running_distance_km")
    private Double walkingRunningDistanceKm;
    @Column(name = "heart_rate_avg")
    private Double heartRateAvg;
}