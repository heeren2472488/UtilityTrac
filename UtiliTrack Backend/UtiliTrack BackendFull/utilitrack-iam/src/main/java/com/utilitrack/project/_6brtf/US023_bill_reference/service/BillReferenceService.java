package com.utilitrack.project._6brtf.US023_bill_reference.service;

import com.utilitrack.project._6brtf.US022_tariff_mapping.model.BillReference;
import java.util.List;

public interface BillReferenceService {

    List<BillReference> getAllBillReferences();

    BillReference getBillReferenceById(Long id);
}