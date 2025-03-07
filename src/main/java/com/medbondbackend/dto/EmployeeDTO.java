package com.medbondbackend.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.UUID;


@Setter
@Getter
public class EmployeeDTO {
    // Getters and Setters
    private UUID id;
    private String name;
    private String email;
    private String role;
    private String department;
    private String insurancePlan;
    private String healthMetrics;

}