package com.utilitrack.project._4oim.US013_16.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubmitIncidentReportRequest {

    @NotBlank(message = "Report status is required")
    private String reportStatus;
}
