package com.utilitrack.project._6brtf.US022_tariff_mapping.service;

import com.utilitrack.project._6brtf.US022_tariff_mapping.model.BillReference;
import com.utilitrack.project._6brtf.US022_tariff_mapping.model.UsageRecord;

public interface TariffMappingService {
    BillReference calculateBill(UsageRecord usageRecord, String billingPeriod);
}