package com.medbondbackend.repository;

import com.medbondbackend.model.WearableLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface WearableLogRepository extends JpaRepository<WearableLog, Long> {
    List<WearableLog> findByPatientId(UUID patientId);
}