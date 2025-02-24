package com.medbondbackend.repository;

import com.medbondbackend.model.HealthData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface HealthDataRepository extends JpaRepository<HealthData, Long> {
    Optional<HealthData> findByEmployeeId(Long employeeId);
}