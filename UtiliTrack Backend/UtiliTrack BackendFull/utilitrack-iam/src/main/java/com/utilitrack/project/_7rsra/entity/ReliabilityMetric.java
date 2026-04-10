package com.utilitrack.project._7rsra.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "reliability_metrics")
@Data
public class ReliabilityMetric {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long metricId;

    @Column(nullable = false)
    private String scope; // e.g., "North Region", "Feeder-A", "Q3-2025"

    // Storing the core indices
    private Double saidi; 
    private Double saifi;
    private Double caidi;

    @Column(nullable = false)
    private LocalDateTime generatedDate = LocalDateTime.now();
}