package com.medbondbackend.service;

import com.medbondbackend.dto.EmployeeDTO;
import com.medbondbackend.exception.ResourceNotFoundException;
import com.medbondbackend.mapper.EmployeeMapper;
import com.medbondbackend.model.Employee;
import com.medbondbackend.repository.EmployeeRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final EmployeeMapper employeeMapper;

    // Constructor Injection
    public EmployeeService(EmployeeRepository employeeRepository, EmployeeMapper employeeMapper) {
        this.employeeRepository = employeeRepository;
        this.employeeMapper = employeeMapper;
    }

    // Get all employees
    public List<EmployeeDTO> getAllEmployees() {
        return employeeRepository.findAll()
                .stream()
                .map(employeeMapper::toDTO) // Use MapStruct for mapping
                .collect(Collectors.toList());
    }

    // Get employee by ID
    public EmployeeDTO getEmployeeById(Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));
        return employeeMapper.toDTO(employee); // Use MapStruct for mapping
    }

    // Create a new employee
    public EmployeeDTO createEmployee(EmployeeDTO employeeDTO) {
        Employee employee = employeeMapper.toEntity(employeeDTO); // Use MapStruct for mapping
        Employee savedEmployee = employeeRepository.save(employee);
        return employeeMapper.toDTO(savedEmployee); // Use MapStruct for mapping
    }

    // Update an employee
    public EmployeeDTO updateEmployee(Long id, EmployeeDTO employeeDTO) {
        Employee existingEmployee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));

        // Update fields manually (or use MapStruct for partial updates)
        existingEmployee.setName(employeeDTO.getName());
        existingEmployee.setEmail(employeeDTO.getEmail());
        existingEmployee.setRole(employeeDTO.getRole());
        existingEmployee.setDepartment(employeeDTO.getDepartment());
        existingEmployee.setInsurancePlan(employeeDTO.getInsurancePlan());
        existingEmployee.setHealthMetrics(employeeDTO.getHealthMetrics());

        Employee updatedEmployee = employeeRepository.save(existingEmployee);
        return employeeMapper.toDTO(updatedEmployee); // Use MapStruct for mapping
    }

    // Delete an employee
    public void deleteEmployee(Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));
        employeeRepository.delete(employee);
    }
}