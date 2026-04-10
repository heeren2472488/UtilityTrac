package com.utilitrack.project._4oim.US013_16.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateIncidentReportRequest {

    @NotNull(message = "Outage ID is required")
    private Long outageId;

    @NotBlank(message = "Safety details are required")
    @Size(min = 10, max = 1000, message = "Safety details must be between 10 and 1000 characters")
    private String safetyDetails;

    @NotBlank(message = "Root cause is required")
    @Size(min = 10, max = 1000, message = "Root cause must be between 10 and 1000 characters")
    private String rootCause;

    @NotBlank(message = "Corrective actions are required")
    @Size(min = 10, max = 1000, message = "Corrective actions must be between 10 and 1000 characters")
    private String correctiveActions;

    @NotBlank(message = "Severity level is required")
    private String severityLevel;

    private String recommendations;

    private String affectedSystem;

    private Integer estimatedRecoveryCost;
}
