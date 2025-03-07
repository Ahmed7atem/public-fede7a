package com.medbondbackend.repository;

import com.medbondbackend.model.HealthData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface HealthDataRepository extends JpaRepository<HealthData, UUID> {
    Optional<HealthData> findByEmployeeId(UUID employeeId);
}