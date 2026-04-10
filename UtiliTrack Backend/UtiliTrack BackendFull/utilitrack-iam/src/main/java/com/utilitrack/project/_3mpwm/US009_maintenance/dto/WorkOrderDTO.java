package com.utilitrack.project._3mpwm.US009_maintenance.dto;

import com.utilitrack.project._3mpwm.US009_maintenance.entity.WorkOrder;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class WorkOrderDTO {

    private Long id;

    private String workOrderNumber;

    @NotNull(message = "Asset ID is required")
    private Long assetId;

    @NotNull(message = "Maintenance Profile ID is required")
    private Long maintenanceProfileId;

    @NotBlank(message = "Title is required")
    @Size(min = 3, max = 255, message = "Title must be between 3 and 255 characters")
    private String title;

    @Size(max = 2000, message = "Description must not exceed 2000 characters")
    private String description;

    @NotNull(message = "Work type is required")
    private WorkOrder.WorkType workType;

    private WorkOrder.WorkOrderStatus status;

    @NotNull(message = "Priority is required")
    private WorkOrder.Priority priority;

    @NotBlank(message = "Planner ID is required")
    private String plannerId;

    private String assignedCrew;

    private Integer crewCount;

    @NotNull(message = "Scheduled start date is required")
    @FutureOrPresent(message = "Scheduled start date must be in future or present")
    private LocalDateTime scheduledStartDate;

    @NotNull(message = "Scheduled end date is required")
    @FutureOrPresent(message = "Scheduled end date must be in future or present")
    private LocalDateTime scheduledEndDate;

    @NotNull(message = "Estimated duration is required")
    @Positive(message = "Estimated duration must be positive")
    private Double estimatedDurationHours;

    private LocalDateTime actualStartDate;

    private LocalDateTime actualEndDate;

    @PositiveOrZero(message = "Actual duration must be zero or positive")
    private Double actualDurationHours;

    @NotNull(message = "Estimated cost is required")
    @PositiveOrZero(message = "Estimated cost must be zero or positive")
    private Double estimatedCost;

    @PositiveOrZero(message = "Actual cost must be zero or positive")
    private Double actualCost;

    private String partsList;

    private String requiredSkills;

    private String notes;

    private String completionNotes;

    private String createdBy;

    private LocalDateTime createdAt;

    private String updatedBy;

    private LocalDateTime updatedAt;
}
