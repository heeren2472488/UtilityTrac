package com.utilitrack.project._3mpwm.US010_crew_assignment.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class CrewWorkOrderDTO {
    private String leaderName;

    private Long id;
    private Long assetId;
    private String workType;
    private String priority;
    private LocalDateTime scheduledStartDate;
    private LocalDateTime scheduledEndDate;
    private String status;
    private String assignedCrew;
}
