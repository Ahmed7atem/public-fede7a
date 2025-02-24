package com.medbondbackend.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
public class HealthData {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
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

    @OneToOne
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;
}