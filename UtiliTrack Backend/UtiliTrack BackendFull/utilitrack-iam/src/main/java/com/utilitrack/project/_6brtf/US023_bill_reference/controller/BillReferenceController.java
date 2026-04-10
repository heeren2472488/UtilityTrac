package com.utilitrack.project._6brtf.US023_bill_reference.controller;

import com.utilitrack.project._6brtf.US022_tariff_mapping.model.BillReference;
import com.utilitrack.project._6brtf.US023_bill_reference.service.BillReferenceService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bill-reference")
public class BillReferenceController {

    private final BillReferenceService service;

    public BillReferenceController(BillReferenceService service) {
        this.service = service;
    }

    @GetMapping
    public List<BillReference> getAllReferences() {
        return service.getAllBillReferences();
    }

    @GetMapping("/{id}")
    public BillReference getById(@PathVariable Long id) {
        return service.getBillReferenceById(id);
    }
}