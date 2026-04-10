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
public class CrewDispatchResponse {

    private Long id;

    private Long outageId;

    private String crewId;

    private String crewName;

    private LocalDateTime estimatedTimeOfArrival;

    private LocalDateTime dispatchTime;

    private String dispatchStatus;

    private String dispatchedByOperatorId;

    private String specialInstructions;

    private LocalDateTime actualArrivalTime;

    private String crewSkills;
}
