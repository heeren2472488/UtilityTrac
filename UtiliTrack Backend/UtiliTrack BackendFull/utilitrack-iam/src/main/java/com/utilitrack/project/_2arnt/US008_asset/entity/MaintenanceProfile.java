package com.utilitrack.project._2arnt.US008_asset.entity;

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
@Table(name = "maintenance_profiles", indexes = {
    @Index(name = "idx_asset_id", columnList = "asset_id"),
    @Index(name = "idx_status", columnList = "status"),
    @Index(name = "idx_created_by", columnList = "created_by")
})
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class MaintenanceProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "asset_id", nullable = false)
    @NotNull(message = "Asset ID is required")
    private Long assetId;

    @Column(name = "profile_name", nullable = false, length = 255)
    @NotBlank(message = "Profile name is required")
    private String profileName;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "maintenance_type", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    @NotNull(message = "Maintenance type is required")
    private MaintenanceType maintenanceType;

    @Column(name = "frequency_days", nullable = false)
    @NotNull(message = "Frequency (in days) is required")
    private Integer frequencyDays;

    @Column(name = "estimated_duration_hours", nullable = false)
    @NotNull(message = "Estimated duration is required")
    private Double estimatedDurationHours;

    @Column(name = "required_crew_size", nullable = false)
    @NotNull(message = "Required crew size is required")
    private Integer requiredCrewSize;

    @Column(name = "skill_requirements", length = 500)
    private String skillRequirements;

    @Column(name = "parts_required", columnDefinition = "TEXT")
    private String partsRequired;

    @Column(name = "estimated_cost", nullable = false)
    @NotNull(message = "Estimated cost is required")
    private Double estimatedCost;

    @Column(name = "status", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ProfileStatus status = ProfileStatus.ACTIVE;

    @Column(name = "is_template", nullable = false)
    @Builder.Default
    private Boolean isTemplate = false;

    @Column(name = "template_name", length = 255)
    private String templateName;

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

    @Column(name = "last_executed", nullable = true)
    private LocalDateTime lastExecuted;

    @Column(name = "next_scheduled", nullable = true)
    private LocalDateTime nextScheduled;

    @Column(name = "version")
    @Version
    private Long version;

    @Transient
    private Boolean isStandardized;

    public enum MaintenanceType {
        PREVENTIVE,
        CORRECTIVE,
        PREDICTIVE,
        EMERGENCY
    }

    public enum ProfileStatus {
        ACTIVE,
        INACTIVE,
        ARCHIVED,
        TEMPLATE
    }

    @PrePersist
    protected void onCreate() {
        if (this.status == null) {
            this.status = ProfileStatus.ACTIVE;
        }
        if (this.isTemplate == null) {
            this.isTemplate = false;
        }
    }
}
