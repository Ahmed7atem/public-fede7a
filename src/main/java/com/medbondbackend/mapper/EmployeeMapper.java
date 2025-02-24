package com.medbondbackend.mapper;

import com.medbondbackend.dto.EmployeeDTO;
import com.medbondbackend.model.Employee;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring") // Tells MapStruct to generate a Spring bean
public interface EmployeeMapper {

    // Singleton instance (optional, but useful for testing)
    EmployeeMapper INSTANCE = Mappers.getMapper(EmployeeMapper.class);

    // Map Employee to EmployeeDTO
    EmployeeDTO toDTO(Employee employee);

    // Map EmployeeDTO to Employee (ignore ID for creation)
    @Mapping(target = "id", ignore = true) // Ignore ID when mapping from DTO to Entity
    Employee toEntity(EmployeeDTO employeeDTO);
}