package com.utilitrack.project._5mdum.US017_20missingReads.controller;

import com.utilitrack.project.common.ApiResponse;
import com.utilitrack.project._5mdum.US017_20missingReads.entity.MeterRead;
import com.utilitrack.project._5mdum.US017_20missingReads.service.MeterReadService;
import com.utilitrack.project._5mdum.US017_20missingReads.dto.*;
import com.utilitrack.project._5mdum.US017_20missingReads.service.BatchImportService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/meter-reads")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
public class MeterReadController {

    private final MeterReadService meterReadService;
    private final BatchImportService batchImportService;

    public MeterReadController(
            MeterReadService meterReadService,
            BatchImportService batchImportService) {
        this.meterReadService = meterReadService;
        this.batchImportService = batchImportService;
    }

    /* =====================================================
       SECTION 1: MANUAL METER READS
       ===================================================== */

    @PostMapping("/manual")
    public ResponseEntity<ApiResponse<MeterReadResponse>> createMeterRead(
            @Valid @RequestBody MeterReadRequest request) {

        MeterReadResponse response = meterReadService.saveManualReading(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response, "Meter reading captured successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MeterReadResponse>> getMeterReadById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                ApiResponse.ok(meterReadService.getById(id), "Meter read found")
        );
    }

    @GetMapping("/meter/{meterId}")
    public ResponseEntity<ApiResponse<List<MeterReadResponse>>> getReadsByMeter(
            @PathVariable Long meterId) {

        return ResponseEntity.ok(
                ApiResponse.ok(
                        meterReadService.getByMeterId(meterId),
                        "Reads for meter " + meterId)
        );
    }

    @GetMapping("/meter/{meterId}/range")
    public ResponseEntity<ApiResponse<List<MeterReadResponse>>> getReadsByRange(
            @PathVariable Long meterId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {

        return ResponseEntity.ok(
                ApiResponse.ok(
                        meterReadService.getByMeterIdAndDateRange(meterId, from, to),
                        "Reads in date range")
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteMeterRead(@PathVariable Long id) {
        meterReadService.deleteById(id);
        return ResponseEntity.ok(
                ApiResponse.ok(null, "Meter reading deleted")
        );
    }

    /* =====================================================
       SECTION 2: BATCH IMPORT
       ===================================================== */

    @PostMapping(value = "/batch/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<BatchImportResponse>> importBatch(
            @RequestParam("file") MultipartFile file) {

        BatchImportResponse response = batchImportService.importCsv(file);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response, "Batch import completed"));
    }

    @GetMapping("/batch")
    public ResponseEntity<ApiResponse<List<BatchImportResponse>>> getAllBatchImports() {
        return ResponseEntity.ok(
                ApiResponse.ok(
                        batchImportService.getAllImports(),
                        "All batch imports")
        );
    }

    @GetMapping("/batch/{id}")
    public ResponseEntity<ApiResponse<BatchImportResponse>> getBatchById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                ApiResponse.ok(
                        batchImportService.getImportById(id),
                        "Batch import details")
        );
    }

    /* =====================================================
       SECTION 3: MISSING READS & BILLING GAP LOGIC
       ===================================================== */

    @GetMapping("/missing")
    public ResponseEntity<ApiResponse<List<MeterRead>>> getMissingReads() {
        return ResponseEntity.ok(
                ApiResponse.ok(
                        meterReadService.identifyMissingReads(),
                        "Missing reads identified")
        );
    }

    @GetMapping("/missing/summary")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMissingReadSummary() {
        return ResponseEntity.ok(
                ApiResponse.ok(
                        meterReadService.getMissingReadSummary(),
                        "Missing read summary")
        );
    }

    @PatchMapping("/{id}/mark-missing")
    public ResponseEntity<ApiResponse<MeterRead>> markAsMissing(@PathVariable Long id) {
        return ResponseEntity.ok(
                ApiResponse.ok(
                        meterReadService.markAsMissing(id),
                        "Read marked as missing")
        );
    }

    @PostMapping("/{id}/estimate")
    public ResponseEntity<ApiResponse<MeterRead>> estimateMissingRead(
            @PathVariable Long id,
            @RequestParam(defaultValue = "LINEAR_INTERPOLATION")
            MeterRead.EstimationMethod method) {

        return ResponseEntity.ok(
                ApiResponse.ok(
                        meterReadService.estimateMissingRead(id, method),
                        "Missing read estimated using " + method)
        );
    }

    @PostMapping("/{id}/fill-gap")
    public ResponseEntity<ApiResponse<MeterRead>> fillGap(@PathVariable Long id) {
        return ResponseEntity.ok(
                ApiResponse.ok(
                        meterReadService.fillGap(id),
                        "Gap filled successfully")
        );
    }

    @PostMapping("/meter/{meterId}/fill-all-gaps")
    public ResponseEntity<ApiResponse<List<MeterRead>>> fillAllGaps(
            @PathVariable Long meterId) {

        return ResponseEntity.ok(
                ApiResponse.ok(
                        meterReadService.fillAllGapsForMeter(meterId),
                        "All gaps filled for meter " + meterId)
        );
    }
}