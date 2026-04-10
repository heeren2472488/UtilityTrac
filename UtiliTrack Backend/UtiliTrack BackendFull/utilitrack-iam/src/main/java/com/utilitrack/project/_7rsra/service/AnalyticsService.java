package com.utilitrack.project._7rsra.service;

import com.utilitrack.project._7rsra.entity.RegulatoryReport;
import com.utilitrack.project._7rsra.entity.ReliabilityMetric;
import com.utilitrack.project._7rsra.entity.SafetyRecord;
import com.utilitrack.project._7rsra.enums.ReportStatus;
import com.utilitrack.project._7rsra.repository.RegulatoryReportRepository;
import com.utilitrack.project._7rsra.repository.ReliabilityMetricRepository;
import com.utilitrack.project._7rsra.repository.SafetyRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AnalyticsService {

    @Autowired
    private ReliabilityMetricRepository reliabilityRepo;
    @Autowired
    private SafetyRecordRepository safetyRepo;
    @Autowired
    private RegulatoryReportRepository reportRepo;

    // --- US024: Reliability KPIs ---
    public ReliabilityMetric calculateAndSaveMetric(ReliabilityMetric metric) {
        metric.setGeneratedDate(LocalDateTime.now());
        
        // US024 Scenario 2: Division by Zero Prevention
        if (metric.getSaifi() == null || metric.getSaifi() == 0.0) {
            metric.setCaidi(0.0); // Or leave as null, depending on your exact business preference
        } else {
            metric.setCaidi(metric.getSaidi() / metric.getSaifi());
        }
        
        return reliabilityRepo.save(metric);
    }

    public List<ReliabilityMetric> getAllMetrics() {
        return reliabilityRepo.findAll();
    }

    // --- US025: Safety Events ---
    public SafetyRecord logSafetyIncident(SafetyRecord record) {
        // Validation is handled by @Valid in the controller before reaching here.
        // reportedDate is auto-stamped in the entity instantiation.
        return safetyRepo.save(record);
    }

    public List<SafetyRecord> getAllSafetyRecords() {
        return safetyRepo.findAll();
    }

    // --- US026: Regulatory Reports ---
    public RegulatoryReport createDraftReport(RegulatoryReport report) {
        // US026 Scenario 1: Default to DRAFT
        report.setStatus(ReportStatus.DRAFT);
        report.setGeneratedDate(LocalDateTime.now());
        return reportRepo.save(report);
    }

    public RegulatoryReport submitReport(Long reportId) {
        RegulatoryReport report = reportRepo.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Report not found with ID: " + reportId));
        
        // US026 Scenario 2: Prevent modification if already submitted
        if (report.getStatus() == ReportStatus.SUBMITTED) {
            throw new IllegalStateException("Report is already submitted and cannot be modified.");
        }

        report.setStatus(ReportStatus.SUBMITTED);
        return reportRepo.save(report);
    }
    
    public List<RegulatoryReport> getAllReports() {
        // US026 Scenario 3: Returning all reports (status is included in the Entity)
        return reportRepo.findAll();
    }
}