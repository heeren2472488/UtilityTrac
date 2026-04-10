package com.utilitrack.project._6brtf.US022_tariff_mapping.controller;

import com.utilitrack.project._6brtf.US021_managetarrif.model.Tariff;
import com.utilitrack.project._6brtf.US022_tariff_mapping.model.BillReference;
import com.utilitrack.project._6brtf.US022_tariff_mapping.model.UsageRecord;
import com.utilitrack.project._6brtf.US022_tariff_mapping.repository.UsageRecordRepository;
import com.utilitrack.project._6brtf.US022_tariff_mapping.service.TariffMappingService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tariff")
public class TariffMappingController {

    private final TariffMappingService tariffService;
    private final UsageRecordRepository usageRepo;

    public TariffMappingController(TariffMappingService tariffService,
                                   UsageRecordRepository usageRepo) {
        this.tariffService = tariffService;
        this.usageRepo = usageRepo;
    }

    @PostMapping("/calculate/{billingPeriod}")
    public BillReference calculate(@RequestBody UsageRecord usage,
                                   @PathVariable String billingPeriod) {

        usageRepo.save(usage);
        return tariffService.calculateBill(usage, billingPeriod);
    }
}