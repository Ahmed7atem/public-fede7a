package com.medbondbackend.mapper;

import com.medbondbackend.dto.WearableLogDTO;
import com.medbondbackend.model.WearableLog;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface WearableLogMapper {

    WearableLogDTO toDto(WearableLog wearableLog);

    @Mapping(target = "id", ignore = true)
    WearableLog toEntity(WearableLogDTO wearableLogDTO);

    List<WearableLogDTO> toDtoList(List<WearableLog> wearableLogs);
}