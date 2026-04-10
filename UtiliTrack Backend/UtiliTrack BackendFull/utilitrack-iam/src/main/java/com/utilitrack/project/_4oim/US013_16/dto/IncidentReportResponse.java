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
public class IncidentReportResponse {

    private Long id;

    private Long outageId;

    private String safetyDetails;

    private String rootCause;

    private String correctiveActions;

    private LocalDateTime createdTime;

    private String createdByAnalystId;

    private String reportStatus;

    private LocalDateTime submittedTime;

    private String severityLevel;

    private String recommendations;

    private String affectedSystem;

    private Integer estimatedRecoveryCost;
}
