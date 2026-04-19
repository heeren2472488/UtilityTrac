package com.utilitrack.project.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.utilitrack.project._1iam.US001_user_role_management.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

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
    @Column(length = 50)
    private Skillset skillset;

    @Enumerated(EnumType.STRING)
    private CrewStatus status;

    @ManyToMany
    @JoinTable(
            name = "crew_members",
            joinColumns = @JoinColumn(name = "crew_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    @Builder.Default
    @JsonIgnore
    private Set<User> members = new HashSet<>();

    public enum CrewStatus {
        AVAILABLE,
        ON_DUTY,
        UNAVAILABLE
    }

    public enum Skillset {
        ELECTRICAL,
        GAS,
        WATER,
        GENERAL,
        INSPECTION,
        CIVIL,
        MECHANICAL,
        SAFETY,
        COMMUNICATION
    }

    /* ===============================
       Audit
       =============================== */

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "crew_size", nullable = false)
    private Integer crewSize;

    @PrePersist
    protected void onCreate() {
        this.updatedAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = CrewStatus.AVAILABLE;
        }
        if (this.crewSize == null) {
            this.crewSize = this.members == null ? 0 : this.members.size();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
        this.crewSize = this.members == null ? 0 : this.members.size();
    }

    @Transient
    @JsonProperty("memberCount")
    public int getMemberCount() {
        return members == null ? 0 : members.size();
    }

    @Transient
    @JsonProperty("leaderPresent")
    public boolean isLeaderPresent() {
        return leaderName != null && !leaderName.isBlank();
    }
}