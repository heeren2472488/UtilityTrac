package com.utilitrack.project._5mdum.US017_20missingReads.service;

import com.utilitrack.project._5mdum.US017_20missingReads.dto.BatchImportErrorDto;
import com.utilitrack.project._5mdum.US017_20missingReads.dto.BatchImportResponse;
import com.utilitrack.project._5mdum.US017_20missingReads.entity.BatchImportError;
import com.utilitrack.project._5mdum.US017_20missingReads.entity.BatchImportLog;
import com.utilitrack.project._5mdum.US017_20missingReads.entity.MeterRead;
import com.utilitrack.project._5mdum.US017_20missingReads.enums.BatchImportStatus;
import com.utilitrack.project._5mdum.US017_20missingReads.enums.ReadSource;
import com.utilitrack.project._5mdum.US017_20missingReads.enums.ReadingQuality;
import com.utilitrack.project._5mdum.US017_20missingReads.exception.MeterDataException;
import com.utilitrack.project.common.ResourceNotFoundException;
import com.utilitrack.project._5mdum.US017_20missingReads.repository.BatchImportErrorRepository;
import com.utilitrack.project._5mdum.US017_20missingReads.repository.BatchImportLogRepository;
import com.utilitrack.project._5mdum.US017_20missingReads.repository.MeterReadRepository;
import com.opencsv.CSVReader;
import com.opencsv.exceptions.CsvException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class BatchImportService {

    private static final DateTimeFormatter DATETIME_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final DateTimeFormatter ISO_FORMATTER =
            DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private final BatchImportLogRepository batchImportLogRepository;
    private final BatchImportErrorRepository batchImportErrorRepository;
    private final MeterReadRepository meterReadRepository;

    public BatchImportService(BatchImportLogRepository batchImportLogRepository,
                              BatchImportErrorRepository batchImportErrorRepository,
                              MeterReadRepository meterReadRepository) {
        this.batchImportLogRepository = batchImportLogRepository;
        this.batchImportErrorRepository = batchImportErrorRepository;
        this.meterReadRepository = meterReadRepository;
    }

    public BatchImportResponse importCsv(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new MeterDataException("CSV file must not be empty");
        }
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !originalFilename.toLowerCase().endsWith(".csv")) {
            throw new MeterDataException("Only CSV files are supported");
        }

        BatchImportLog log = new BatchImportLog();
        log.setFileName(originalFilename);
        log.setStatus(BatchImportStatus.PROCESSING);
        log.setCreatedAt(LocalDateTime.now());
        log.setTotalRecords(0);
        log.setSuccessCount(0);
        log.setSkippedCount(0);
        log.setErrorCount(0);
        log = batchImportLogRepository.save(log);

        List<BatchImportError> errors = new ArrayList<>();
        int totalRecords = 0;
        int successCount = 0;
        int skippedCount = 0;
        int errorCount = 0;

        try {
            List<String[]> rows = parseCsv(file);
            if (rows.isEmpty()) {
                log.setStatus(BatchImportStatus.COMPLETED);
                batchImportLogRepository.save(log);
                return toResponse(log, errors);
            }

            int startRow = 1;
            int rowIndex = startRow;

            for (int i = startRow; i < rows.size(); i++) {
                String[] row = rows.get(i);
                totalRecords++;
                String rawData = String.join(",", row);

                try {
                    MeterRead meterRead = parseRow(row, rowIndex);

                    boolean duplicate = meterReadRepository.existsDuplicate(
                            meterRead.getMeterId(),
                            meterRead.getReadingDateTime(),
                            meterRead.getReadingValue());

                    if (duplicate) {
                        skippedCount++;
                        rowIndex++;
                        continue;
                    }

                    meterReadRepository.save(meterRead);
                    successCount++;

                } catch (Exception ex) {
                    errorCount++;
                    BatchImportError error = new BatchImportError();
                    error.setBatchImportLog(log);
                    error.setRowNumber(rowIndex);
                    error.setErrorMessage(ex.getMessage());
                    error.setRawRowData(rawData);
                    errors.add(error);
                }

                rowIndex++;
            }

            if (!errors.isEmpty()) {
                batchImportErrorRepository.saveAll(errors);
            }

            log.setTotalRecords(totalRecords);
            log.setSuccessCount(successCount);
            log.setSkippedCount(skippedCount);
            log.setErrorCount(errorCount);
            log.setStatus(BatchImportStatus.COMPLETED);
            batchImportLogRepository.save(log);

        } catch (Exception ex) {
            log.setStatus(BatchImportStatus.FAILED);
            batchImportLogRepository.save(log);
            throw new MeterDataException("Failed to process CSV file: " + ex.getMessage());
        }

        return toResponse(log, errors);
    }

    @Transactional(readOnly = true)
    public List<BatchImportResponse> getAllImports() {
        return batchImportLogRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(log -> toResponse(log, new ArrayList<>()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BatchImportResponse getImportById(Long id) {
        BatchImportLog log = batchImportLogRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("BatchImportLog not found with id: " + id));
        List<BatchImportError> errors = batchImportErrorRepository.findByBatchImportLogIdOrderByRowNumber(id);
        return toResponse(log, errors);
    }

    private List<String[]> parseCsv(MultipartFile file) throws IOException, CsvException {
        try (CSVReader reader = new CSVReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            return reader.readAll();
        }
    }

    private MeterRead parseRow(String[] row, int rowNumber) {
        if (row.length < 4) {
            throw new MeterDataException(
                    "Row " + rowNumber + ": expected at least 4 columns (meterId, readingValue, readingQuality, readingDateTime)");
        }

        String meterIdStr = row[0].trim();
        String readingValueStr = row[1].trim();
        String readingQualityStr = row[2].trim();
        String readingDateTimeStr = row[3].trim();

        Long meterId;
        try {
            meterId = Long.parseLong(meterIdStr);
        } catch (NumberFormatException ex) {
            throw new MeterDataException("Row " + rowNumber + ": invalid meterId '" + meterIdStr + "'");
        }

        BigDecimal readingValue;
        try {
            readingValue = new BigDecimal(readingValueStr);
            if (readingValue.doubleValue() < 0) {
                throw new MeterDataException("Row " + rowNumber + ": readingValue must be non-negative");
            }
        } catch (NumberFormatException ex) {
            throw new MeterDataException("Row " + rowNumber + ": invalid readingValue '" + readingValueStr + "'");
        }

        ReadingQuality readingQuality;
        try {
            readingQuality = ReadingQuality.valueOf(readingQualityStr.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new MeterDataException(
                    "Row " + rowNumber + ": invalid readingQuality '" + readingQualityStr + "' (must be GOOD or SUSPECT)");
        }

        LocalDateTime readingDateTime = parseDateTime(readingDateTimeStr, rowNumber);

        MeterRead meterRead = new MeterRead();
        meterRead.setMeterId(meterId);
        meterRead.setReadingValue(readingValue);
        meterRead.setReadingQuality(readingQuality);
        meterRead.setReadingDateTime(readingDateTime);
        meterRead.setReadSource(ReadSource.BATCH);
        meterRead.setCreatedAt(LocalDateTime.now());
        return meterRead;
    }

    private LocalDateTime parseDateTime(String dateTimeStr, int rowNumber) {
        try {
            return LocalDateTime.parse(dateTimeStr, DATETIME_FORMATTER);
        } catch (DateTimeParseException ex1) {
            try {
                return LocalDateTime.parse(dateTimeStr, ISO_FORMATTER);
            } catch (DateTimeParseException ex2) {
                throw new MeterDataException(
                        "Row " + rowNumber + ": invalid readingDateTime '" + dateTimeStr +
                        "' (expected yyyy-MM-dd HH:mm:ss or ISO format)");
            }
        }
    }

    private BatchImportResponse toResponse(BatchImportLog log, List<BatchImportError> errors) {
        BatchImportResponse response = new BatchImportResponse();
        response.setId(log.getId());
        response.setFileName(log.getFileName());
        response.setStatus(log.getStatus());
        response.setTotalRecords(log.getTotalRecords());
        response.setSuccessCount(log.getSuccessCount());
        response.setSkippedCount(log.getSkippedCount());
        response.setErrorCount(log.getErrorCount());
        response.setCreatedAt(log.getCreatedAt());

        List<BatchImportErrorDto> errorDtos = errors.stream()
                .map(e -> {
                    BatchImportErrorDto dto = new BatchImportErrorDto();
                    dto.setId(e.getId());
                    dto.setRowNumber(e.getRowNumber());
                    dto.setErrorMessage(e.getErrorMessage());
                    dto.setRawRowData(e.getRawRowData());
                    return dto;
                })
                .collect(Collectors.toList());

        response.setErrors(errorDtos);
        return response;
    }
}
