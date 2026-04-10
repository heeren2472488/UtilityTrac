package com.utilitrack.project._3mpwm.US009_maintenance.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "work_orders", indexes = {
    @Index(name = "idx_asset_id", columnList = "asset_id"),
    @Index(name = "idx_status", columnList = "status"),
    @Index(name = "idx_planner_id", columnList = "planner_id"),
    @Index(name = "idx_scheduled_date", columnList = "scheduled_start_date"),
    @Index(name = "idx_created_date", columnList = "created_at")
})
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class WorkOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "work_order_number", unique = true, nullable = false, length = 50)
    @NotBlank(message = "Work order number is required")
    private String workOrderNumber;

    @Column(name = "asset_id", nullable = false)
    @NotNull(message = "Asset ID is required")
    private Long assetId;

    @Column(name = "maintenance_profile_id", nullable = false)
    @NotNull(message = "Maintenance profile ID is required")
    private Long maintenanceProfileId;

    @Column(name = "title", nullable = false, length = 255)
    @NotBlank(message = "Work order title is required")
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "work_type", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    @NotNull(message = "Work type is required")
    private WorkType workType;

    @Column(name = "status", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private WorkOrderStatus status = WorkOrderStatus.CREATED;

    @Column(name = "priority", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    @NotNull(message = "Priority is required")
    private Priority priority;

    @Column(name = "planner_id", nullable = false, length = 100)
    @NotBlank(message = "Planner ID is required")
    private String plannerId;

    @Column(name = "assigned_crew", length = 500)
    private String assignedCrew;

    @Column(name = "crew_count")
    private Integer crewCount;

    @Column(name = "scheduled_start_date", nullable = false)
    @NotNull(message = "Scheduled start date is required")
    private LocalDateTime scheduledStartDate;

    @Column(name = "scheduled_end_date", nullable = false)
    @NotNull(message = "Scheduled end date is required")
    private LocalDateTime scheduledEndDate;

    @Column(name = "estimated_duration_hours", nullable = false)
    @NotNull(message = "Estimated duration is required")
    private Double estimatedDurationHours;

    @Column(name = "actual_start_date")
    private LocalDateTime actualStartDate;

    @Column(name = "actual_end_date")
    private LocalDateTime actualEndDate;

    @Column(name = "actual_duration_hours")
    private Double actualDurationHours;

    @Column(name = "estimated_cost", nullable = false)
    @NotNull(message = "Estimated cost is required")
    private Double estimatedCost;

    @Column(name = "actual_cost")
    private Double actualCost;

    @Column(name = "parts_list", columnDefinition = "TEXT")
    private String partsList;

    @Column(name = "required_skills", length = 500)
    private String requiredSkills;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "completion_notes", columnDefinition = "TEXT")
    private String completionNotes;

    @Column(name = "created_by", nullable = false, length = 100)
    @NotBlank(message = "Creator information is required")
    private String createdBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "version")
    @Version
    private Long version;

    public enum WorkType {
        PREVENTIVE_MAINTENANCE,
        CORRECTIVE_MAINTENANCE,
        INSPECTION,
        EMERGENCY_REPAIR,
        INSTALLATION,
        REPLACEMENT
    }

    public enum WorkOrderStatus {
        CREATED,
        SCHEDULED,
        ASSIGNED,
        IN_PROGRESS,
        COMPLETED,
        CANCELLED,
        ON_HOLD,
        PLANNED
    }

    public enum Priority {
        LOW,
        MEDIUM,
        HIGH,
        CRITICAL
    }

    @PrePersist
    protected void onCreate() {
        if (this.status == null) {
            this.status = WorkOrderStatus.CREATED;
        }
    }

    public boolean isScheduled() {
        return this.status == WorkOrderStatus.SCHEDULED || 
               this.status == WorkOrderStatus.ASSIGNED || 
               this.status == WorkOrderStatus.IN_PROGRESS;
    }

    public boolean isCompleted() {
        return this.status == WorkOrderStatus.COMPLETED;
    }

    public boolean isCancelled() {
        return this.status == WorkOrderStatus.CANCELLED;
    }
}
