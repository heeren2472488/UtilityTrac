package com.utilitrack.project._4oim.US013_16.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * CrewDispatch Entity
 * Represents crew assignment to an outage
 * Tracks dispatch details and ETA
 */
@Entity
@Table(name = "crew_dispatches", indexes = {
    @Index(name = "idx_outage_id", columnList = "outage_id"),
    @Index(name = "idx_dispatch_status", columnList = "dispatch_status"),
    @Index(name = "idx_crew_id", columnList = "crew_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrewDispatch {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotNull(message = "Outage ID is required")
    @Column(nullable = false)
    private Long outageId;
    
    @NotBlank(message = "Crew ID is required")
    @Size(min = 2, max = 50, message = "Crew ID must be between 2 and 50 characters")
    @Column(nullable = false, length = 50)
    private String crewId;
    
    @NotBlank(message = "Crew name is required")
    @Size(min = 3, max = 100, message = "Crew name must be between 3 and 100 characters")
    @Column(nullable = false, length = 100)
    private String crewName;
    
    @NotNull(message = "ETA is required")
    @Column(nullable = false)
    private LocalDateTime estimatedTimeOfArrival;
    
    @Column(nullable = false)
    private LocalDateTime dispatchTime;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "dispatch_status", nullable = false)
    @Builder.Default
    private DispatchStatus dispatchStatus = DispatchStatus.DISPATCHED;
    
    @NotBlank(message = "Dispatched by operator ID is required")
    @Column(nullable = false, length = 50)
    private String dispatchedByOperatorId;
    
    @Column(length = 255)
    private String specialInstructions;
    
    @Column
    private LocalDateTime actualArrivalTime;
    
    @Column
    private LocalDateTime completionTime;
    
    @Column(length = 50)
    private String crewSkills;
    
    @PrePersist
    protected void onCreate() {
        if (this.dispatchTime == null) {
            this.dispatchTime = LocalDateTime.now();
        }
        if (this.dispatchStatus == null) {
            this.dispatchStatus = DispatchStatus.DISPATCHED;
        }
    }
    
    public enum DispatchStatus {
        DISPATCHED,
        EN_ROUTE,
        ON_SITE,
        IN_PROGRESS,
        COMPLETED,
        CANCELLED
    }
}
