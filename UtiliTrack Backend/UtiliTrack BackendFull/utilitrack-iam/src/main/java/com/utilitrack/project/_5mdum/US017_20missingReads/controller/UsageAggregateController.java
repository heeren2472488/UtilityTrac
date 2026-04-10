package com.utilitrack.project._5mdum.US017_20missingReads.controller;

import com.utilitrack.project.common.ApiResponse;
import com.utilitrack.project._5mdum.US017_20missingReads.entity.UsageAggregate;
import com.utilitrack.project._5mdum.US017_20missingReads.service.UsageAggregateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

// US020: Aggregate usage data; completed before billing cycle; provide report
@RestController
@RequestMapping("/api/usage-aggregates")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
public class UsageAggregateController {

    @Autowired
    private UsageAggregateService aggregateService;

    // AC1 + AC2: Aggregate usage correctly and mark billing ready
    @PostMapping("/aggregate")
    public ResponseEntity<ApiResponse<UsageAggregate>> aggregateUsage(
            @RequestParam String customerId,
            @RequestParam String meterId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate periodStart,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate periodEnd,
            @RequestParam(required = false) Long tariffId) {

        UsageAggregate result = aggregateService.aggregateUsage(
                customerId, meterId, periodStart, periodEnd, tariffId);

        String msg = result.isBillingReady()
                ? "Usage aggregated and billing ready!"
                : "Usage aggregated but billing not ready - missing reads detected";

        return ResponseEntity.ok(ApiResponse.ok(result, msg));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<UsageAggregate>>> getAllAggregates() {
        return ResponseEntity.ok(
                ApiResponse.ok(aggregateService.getAllAggregates(), "All aggregates")
        );
    }

    @GetMapping("/billing-ready")
    public ResponseEntity<ApiResponse<List<UsageAggregate>>> getBillingReady() {
        return ResponseEntity.ok(
                ApiResponse.ok(
                        aggregateService.getBillingReadyAggregates(),
                        "Billing-ready aggregates (aggregation completed before billing cycle)")
        );
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<ApiResponse<List<UsageAggregate>>> getByCustomer(
            @PathVariable String customerId) {
        return ResponseEntity.ok(
                ApiResponse.ok(
                        aggregateService.getAggregatesByCustomer(customerId),
                        "Aggregates for customer " + customerId)
        );
    }

    // AC3: The system should provide a report of the aggregated usage
    @GetMapping("/report")
    public ResponseEntity<ApiResponse<Map<String, Object>>> generateReport(
            @RequestParam String customerId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {

        Map<String, Object> report =
                aggregateService.generateAggregationReport(customerId, from, to);

        return ResponseEntity.ok(
                ApiResponse.ok(report, "Aggregated usage report generated")
        );
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSummary() {
        return ResponseEntity.ok(
                ApiResponse.ok(
                        aggregateService.getAggregationSummary(),
                        "Aggregation summary")
        );
    }
}