package com.utilitrack.project.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "crews")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Crew {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "crew_id")
    private Long id;

    /* ===============================
       Crew Details
       =============================== */

    @Column(nullable = false)
    private String name;

    private String description;

    @Column(name = "leader_name")
    private String leaderName;   // ✅ REQUIRED FOR UI

    @Column(name = "contact_info")
    private String contactInfo;  // Crew Email

    @Enumerated(EnumType.STRING)
    private Skillset skillset;

    @Enumerated(EnumType.STRING)
    private CrewStatus status;

    public enum CrewStatus {
        AVAILABLE,
        ON_DUTY,
        UNAVAILABLE
    }

    public enum Skillset {
        ELECTRICAL,
        GAS,
        WATER,
        GENERAL
    }

    /* ===============================
       Audit
       =============================== */

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.updatedAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = CrewStatus.AVAILABLE;
        }
    }

    @Column(name = "crew_size", nullable = false)
    private Integer crewSize;

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}