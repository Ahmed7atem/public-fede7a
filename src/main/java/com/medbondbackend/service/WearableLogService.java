package com.medbondbackend.service;

import com.medbondbackend.model.WearableLog;
import com.medbondbackend.dto.WearableSummaryDTO;
import com.medbondbackend.repository.WearableLogRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class WearableLogService {

    private final WearableLogRepository wearableLogRepository;

    public WearableLogService(WearableLogRepository wearableLogRepository) {
        this.wearableLogRepository = wearableLogRepository;
    }

    public List<WearableLog> getWearableLogsByPatientId(UUID patientId) {
        return wearableLogRepository.findByPatientId(patientId);
    }

    public void saveWearableLogs(List<WearableLog> logs) {
        wearableLogRepository.saveAll(logs);
    }

    public WearableSummaryDTO getWearableSummary(UUID patientId) {
        List<WearableLog> logs = wearableLogRepository.findByPatientId(patientId);
        if (logs.isEmpty()) {
            return new WearableSummaryDTO(0.0, 0);
        }
        double avgHeartRate = logs.stream()
                .mapToDouble(WearableLog::getHeartRateAvg)
                .average()
                .orElse(0.0);
        int totalSteps = logs.stream()
                .mapToInt(WearableLog::getStepCount)
                .sum();
        return new WearableSummaryDTO(avgHeartRate, totalSteps);
    }
}