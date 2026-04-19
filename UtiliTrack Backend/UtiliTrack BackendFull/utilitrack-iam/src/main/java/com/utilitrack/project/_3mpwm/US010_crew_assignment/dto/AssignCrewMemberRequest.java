package com.utilitrack.project._3mpwm.US010_crew_assignment.dto;

import jakarta.validation.constraints.AssertTrue;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AssignCrewMemberRequest {

    private Long userId;
    private Long technicianId;

    @AssertTrue(message = "Either userId or technicianId must be provided")
    public boolean isValid() {
        return userId != null || technicianId != null;
    }

    public Long resolveMemberId() {
        return userId != null ? userId : technicianId;
    }
}

