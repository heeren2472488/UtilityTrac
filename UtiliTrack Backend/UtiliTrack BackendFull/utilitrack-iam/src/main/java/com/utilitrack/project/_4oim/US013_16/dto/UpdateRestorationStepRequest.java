package com.utilitrack.project._4oim.US013_16.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateRestorationStepRequest {

    @NotBlank(message = "Step status is required")
    private String stepStatus;

    private String progressNotes;

    private LocalDateTime startedTime;

    private LocalDateTime completedTime;

    private Integer actualDurationMinutes;
}