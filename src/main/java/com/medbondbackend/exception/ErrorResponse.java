package com.medbondbackend.exception;

//import lombok.Getter;

import java.time.LocalDateTime;

/**
 * @param timestamp Getters
 */

public record ErrorResponse(
        LocalDateTime timestamp,
        int status,
        String error,
        String message,
        String path
)
{
    // Constructor

}