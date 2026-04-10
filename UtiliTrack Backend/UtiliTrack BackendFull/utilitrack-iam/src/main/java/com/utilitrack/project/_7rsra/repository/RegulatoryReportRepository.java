package com.utilitrack.project._7rsra.repository;

import com.utilitrack.project._7rsra.entity.RegulatoryReport;
import com.utilitrack.project._7rsra.enums.ReportStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RegulatoryReportRepository extends JpaRepository<RegulatoryReport, Long> {
    List<RegulatoryReport> findByStatus(ReportStatus status);
}
