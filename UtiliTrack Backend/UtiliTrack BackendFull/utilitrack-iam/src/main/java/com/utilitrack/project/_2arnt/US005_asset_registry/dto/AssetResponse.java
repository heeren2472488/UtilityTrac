package com.utilitrack.project._2arnt.US005_asset_registry.dto;
import com.utilitrack.project._2arnt.US005_asset_registry.entity.AssetStatus;
import com.utilitrack.project._2arnt.US005_asset_registry.entity.AssetType;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class AssetResponse {
    private Long id;
    private String name;
    private AssetType assetType;
    private String serialNumber;
    private String location;
    private LocalDate installationDate;
    private AssetStatus status;
    private String description;
    private String registeredBy;
    private LocalDateTime createdAt;
}
 