package com.medbondbackend.model;

import jakarta.persistence.*;
import lombok.Data;

import java.util.UUID;

@Data
@Entity
public class HealthData {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "employee_id")
    private Employee employee;

    private Double bmi;
    private Double cholesterol;
    private Double bloodSugar;
    private Double hemoglobin;
    private Double creatinine;
    private boolean smoker;
    private int chronicDiseaseCount;
    private int familyChronicDiseaseCount;
    private Double claimedAmount;
    private Double coverage;
    private String coverageDetails;
    private Double weight;
    private Double height;
    private Integer age;
    private String gender;
    private Double systolicBP;
    private Double diastolicBP;
}