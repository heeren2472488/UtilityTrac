package com.utilitrack.project._3mpwm.US010_crew_assignment.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class CrewListResponse {
    private int totalCrews;
    private int crewsWithLeader;
    private int assignedMembers;
    private List<CrewListItemResponse> crews;
}

