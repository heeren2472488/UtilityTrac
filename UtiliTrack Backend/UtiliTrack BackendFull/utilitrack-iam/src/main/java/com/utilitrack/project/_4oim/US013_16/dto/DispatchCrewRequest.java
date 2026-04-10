package com.utilitrack.project._4oim.US013_16.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DispatchCrewRequest {

    @NotNull(message = "Outage ID is required")
    private Long outageId;

    @NotBlank(message = "Crew ID is required")
    @Size(min = 2, max = 50, message = "Crew ID must be between 2 and 50 characters")
    private String crewId;

    @NotBlank(message = "Crew name is required")
    @Size(min = 3, max = 100, message = "Crew name must be between 3 and 100 characters")
    private String crewName;

    @NotNull(message = "Estimated Time of Arrival (ETA) is required")
    private LocalDateTime estimatedTimeOfArrival;

    private String specialInstructions;

    private String crewSkills;
}
