package com.utilitrack.project._4oim.US013_16.dto;

import jakarta.validation.constraints.Min;
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
public class CreateRestorationStepRequest {

    @NotNull(message = "Outage ID is required")
    private Long outageId;

    @NotNull(message = "Step sequence is required")
    @Min(value = 1, message = "Step sequence must be at least 1")
    private Integer stepSequence;

    @NotBlank(message = "Step name is required")
    @Size(min = 3, max = 150, message = "Step name must be between 3 and 150 characters")
    private String stepName;

    @Size(max = 500, message = "Description cannot exceed 500 characters")
    private String description;

    @NotBlank(message = "Assigned to operator ID is required")
    private String assignedToOperatorId;

    private Integer estimatedDurationMinutes;

    private String priority;
}
