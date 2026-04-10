package com.utilitrack.project._2arnt.US006_7_Topology.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity(name = "OutageAsset")
@Table(name = "outage_assets") // <--- separate table from US005's "assets"
public class OutageAsset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id") // standard PK column name
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "asset_type", nullable = false, length = 50)
    private AssetType assetType;

    @Column(name = "serial_number", nullable = false, unique = true, length = 100)
    private String serialNumber;

    @Column(name = "location", columnDefinition = "TEXT")
    private String location; // GeoJSON or Address

    @Column(name = "installation_date")
    private LocalDate installationDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private AssetStatus status;

    @Column(name = "parent_asset_id")
    private Long parentAssetId;


    public enum AssetType {
        TRANSFORMER, FEEDER, SUBSTATION, PIPE, METER, VALVE
    }

    public enum AssetStatus {
        ACTIVE, DECOMMISSIONED, MAINTENANCE
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public AssetType getAssetType() { return assetType; }
    public void setAssetType(AssetType assetType) { this.assetType = assetType; }

    public String getSerialNumber() { return serialNumber; }
    public void setSerialNumber(String serialNumber) { this.serialNumber = serialNumber; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public LocalDate getInstallationDate() { return installationDate; }
    public void setInstallationDate(LocalDate installationDate) { this.installationDate = installationDate; }

    public AssetStatus getStatus() { return status; }
    public void setStatus(AssetStatus status) { this.status = status; }

    public Long getParentAssetId() { return parentAssetId; }
    public void setParentAssetId(Long parentAssetId) { this.parentAssetId = parentAssetId; }
}