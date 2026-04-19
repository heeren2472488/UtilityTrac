package com.utilitrack.project._3mpwm.US010_crew_assignment.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class CrewDetailsResponse {
    private Long id;
    private String name;
    private String leaderName;
    private boolean leaderPresent;
    private List<CrewMemberResponse> members;
    private int memberCount;
}

