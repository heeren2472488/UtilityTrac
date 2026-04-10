package com.utilitrack.project._6brtf.US023_bill_reference.service;

import com.utilitrack.project._6brtf.US022_tariff_mapping.model.BillReference;
import com.utilitrack.project._6brtf.US022_tariff_mapping.repository.BillReferenceRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BillReferenceServiceImpl implements BillReferenceService {

    private final BillReferenceRepository repository;

    public BillReferenceServiceImpl(BillReferenceRepository repository) {
        this.repository = repository;
    }

    @Override
    public List<BillReference> getAllBillReferences() {
        return repository.findAll();
    }

    @Override
    public BillReference getBillReferenceById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bill reference not found: " + id));
    }
}