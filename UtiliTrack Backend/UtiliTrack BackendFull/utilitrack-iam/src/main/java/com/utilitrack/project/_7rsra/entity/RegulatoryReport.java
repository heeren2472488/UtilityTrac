package com.utilitrack.project._7rsra.entity;

import com.utilitrack.project._7rsra.enums.ReportStatus;
import com.utilitrack.project._7rsra.enums.ReportType;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "regulatory_reports")
@Data
public class RegulatoryReport {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long reportId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReportType reportType;

    @Column(nullable = false)
    private String period; // e.g., "2025-Q1", "2025-Annual"

    @Column(nullable = false)
    private LocalDateTime generatedDate = LocalDateTime.now();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReportStatus status = ReportStatus.DRAFT;
    
    @Lob // For storing larger JSON strings or report summaries
    private String reportPayload; 
}