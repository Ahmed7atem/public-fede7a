package com.medbondbackend.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String email;
    private String role;
    private String department;
    private String insurancePlan;
    private String healthMetrics; // Can be expanded into a separate entity later
}