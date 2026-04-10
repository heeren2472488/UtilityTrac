package com.utilitrack.project.entity;

import com.utilitrack.project._3mpwm.US009_maintenance.entity.WorkOrder;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "work_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkLog {

    /* ===============================
       Primary Key
       =============================== */

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "work_log_id")
    private Long id;

    /* ===============================
       Relations
       =============================== */

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "work_order_id", nullable = false)
    private WorkOrder workOrder;

    /* ===============================
       Work Details
       =============================== */

    @Column(name = "technician_id", nullable = false)
    private String technicianId;

    @Column(name = "logged_date", nullable = false)
    private LocalDate loggedDate;

    @Column(name = "hours_worked", nullable = false)
    private Double hoursWorked;

    @Column(columnDefinition = "TINYTEXT")
    private String notes;

    @Column(name = "parts_used_json", columnDefinition = "TINYTEXT")
    private String partsUsedJson;

    /* ===============================
       Completion Status
       =============================== */

    @Enumerated(EnumType.STRING)
    @Column(name = "completion_status", nullable = false)
    private CompletionStatus completionStatus;

    public enum CompletionStatus {
        IN_PROGRESS,
        COMPLETED,
        PENDING_REVIEW   // ✅ matches DB
    }

    /* ===============================
       Audit Fields
       =============================== */

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}