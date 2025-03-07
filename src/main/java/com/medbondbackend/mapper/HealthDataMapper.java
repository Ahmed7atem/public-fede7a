package com.medbondbackend.mapper;

import com.medbondbackend.dto.HealthDataDTO;
import com.medbondbackend.model.HealthData;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring")
public interface HealthDataMapper {

    HealthDataMapper INSTANCE = Mappers.getMapper(HealthDataMapper.class);

    @Mapping(target = "employee", ignore = true) // Ignore employee mapping in DTO to Entity
    @Mapping(target = "height", source = "height") // Map height
    @Mapping(target = "age", source = "age") // Map age
    @Mapping(target = "gender", source = "gender") // Map gender
    @Mapping(target = "systolicBP", source = "systolicBP") // Map systolicBP
    @Mapping(target = "diastolicBP", source = "diastolicBP") // Map diastolicBP
    HealthData toEntity(HealthDataDTO healthDataDTO);

    @Mapping(target = "employeeId", source = "employee.id") // Map employee ID in Entity to DTO
    HealthDataDTO toDTO(HealthData healthData);
}