package com.utilitrack.project._3mpwm.US010_crew_assignment.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CrewMemberResponse {
    private Long id;
    private String name;
    private String email;
}

