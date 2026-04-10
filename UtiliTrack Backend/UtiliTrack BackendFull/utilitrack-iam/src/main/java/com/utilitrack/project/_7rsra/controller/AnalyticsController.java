package com.utilitrack.project._7rsra.controller;

import com.utilitrack.project._7rsra.entity.RegulatoryReport;
import com.utilitrack.project._7rsra.entity.ReliabilityMetric;
import com.utilitrack.project._7rsra.entity.SafetyRecord;
import com.utilitrack.project._7rsra.service.AnalyticsService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/analytics")
@CrossOrigin(origins = "*") 
public class AnalyticsController {

    @Autowired
    private AnalyticsService analyticsService;

    // --- US024 Endpoints ---
    @PostMapping("/reliability")
    public ResponseEntity<ReliabilityMetric> addMetric(@RequestBody ReliabilityMetric metric) {
        // Returns HTTP 200 OK with the saved JSON object
        return ResponseEntity.ok(analyticsService.calculateAndSaveMetric(metric));
    }

    @GetMapping("/reliability")
    public ResponseEntity<List<ReliabilityMetric>> getMetrics() {
        return ResponseEntity.ok(analyticsService.getAllMetrics());
    }

    // --- US025 Endpoints ---
    @PostMapping("/safety")
    public ResponseEntity<SafetyRecord> logSafetyIncident(@Valid @RequestBody SafetyRecord record) {
        // @Valid triggers the mandatory field checks. If it fails, GlobalExceptionHandler takes over.
        return ResponseEntity.ok(analyticsService.logSafetyIncident(record));
    }

    @GetMapping("/safety")
    public ResponseEntity<List<SafetyRecord>> getSafetyRecords() {
        return ResponseEntity.ok(analyticsService.getAllSafetyRecords());
    }

    // --- US026 Endpoints ---
    @PostMapping("/reports/draft")
    public ResponseEntity<RegulatoryReport> createDraftReport(@RequestBody RegulatoryReport report) {
        return ResponseEntity.ok(analyticsService.createDraftReport(report));
    }

    @PutMapping("/reports/{id}/submit")
    public ResponseEntity<RegulatoryReport> submitReport(@PathVariable Long id) {
        return ResponseEntity.ok(analyticsService.submitReport(id));
    }

    @GetMapping("/reports")
    public ResponseEntity<List<RegulatoryReport>> getAllReports() {
        return ResponseEntity.ok(analyticsService.getAllReports());
    }
}