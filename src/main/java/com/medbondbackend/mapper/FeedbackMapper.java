package com.medbondbackend.mapper;

import com.medbondbackend.dto.FeedbackDTO;
import com.medbondbackend.model.Feedback;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring")
public interface FeedbackMapper {

    FeedbackMapper INSTANCE = Mappers.getMapper(FeedbackMapper.class);

    @Mapping(target = "employee", ignore = true) // Ignore employee mapping in DTO to Entity
    Feedback toEntity(FeedbackDTO feedbackDTO);

    @Mapping(target = "employeeId", source = "employee.id") // Map employee ID in Entity to DTO
    FeedbackDTO toDTO(Feedback feedback);
}