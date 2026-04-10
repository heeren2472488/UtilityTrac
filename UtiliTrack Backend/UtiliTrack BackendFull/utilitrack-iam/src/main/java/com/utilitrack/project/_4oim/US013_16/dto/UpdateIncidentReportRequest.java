package com.utilitrack.project._4oim.US013_16.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateIncidentReportRequest {

    @NotBlank(message = "Safety details are required")
    @Size(min = 10, max = 1000)
    private String safetyDetails;

    @NotBlank(message = "Root cause is required")
    @Size(min = 10, max = 1000)
    private String rootCause;

    @NotBlank(message = "Corrective actions are required")
    @Size(min = 10, max = 1000)
    private String correctiveActions;

    @NotBlank(message = "Severity level is required")
    private String severityLevel;

    private String recommendations;

    private String affectedSystem;

    private Integer estimatedRecoveryCost;
}
