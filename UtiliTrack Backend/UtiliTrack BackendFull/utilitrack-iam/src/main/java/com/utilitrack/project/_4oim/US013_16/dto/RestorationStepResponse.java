package com.utilitrack.project._4oim.US013_16.dto;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RestorationStepResponse {

    private Long id;

    private Long outageId;

    private Integer stepSequence;

    private String stepName;

    private String description;

    private String stepStatus;

    private String assignedToOperatorId;

    private LocalDateTime createdTime;

    private LocalDateTime startedTime;

    private LocalDateTime completedTime;

    private String progressNotes;

    private Integer estimatedDurationMinutes;

    private Integer actualDurationMinutes;

    private String priority;
}
