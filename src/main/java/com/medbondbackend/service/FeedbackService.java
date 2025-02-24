package com.medbondbackend.service;

import com.medbondbackend.dto.FeedbackDTO;
import com.medbondbackend.exception.ResourceNotFoundException;
import com.medbondbackend.mapper.FeedbackMapper;
import com.medbondbackend.model.Feedback;
import com.medbondbackend.repository.FeedbackRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final FeedbackMapper feedbackMapper;

    //Constructor injection
    public FeedbackService(FeedbackRepository feedbackRepository, FeedbackMapper feedbackMapper) {
        this.feedbackRepository = feedbackRepository;
        this.feedbackMapper = feedbackMapper;
    }

    public FeedbackDTO submitFeedback(FeedbackDTO feedbackDTO) {
        Feedback feedback = feedbackMapper.toEntity(feedbackDTO);
        Feedback savedFeedback = feedbackRepository.save(feedback);
        return feedbackMapper.toDTO(savedFeedback);
    }

    public List<FeedbackDTO> getFeedbackByEmployeeId(Long employeeId) {
        List<Feedback> feedbackList = feedbackRepository.findByEmployeeId(employeeId);
        return feedbackList.stream()
                .map(feedbackMapper::toDTO)
                .collect(Collectors.toList());
    }

    public void resolveFeedback(Long id) {
        Feedback feedback = feedbackRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Feedback not found with id: " + id));
        feedback.setResolved(true);
        feedbackRepository.save(feedback);
    }
}