package com.medbondbackend.model;

import jakarta.persistence.*;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Entity
public class Employee {
    @Id
    private UUID id; // UUID mapped from Patient_ID
    private String name;
    @Column(unique = true, nullable = false, length = 255)
    private String email;
    private String role;
    private String department;
    private String insurancePlan;
    private String healthMetrics; // Can be expanded into a separate entity later

    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<HealthData> healthData = new ArrayList<>();
}