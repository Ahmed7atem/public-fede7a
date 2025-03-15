package com.medbondbackend.repository;

import com.medbondbackend.model.WearableLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WearableLogRepository extends JpaRepository<WearableLog, Long> {
}