package com.utilitrack.project._5mdum.US017_20missingReads.service;

import com.utilitrack.project._5mdum.US017_20missingReads.entity.MeterRead;
import com.utilitrack.project._6brtf.US021_managetarrif.model.Tariff;
import com.utilitrack.project._5mdum.US017_20missingReads.entity.UsageAggregate;
import com.utilitrack.project._5mdum.US017_20missingReads.repository.MeterReadRepository;
import com.utilitrack.project._6brtf.US021_managetarrif.repository.TariffRepository;
import com.utilitrack.project._5mdum.US017_20missingReads.repository.UsageAggregateRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

// US020: AC1 - Usage data aggregated correctly; AC2 - Completed before billing cycle; AC3 - Report of aggregated usage
@Service
@Transactional
public class UsageAggregateService {

    @Autowired
    private UsageAggregateRepository aggregateRepository;

    @Autowired
    private MeterReadRepository meterReadRepository;

    @Autowired
    private TariffRepository tariffRepository;

    // AC1: Usage data must be aggregated correctly
    public UsageAggregate aggregateUsage(String customerId, String meterId,
                                          LocalDate periodStart, LocalDate periodEnd,
                                          Long tariffId) {

        // Check if already aggregated
        Optional<UsageAggregate> existing = aggregateRepository
                .findByCustomerIdAndMeterIdAndBillingPeriodStartAndBillingPeriodEnd(
                        customerId, meterId, periodStart, periodEnd);

        UsageAggregate aggregate = existing.orElse(new UsageAggregate());
        aggregate.setCustomerId(customerId);
        aggregate.setMeterId(meterId);
        aggregate.setBillingPeriodStart(periodStart);
        aggregate.setBillingPeriodEnd(periodEnd);
        aggregate.setTariffId(tariffId);
        aggregate.setAggregationStatus(UsageAggregate.AggregationStatus.IN_PROGRESS);
        aggregate = aggregateRepository.save(aggregate);

        try {
            // Fetch reads in period
            List<MeterRead> reads = meterReadRepository.findByCustomerIdAndDateRange(
                    customerId,
                    periodStart.atStartOfDay(),
                    periodEnd.atTime(23, 59, 59)
            );

            // Count read types
            int actual = 0, estimated = 0, missing = 0;
            BigDecimal totalUsage = BigDecimal.ZERO;
            BigDecimal lastRead = null;

            for (MeterRead r : reads) {
                if (r.isMissing() && !r.isGapFilled()) {
                    missing++;
                } else if (r.getReadType() == MeterRead.ReadType.ACTUAL) {
                    actual++;
                } else {
                    estimated++;
                }

                BigDecimal value = r.isGapFilled() ? r.getReadingValue() :
                        (r.getReadingValue() != null ? r.getReadingValue() : r.getEstimatedValue());

                if (value != null && lastRead != null && value.compareTo(lastRead) > 0) {
                    totalUsage = totalUsage.add(value.subtract(lastRead));
                }
                if (value != null) lastRead = value;
            }

            aggregate.setTotalUsage(totalUsage);
            aggregate.setActualReads(actual);
            aggregate.setEstimatedReads(estimated);
            aggregate.setMissingReads(missing);

            // Calculate billing amount if tariff provided
            if (tariffId != null) {
                Optional<Tariff> tariff = tariffRepository.findById(tariffId);
                if (tariff.isPresent() && tariff.get().isBillingEnabled()) {
                    BigDecimal amount = totalUsage.multiply(tariff.get().getRatePerUnit())
                            .add(tariff.get().getFixedCharge())
                            .setScale(2, RoundingMode.HALF_UP);
                    aggregate.setCalculatedAmount(amount);
                }
            }

            // AC2: Mark as billing ready (aggregation completed before billing cycle)
            aggregate.setAggregationStatus(UsageAggregate.AggregationStatus.COMPLETED);
            aggregate.setBillingReady(missing == 0);  // Billing ready only if no missing reads
            aggregate.setAggregatedAt(LocalDateTime.now());

        } catch (Exception e) {
            aggregate.setAggregationStatus(UsageAggregate.AggregationStatus.FAILED);
        }

        return aggregateRepository.save(aggregate);
    }

    public List<UsageAggregate> getAllAggregates() {
        return aggregateRepository.findAll();
    }

    public List<UsageAggregate> getBillingReadyAggregates() {
        return aggregateRepository.findBillingReadyNotReported();
    }

    public List<UsageAggregate> getAggregatesByCustomer(String customerId) {
        return aggregateRepository.findByCustomerId(customerId);
    }

    // AC3: The system should provide a report of the aggregated usage
    public Map<String, Object> generateAggregationReport(String customerId, LocalDate from, LocalDate to) {
        List<UsageAggregate> aggregates = aggregateRepository.findByCustomerAndPeriod(customerId, from, to);

        BigDecimal totalUsage = aggregates.stream()
                .map(UsageAggregate::getTotalUsage)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalAmount = aggregates.stream()
                .map(a -> a.getCalculatedAmount() != null ? a.getCalculatedAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int totalActual = aggregates.stream().mapToInt(UsageAggregate::getActualReads).sum();
        int totalEstimated = aggregates.stream().mapToInt(UsageAggregate::getEstimatedReads).sum();
        int totalMissing = aggregates.stream().mapToInt(UsageAggregate::getMissingReads).sum();
        long billingReady = aggregates.stream().filter(UsageAggregate::isBillingReady).count();

        Map<String, Object> report = new HashMap<>();
        report.put("customerId", customerId);
        report.put("periodFrom", from);
        report.put("periodTo", to);
        report.put("totalUsage", totalUsage);
        report.put("totalCalculatedAmount", totalAmount);
        report.put("totalActualReads", totalActual);
        report.put("totalEstimatedReads", totalEstimated);
        report.put("totalMissingReads", totalMissing);
        report.put("billingReadyCount", billingReady);
        report.put("aggregates", aggregates);
        report.put("reportGeneratedAt", LocalDateTime.now());

        // Mark reports as generated
        aggregates.forEach(a -> {
            a.setReportGenerated(true);
            aggregateRepository.save(a);
        });

        return report;
    }

    // Overall summary for dashboard
    public Map<String, Object> getAggregationSummary() {
        List<UsageAggregate> all = aggregateRepository.findAll();
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalAggregations", all.size());
        summary.put("billingReady", all.stream().filter(UsageAggregate::isBillingReady).count());
        summary.put("pending", all.stream().filter(a -> a.getAggregationStatus() == UsageAggregate.AggregationStatus.PENDING).count());
        summary.put("completed", all.stream().filter(a -> a.getAggregationStatus() == UsageAggregate.AggregationStatus.COMPLETED).count());
        return summary;
    }
}
