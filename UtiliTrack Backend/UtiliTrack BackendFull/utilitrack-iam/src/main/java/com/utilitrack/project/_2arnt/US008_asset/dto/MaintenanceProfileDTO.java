package com.utilitrack.project._2arnt.US008_asset.dto;

import com.utilitrack.project._2arnt.US008_asset.entity.MaintenanceProfile;
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
public class MaintenanceProfileDTO {

    private Long id;

    @NotNull(message = "Asset ID is required")
    private Long assetId;

    @NotBlank(message = "Profile name is required")
    @Size(min = 3, max = 255, message = "Profile name must be between 3 and 255 characters")
    private String profileName;

    @Size(max = 2000, message = "Description must not exceed 2000 characters")
    private String description;

    @NotNull(message = "Maintenance type is required")
    private MaintenanceProfile.MaintenanceType maintenanceType;

    @NotNull(message = "Frequency is required")
    @Positive(message = "Frequency must be positive")
    private Integer frequencyDays;

    @NotNull(message = "Estimated duration is required")
    @Positive(message = "Duration must be positive")
    private Double estimatedDurationHours;

    @NotNull(message = "Required crew size is required")
    @Positive(message = "Crew size must be positive")
    private Integer requiredCrewSize;

    private String skillRequirements;

    private String partsRequired;

    @NotNull(message = "Estimated cost is required")
    @PositiveOrZero(message = "Cost must be zero or positive")
    private Double estimatedCost;

    private MaintenanceProfile.ProfileStatus status;

    private Boolean isTemplate;

    private String templateName;

    private String createdBy;

    private LocalDateTime createdAt;

    private String updatedBy;

    private LocalDateTime updatedAt;

    private LocalDateTime lastExecuted;

    private LocalDateTime nextScheduled;

    private Boolean isStandardized;
}
