package com.utilitrack.project._7rsra.repository;

import com.utilitrack.project._7rsra.entity.ReliabilityMetric;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReliabilityMetricRepository extends JpaRepository<ReliabilityMetric, Long> {
    List<ReliabilityMetric> findByScopeContainingIgnoreCase(String scope);
}