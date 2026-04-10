package com.utilitrack.project._2arnt.US005_asset_registry.entity;

import com.utilitrack.project._1iam.US001_user_role_management.entity.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * US005: Asset entity (TEAM-65)
 * Fields: name, type, serial (unique), location, installDate, status, description
 */
@Entity @Table(name = "assets")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Asset {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="name", nullable=false, length=100) private String name;
    @Enumerated(EnumType.STRING)
    @Column(name="asset_type", nullable=false, length=50) private AssetType assetType;

    @Column(name="serial_number", nullable=false, unique=true, length=100) private String serialNumber;
    @Column(name="location", nullable=false, length=255) private String location;
    @Column(name="installation_date") private LocalDate installationDate;

    @Enumerated(EnumType.STRING)
    @Column(name="status", nullable=false, length=20)
    @Builder.Default private AssetStatus status = AssetStatus.ACTIVE;

    @Column(name="description", columnDefinition="TEXT") private String description;

    @ManyToOne(fetch=FetchType.LAZY)
    @JoinColumn(name="registered_by_id") private User registeredBy;

    @Column(name="created_at", nullable=false, updatable=false) private LocalDateTime createdAt;
    @Column(name="updated_at") private LocalDateTime updatedAt;

    @PrePersist public void prePersist() { createdAt = updatedAt = LocalDateTime.now(); }
    @PreUpdate  public void preUpdate()  { updatedAt = LocalDateTime.now(); }
}
