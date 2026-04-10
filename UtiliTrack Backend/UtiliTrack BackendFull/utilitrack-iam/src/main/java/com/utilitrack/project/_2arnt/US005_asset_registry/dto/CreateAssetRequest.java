package com.utilitrack.project._2arnt.US005_asset_registry.dto;

import com.utilitrack.project._2arnt.US005_asset_registry.entity.AssetType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.time.LocalDate;

/**
 * US005: Request DTO for registering a new asset (TEAM-65)
 */
@Data
public class CreateAssetRequest {

    @NotBlank(message = "Asset name is required")
    @Size(min = 2, max = 100)
    private String name;

    @NotNull(message = "Asset type is required")
    private AssetType assetType;

    @NotBlank(message = "Serial number is required")
    @Size(min = 2, max = 100)
    private String serialNumber;

    @NotBlank(message = "Location is required")
    @Size(min = 2, max = 255)
    private String location;

    private LocalDate installationDate;

    @Size(max = 1000)
    private String description;
}
 