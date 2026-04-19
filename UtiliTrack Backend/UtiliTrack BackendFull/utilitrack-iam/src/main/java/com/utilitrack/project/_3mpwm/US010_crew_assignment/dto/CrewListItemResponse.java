package com.utilitrack.project._3mpwm.US010_crew_assignment.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CrewListItemResponse {
    private Long id;
    private String name;
    private String leaderName;
    private boolean leaderPresent;
    private int memberCount;
}

