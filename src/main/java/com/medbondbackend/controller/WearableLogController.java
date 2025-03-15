package com.medbondbackend.controller;

import com.medbondbackend.dto.WearableLogDTO;
import com.medbondbackend.model.WearableLog;
import com.medbondbackend.service.WearableLogService;
import com.medbondbackend.mapper.WearableLogMapper;
import com.medbondbackend.dto.WearableSummaryDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/wearablelogs")
public class WearableLogController {

    private final WearableLogService wearableLogService;
    private final WearableLogMapper wearableLogMapper;

    @Autowired
    public WearableLogController(WearableLogService wearableLogService, WearableLogMapper wearableLogMapper) {
        this.wearableLogService = wearableLogService;
        this.wearableLogMapper = wearableLogMapper;
    }

    @GetMapping("/{id}")
    public ResponseEntity<List<WearableLogDTO>> getWearableLogs(@PathVariable UUID id) {
        List<WearableLog> logs = wearableLogService.getWearableLogsByPatientId(id);
        return ResponseEntity.ok(wearableLogMapper.toDtoList(logs));
    }

    @PostMapping("/upload")
    public ResponseEntity<String> uploadWearableLogs(@RequestBody List<WearableLogDTO> logs) {
        List<WearableLog> entities = logs.stream()
                .map(wearableLogMapper::toEntity)
                .collect(Collectors.toList());
        wearableLogService.saveWearableLogs(entities);
        return ResponseEntity.ok("Wearable logs uploaded successfully");
    }

    @GetMapping("/{id}/summary")
    public ResponseEntity<WearableSummaryDTO> getWearableSummary(@PathVariable UUID id) {
        return ResponseEntity.ok(wearableLogService.getWearableSummary(id));
    }
}