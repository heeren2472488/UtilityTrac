package com.utilitrack.project._6brtf.US022_tariff_mapping.service;

import com.utilitrack.project._6brtf.US021_managetarrif.model.Tariff;
import com.utilitrack.project._6brtf.US021_managetarrif.repository.TariffRepository;
import com.utilitrack.project._6brtf.US021_managetarrif.repository.TariffRepository;
import com.utilitrack.project._6brtf.US022_tariff_mapping.model.BillReference;
import com.utilitrack.project._6brtf.US022_tariff_mapping.model.UsageRecord;
import com.utilitrack.project._6brtf.US022_tariff_mapping.repository.BillReferenceRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class TariffMappingServiceImpl implements TariffMappingService {

    private final TariffRepository tariffRepository;
    private final BillReferenceRepository billReferenceRepository;

    public TariffMappingServiceImpl(
            TariffRepository tariffRepository,
            BillReferenceRepository billReferenceRepository) {
        this.tariffRepository = tariffRepository;
        this.billReferenceRepository = billReferenceRepository;
    }

    @Override
    public BillReference calculateBill(UsageRecord usage, String period) {

        Tariff tariff = tariffRepository
                .findByCode(usage.getServiceType()) // ✅ FIX
                .orElseThrow(() ->
                        new RuntimeException(
                                "No tariff configured for service type: " +
                                        usage.getServiceType()
                        )
                );

        BigDecimal units = BigDecimal.valueOf(usage.getUnitsConsumed());
        BigDecimal amount = units.multiply(tariff.getRatePerUnit());

        BillReference ref = new BillReference();
        ref.setCustomerId(usage.getCustomerId());
        ref.setUsageUnits(usage.getUnitsConsumed());
        ref.setAmount(amount);
        ref.setBillingPeriod(period);
        ref.setStatus("GENERATED");

        return billReferenceRepository.save(ref);
    }
}