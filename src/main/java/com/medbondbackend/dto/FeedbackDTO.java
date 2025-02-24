package com.medbondbackend.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class FeedbackDTO {
    private Long id;
    private String message;
    private LocalDateTime timestamp;
    private boolean resolved;
    private Long employeeId; // ID of the employee who submitted the feedback
}