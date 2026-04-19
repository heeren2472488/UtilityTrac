package com.utilitrack.project._5mdum.US017_20missingReads.service;



import com.utilitrack.project._5mdum.US017_20missingReads.entity.MeterRead;
import com.utilitrack.project._5mdum.US017_20missingReads.repository.MeterReadRepository;
import com.utilitrack.project._5mdum.US017_20missingReads.dto.MeterReadRequest;
import com.utilitrack.project._5mdum.US017_20missingReads.dto.MeterReadResponse;
import com.utilitrack.project._5mdum.US017_20missingReads.enums.ReadSource;
import com.utilitrack.project._5mdum.US017_20missingReads.exception.MeterDataException;
import com.utilitrack.project.common.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class MeterReadService {

    private final MeterReadRepository meterReadRepository;

    public MeterReadService(MeterReadRepository meterReadRepository) {
        this.meterReadRepository = meterReadRepository;
    }

    /* =====================================================
       SECTION 1: MANUAL / OPERATIONAL METER READS
       ===================================================== */

    public MeterReadResponse saveManualReading(MeterReadRequest request) {
        if (request.getReadingValue() == null || request.getReadingValue().compareTo(BigDecimal.ZERO) < 0) {
            throw new MeterDataException("Reading value must be a non-negative number");
        }

        MeterRead meterRead = new MeterRead();
        meterRead.setMeterId(request.getMeterId());
        meterRead.setReadingValue(request.getReadingValue());
        meterRead.setReadingQuality(request.getReadingQuality());
        meterRead.setReadingDateTime(request.getReadingDateTime());
        meterRead.setReadSource(ReadSource.MANUAL);
        meterRead.setReadType(MeterRead.ReadType.ACTUAL);
        meterRead.setMissing(false);

        MeterRead saved = meterReadRepository.save(meterRead);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public MeterReadResponse getById(Long id) {
        MeterRead meterRead = meterReadRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MeterRead not found with id: " + id));
        return toResponse(meterRead);
    }

    @Transactional(readOnly = true)
    public List<MeterReadResponse> getByMeterId(Long meterId) {
        return meterReadRepository.findByMeterIdOrderByReadingDateTimeDesc(meterId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MeterReadResponse> getByMeterIdAndDateRange(
            Long meterId, LocalDateTime from, LocalDateTime to) {

        if (from.isAfter(to)) {
            throw new MeterDataException("'from' date must be before 'to' date");
        }

        return meterReadRepository
                .findByMeterIdAndReadingDateTimeBetweenOrderByReadingDateTimeDesc(meterId, from, to)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    @Transactional(readOnly = true)
    public List<Long> getAllMeters() {
        return meterReadRepository.findDistinctMeterIds();
    }

    public void deleteById(Long id) {
        if (!meterReadRepository.existsById(id)) {
            throw new ResourceNotFoundException("MeterRead not found with id: " + id);
        }
        meterReadRepository.deleteById(id);
    }

    /* =====================================================
       SECTION 2: MISSING READ IDENTIFICATION & ESTIMATION
       ===================================================== */

    public List<MeterRead> getAllReads() {
        return meterReadRepository.findAll();
    }

    public List<MeterRead> identifyMissingReads() {
        return meterReadRepository.findByMissingTrueAndGapFilledFalse();
    }

    public Map<String, Object> getMissingReadSummary() {
        long totalMissing = meterReadRepository.countByMissingTrue();
        long totalFilled = meterReadRepository.countByGapFilledTrue();

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalMissingReads", totalMissing);
        summary.put("totalGapsFilled", totalFilled);
        summary.put("remainingGaps", totalMissing - totalFilled);
        return summary;
    }

    public MeterRead markAsMissing(Long id) {
        MeterRead read = meterReadRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Meter read not found: " + id));

        read.setMissing(true);
        read.setReadType(MeterRead.ReadType.ESTIMATED);
        return meterReadRepository.save(read);
    }

    public MeterRead estimateMissingRead(Long id, MeterRead.EstimationMethod method) {
        MeterRead missingRead = meterReadRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Meter read not found: " + id));

        if (!missingRead.isMissing()) {
            throw new IllegalArgumentException("Read is not marked as missing");
        }

        List<MeterRead> meterReads =
                meterReadRepository.findByMeterIdOrderByReadingDateTimeAsc(
                        missingRead.getMeterId());

        BigDecimal estimated = switch (method) {
            case LINEAR_INTERPOLATION ->
                    estimateByLinearInterpolation(missingRead, meterReads);
            case AVERAGE_DAILY_USAGE ->
                    estimateByAverageDailyUsage(missingRead, meterReads);
            case PREVIOUS_PERIOD ->
                    estimateByPreviousPeriod(missingRead, meterReads);
            default ->
                    estimateByLinearInterpolation(missingRead, meterReads);
        };

        missingRead.setEstimatedValue(estimated);
        missingRead.setReadType(MeterRead.ReadType.ESTIMATED);
        missingRead.setEstimationMethod(method);
        missingRead.setEstimationNote(
                "Estimated using " + method.name() + " at " + LocalDateTime.now());

        return meterReadRepository.save(missingRead);
    }

    public MeterRead fillGap(Long id) {
        MeterRead missingRead = meterReadRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Meter read not found: " + id));

        if (missingRead.getEstimatedValue() == null) {
            estimateMissingRead(id, MeterRead.EstimationMethod.LINEAR_INTERPOLATION);
        }

        missingRead.setReadingValue(missingRead.getEstimatedValue());
        missingRead.setGapFilled(true);
        missingRead.setReadType(MeterRead.ReadType.INTERPOLATED);
        missingRead.setEstimationNote(
                (missingRead.getEstimationNote() != null
                        ? missingRead.getEstimationNote() + " | "
                        : "") + "Gap filled at " + LocalDateTime.now());

        return meterReadRepository.save(missingRead);
    }

    public List<MeterRead> fillAllGapsForMeter(Long meterId) {
        return meterReadRepository.findByMissingTrueAndGapFilledFalse()
                .stream()
                .filter(r -> r.getMeterId().equals(meterId))
                .map(r -> fillGap(r.getId()))
                .collect(Collectors.toList());
    }

    /* =====================================================
       SECTION 3: ESTIMATION ALGORITHMS
       ===================================================== */

    private BigDecimal estimateByLinearInterpolation(
            MeterRead missing, List<MeterRead> allReads) {

        MeterRead before = null, after = null;

        for (MeterRead r : allReads) {
            if (!r.getId().equals(missing.getId()) && r.getReadingValue() != null) {
                if (r.getReadingDateTime().isBefore(missing.getReadingDateTime())) {
                    before = r;
                }
                if (r.getReadingDateTime().isAfter(missing.getReadingDateTime()) && after == null) {
                    after = r;
                }
            }
        }

        if (before != null && after != null) {
            long totalDays = ChronoUnit.DAYS.between(
                    before.getReadingDateTime(), after.getReadingDateTime());
            long daysToMissing = ChronoUnit.DAYS.between(
                    before.getReadingDateTime(), missing.getReadingDateTime());

            if (totalDays > 0) {
                BigDecimal diff =
                        after.getReadingValue().subtract(before.getReadingValue());
                BigDecimal ratio =
                        BigDecimal.valueOf(daysToMissing)
                                .divide(BigDecimal.valueOf(totalDays), 6, RoundingMode.HALF_UP);
                return before.getReadingValue()
                        .add(diff.multiply(ratio))
                        .setScale(4, RoundingMode.HALF_UP);
            }
        }
        return before != null ? before.getReadingValue() :
                after != null ? after.getReadingValue() : BigDecimal.ZERO;
    }

    private BigDecimal estimateByAverageDailyUsage(
            MeterRead missing, List<MeterRead> allReads) {

        List<MeterRead> actualReads = allReads.stream()
                .filter(r -> !r.isMissing() && r.getReadingValue() != null)
                .collect(Collectors.toList());

        if (actualReads.size() < 2) return BigDecimal.ZERO;

        BigDecimal totalUsage = BigDecimal.ZERO;
        long totalDays = 0;

        for (int i = 1; i < actualReads.size(); i++) {
            totalUsage = totalUsage.add(
                    actualReads.get(i).getReadingValue()
                            .subtract(actualReads.get(i - 1).getReadingValue()).abs());
            totalDays += ChronoUnit.DAYS.between(
                    actualReads.get(i - 1).getReadingDateTime(),
                    actualReads.get(i).getReadingDateTime());
        }

        if (totalDays == 0) return BigDecimal.ZERO;
        return totalUsage
                .divide(BigDecimal.valueOf(totalDays), 6, RoundingMode.HALF_UP)
                .setScale(4, RoundingMode.HALF_UP);
    }

    private BigDecimal estimateByPreviousPeriod(
            MeterRead missing, List<MeterRead> allReads) {

        return allReads.stream()
                .filter(r -> r.getReadingDateTime().isBefore(missing.getReadingDateTime())
                        && r.getReadingValue() != null)
                .reduce((first, second) -> second)
                .map(MeterRead::getReadingValue)
                .orElse(BigDecimal.ZERO);
    }

    /* =====================================================
       SECTION 4: DTO MAPPING
       ===================================================== */

    public MeterReadResponse toResponse(MeterRead meterRead) {
        MeterReadResponse response = new MeterReadResponse();
        response.setId(meterRead.getId());
        response.setMeterId(meterRead.getMeterId());
        response.setReadingValue(meterRead.getReadingValue());
        response.setReadingQuality(meterRead.getReadingQuality());
        response.setReadingDateTime(meterRead.getReadingDateTime());
        response.setReadSource(meterRead.getReadSource());
        response.setCreatedAt(meterRead.getCreatedAt());
        return response;
    }

    public List<MeterRead> detectAndCreateMissingReads() {

        List<MeterRead> allReads = meterReadRepository.findAll();

        Map<Long, List<MeterRead>> grouped =
                allReads.stream()
                        .filter(r -> r.getReadingDateTime() != null)
                        .collect(Collectors.groupingBy(MeterRead::getMeterId));

        List<MeterRead> created = new ArrayList<>();

        for (List<MeterRead> reads : grouped.values()) {
            reads.sort(Comparator.comparing(MeterRead::getReadingDateTime));

            for (int i = 0; i < reads.size() - 1; i++) {

                LocalDate current = reads.get(i).getReadingDateTime().toLocalDate();
                LocalDate next = reads.get(i + 1).getReadingDateTime().toLocalDate();

                long gap = ChronoUnit.DAYS.between(current, next);

                if (gap > 1) {
                    LocalDate d = current.plusDays(1);
                    while (d.isBefore(next)) {
                        MeterRead m = new MeterRead();
                        m.setMeterId(reads.get(i).getMeterId());
                        m.setReadingDateTime(d.atStartOfDay());
                        m.setMissing(true);
                        m.setGapFilled(false);
                        m.setReadType(MeterRead.ReadType.ESTIMATED);
                        m.setReadSource(ReadSource.BATCH);
                        created.add(meterReadRepository.save(m));
                        d = d.plusDays(1);
                    }
                }
            }
        }
        return created;
    }
}