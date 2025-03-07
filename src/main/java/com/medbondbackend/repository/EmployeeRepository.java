package com.medbondbackend.repository;

import com.medbondbackend.model.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, UUID> {

    // Custom query to find an employee by email
    Optional<Employee> findByEmail(String email);
}