package com.utilitrack.project._7rsra.entity;

import com.utilitrack.project._7rsra.enums.IncidentType;
import com.utilitrack.project._7rsra.enums.Severity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "safety_records")
@Data
public class SafetyRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long recordId;

    @NotNull(message = "WorkOrderID is mandatory")
    @Column(nullable = false)
    private Long workOrderId;

    @NotNull(message = "IncidentType is mandatory")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private IncidentType incidentType;

    @NotNull(message = "Severity is mandatory")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Severity severity;

    // Auto-stamped based on AC US025 Scenario 1
    @Column(nullable = false, updatable = false)
    private LocalDateTime reportedDate = LocalDateTime.now();
    
    private String description;
}