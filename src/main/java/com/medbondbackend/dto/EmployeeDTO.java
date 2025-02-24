package com.medbondbackend.dto;

import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class EmployeeDTO {
    // Getters and Setters
    private Long id;
    private String name;
    private String email;
    private String role;
    private String department;
    private String insurancePlan;
    private String healthMetrics;

}