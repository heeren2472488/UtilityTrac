    package com.utilitrack.project.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * US004: Audit log entity (TEAM-60)
 * Captures: login, user creation, role changes, password reset
 */
@Entity @Table(name = "audit_logs")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class AuditLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name="actor_id")             private Long actorId;
    @Column(name="actor_email", length=150) private String actorEmail;
    @Column(name="action", nullable=false, length=100) private String action;
    @Column(name="resource", nullable=false, length=200) private String resource;
    @Column(name="detail", columnDefinition="TEXT") private String detail;
    @Column(name="performed_at", nullable=false, updatable=false) private LocalDateTime performedAt;
    @PrePersist public void prePersist() { this.performedAt = LocalDateTime.now(); }
}
 