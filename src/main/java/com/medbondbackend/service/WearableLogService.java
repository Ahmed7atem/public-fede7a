package com.medbondbackend.service;

import com.medbondbackend.dto.WearableLogDTO;
import com.medbondbackend.model.WearableLog;
import com.medbondbackend.repository.WearableLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class WearableLogService {

    @Autowired
    private WearableLogRepository wearableLogRepository;

    public void syncWearableData(WearableLogDTO dto) {
        WearableLog log = new WearableLog();
        log.setPatientId(dto.getPatientId());
        log.setLogDate(dto.getLogDate());
        log.setSleepStart(dto.getSleepStart());
        log.setSleepEnd(dto.getSleepEnd());
        log.setSleepQuality(dto.getSleepQuality());
        log.setTimeInBed(dto.getTimeInBed());
        log.setSleepNotes(dto.getSleepNotes());
        log.setHeartRateSleep(dto.getHeartRateSleep());
        log.setActiveEnergyKj(dto.getActiveEnergyKj());
        log.setExerciseTimeMin(dto.getExerciseTimeMin());
        log.setStandHours(dto.getStandHours());
        log.setStepCount(dto.getStepCount());
        log.setWalkingRunningDistanceKm(dto.getWalkingRunningDistanceKm());
        log.setHeartRateAvg(dto.getHeartRateAvg());
        wearableLogRepository.save(log);
    }
}