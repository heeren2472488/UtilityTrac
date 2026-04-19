package com.utilitrack.project._3mpwm.US011_work_log.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;

import java.time.LocalDate;
@Data
@RequiredArgsConstructor
@Builder
@AllArgsConstructor
public class WorkLogResponseDTO {

    private Long id;
    private Long workOrderId;
    private String technicianId;
    private String completionStatus;
    private Double hoursWorked;
    private LocalDate loggedDate;
    private String notes;
    private String partsUsedJson;

    // getters & setters
}