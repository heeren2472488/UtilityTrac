package com.utilitrack.project._4oim.US013_16.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * IncidentReport Entity
 * Represents an incident report created by analysts
 * Captures safety details, root cause, and corrective actions
 */
@Entity
@Table(name = "incident_reports", indexes = {
    @Index(name = "idx_outage_id_report", columnList = "outage_id"),
    @Index(name = "idx_analyst_id", columnList = "created_by_analyst_id"),
    @Index(name = "idx_report_status", columnList = "report_status"),
    @Index(name = "idx_created_time", columnList = "created_time")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IncidentReport {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotNull(message = "Outage ID is required")
    @Column(nullable = false)
    private Long outageId;
    
    @NotBlank(message = "Safety details are required")
    @Size(min = 10, max = 1000, message = "Safety details must be between 10 and 1000 characters")
    @Column(nullable = false, length = 1000)
    private String safetyDetails;
    
    @NotBlank(message = "Root cause is required")
    @Size(min = 10, max = 1000, message = "Root cause must be between 10 and 1000 characters")
    @Column(nullable = false, length = 1000)
    private String rootCause;
    
    @NotBlank(message = "Corrective actions are required")
    @Size(min = 10, max = 1000, message = "Corrective actions must be between 10 and 1000 characters")
    @Column(nullable = false, length = 1000)
    private String correctiveActions;
    
    @Column(nullable = false)
    private LocalDateTime createdTime;
    
    @NotBlank(message = "Created by analyst ID is required")
    @Column(nullable = false, length = 50)
    private String createdByAnalystId;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "report_status", nullable = false)
    @Builder.Default
    private ReportStatus reportStatus = ReportStatus.DRAFT;
    
    @Column
    private LocalDateTime submittedTime;
    
    @NotBlank(message = "Severity level is required")
    @Column(nullable = false, length = 20)
    private String severityLevel;
    
    @Column(length = 255)
    private String recommendations;
    
    @Column(length = 50)
    private String affectedSystem;
    
    @Column
    private Integer estimatedRecoveryCost;
    
    @Column
    private LocalDateTime lastModifiedTime;
    
    @Column(length = 50)
    private String lastModifiedByAnalystId;
    
    @PrePersist
    protected void onCreate() {
        if (this.createdTime == null) {
            this.createdTime = LocalDateTime.now();
        }
        if (this.lastModifiedTime == null) {
            this.lastModifiedTime = LocalDateTime.now();
        }
        if (this.reportStatus == null) {
            this.reportStatus = ReportStatus.DRAFT;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        this.lastModifiedTime = LocalDateTime.now();
    }
    
    public enum ReportStatus {
        DRAFT,
        SUBMITTED,
        UNDER_REVIEW,
        APPROVED,
        REJECTED,
        CLOSED
    }
}
