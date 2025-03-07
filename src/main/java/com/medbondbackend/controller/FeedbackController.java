package com.medbondbackend.controller;

import com.medbondbackend.dto.FeedbackDTO;
import com.medbondbackend.service.FeedbackService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {

    private final FeedbackService feedbackService;
        //Constructor Injection
    public FeedbackController(FeedbackService feedbackService) {
        this.feedbackService = feedbackService;
    }

    @PostMapping
    public ResponseEntity<FeedbackDTO> submitFeedback(@RequestBody FeedbackDTO feedbackDTO) {
        FeedbackDTO savedFeedback = feedbackService.submitFeedback(feedbackDTO);
        return new ResponseEntity<>(savedFeedback, HttpStatus.CREATED);
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<FeedbackDTO>> getFeedbackByEmployeeId(@PathVariable UUID employeeId) {
        List<FeedbackDTO> feedbackList = feedbackService.getFeedbackByEmployeeId(employeeId);
        return new ResponseEntity<>(feedbackList, HttpStatus.OK);
    }

    @PutMapping("/{id}/resolve")
    public ResponseEntity<Void> resolveFeedback(@PathVariable UUID id) {
        feedbackService.resolveFeedback(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}