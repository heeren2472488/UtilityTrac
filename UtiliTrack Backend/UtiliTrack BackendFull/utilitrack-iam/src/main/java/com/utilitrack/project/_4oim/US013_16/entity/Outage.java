package com.utilitrack.project._4oim.US013_16.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Outage Entity
 * Represents an outage logged by operators
 * Status: LOGGED → DISPATCHED → IN_PROGRESS → RESTORED
 */
@Entity
@Table(name = "outages", indexes = {
    @Index(name = "idx_status", columnList = "status"),
    @Index(name = "idx_region", columnList = "region"),
    @Index(name = "idx_logged_time", columnList = "logged_time")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Outage {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank(message = "Region is required")
    @Size(min = 2, max = 100, message = "Region must be between 2 and 100 characters")
    @Column(nullable = false, length = 100)
    private String region;
    
    @NotNull(message = "Outage time is required")
    @Column(nullable = false)
    private LocalDateTime outageTime;
    
    @NotBlank(message = "Cause is required")
    @Size(min = 5, max = 500, message = "Cause must be between 5 and 500 characters")
    @Column(nullable = false, length = 500)
    private String cause;
    
    @Column(nullable = false)
    private LocalDateTime loggedTime;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private OutageStatus status = OutageStatus.LOGGED;
    
    @NotBlank(message = "Logged by operator ID is required")
    @Column(nullable = false, length = 50)
    private String loggedByOperatorId;
    
    @Column(length = 255)
    private String notes;
    
    @Column
    private LocalDateTime dispatchedTime;
    
    @Column
    private LocalDateTime restoredTime;
    
    @Column
    private Long dispatchId;
    
    @Column(name = "affected_customers")
    private Integer affectedCustomers;
    
    @Column(name = "severity_level", length = 20)
    private String severityLevel;
    
    @PrePersist
    protected void onCreate() {
        if (this.loggedTime == null) {
            this.loggedTime = LocalDateTime.now();
        }
        if (this.status == null) {
            this.status = OutageStatus.LOGGED;
        }
    }
    
    public enum OutageStatus {
        LOGGED,
        DISPATCHED,
        IN_PROGRESS,
        RESTORED,
        CLOSED
    }
}
