package com.utilitrack.project._3mpwm.US010_crew_assignment.dto;

import com.utilitrack.project.entity.Crew;
import lombok.Data;

@Data
public class CrewUpdateRequest {

    private String name;
    private String description;
    private String leaderName;
    private String contactInfo;
    private Crew.Skillset skillset;
    private Crew.CrewStatus status;

    // getters & setters
}