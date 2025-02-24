package com.medbondbackend.repository;

import com.medbondbackend.model.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    // Custom query to find an employee by email
    Employee findByEmail(String email);
}