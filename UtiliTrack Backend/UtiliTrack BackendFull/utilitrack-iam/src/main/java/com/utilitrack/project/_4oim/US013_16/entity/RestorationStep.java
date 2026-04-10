package com.utilitrack.project._4oim.US013_16.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * RestorationStep Entity
 * Represents a step in the restoration process
 * Tracks progress with clear status transitions
 */
@Entity
@Table(name = "restoration_steps", indexes = {
    @Index(name = "idx_outage_id_steps", columnList = "outage_id"),
    @Index(name = "idx_step_status", columnList = "step_status"),
    @Index(name = "idx_step_sequence", columnList = "step_sequence")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RestorationStep {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotNull(message = "Outage ID is required")
    @Column(nullable = false)
    private Long outageId;
    
    @NotNull(message = "Step sequence is required")
    @Min(value = 1, message = "Step sequence must be at least 1")
    @Column(nullable = false)
    private Integer stepSequence;
    
    @NotBlank(message = "Step name is required")
    @Size(min = 3, max = 150, message = "Step name must be between 3 and 150 characters")
    @Column(nullable = false, length = 150)
    private String stepName;
    
    @Size(max = 500, message = "Description cannot exceed 500 characters")
    @Column(length = 500)
    private String description;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "step_status", nullable = false)
    @Builder.Default
    private StepStatus stepStatus = StepStatus.PLANNED;
    
    @NotBlank(message = "Assigned to operator ID is required")
    @Column(nullable = false, length = 50)
    private String assignedToOperatorId;
    
    @Column(nullable = false)
    private LocalDateTime createdTime;
    
    @Column
    private LocalDateTime startedTime;
    
    @Column
    private LocalDateTime completedTime;
    
    @Column(length = 255)
    private String progressNotes;
    
    @Min(value = 0, message = "Estimated duration must be at least 0")
    @Max(value = 999, message = "Estimated duration cannot exceed 999 minutes")
    @Column(name = "estimated_duration_minutes")
    private Integer estimatedDurationMinutes;
    
    @Column(name = "actual_duration_minutes")
    private Integer actualDurationMinutes;
    
    @Column(length = 50)
    private String priority;
    
    @PrePersist
    protected void onCreate() {
        if (this.createdTime == null) {
            this.createdTime = LocalDateTime.now();
        }
        if (this.stepStatus == null) {
            this.stepStatus = StepStatus.PLANNED;
        }
    }
    
    public enum StepStatus {
        PLANNED,
        IN_PROGRESS,
        COMPLETED,
        ON_HOLD,
        FAILED,
        SKIPPED
    }
}
