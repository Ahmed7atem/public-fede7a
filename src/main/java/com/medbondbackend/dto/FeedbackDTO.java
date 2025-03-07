package com.medbondbackend.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class FeedbackDTO {
    private UUID id;
    private String message;
    private LocalDateTime timestamp;
    private boolean resolved;
    private UUID employeeId; // ID of the employee who submitted the feedback
}