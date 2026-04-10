package com.utilitrack.project._6brtf.US021_managetarrif.controller;

import com.utilitrack.project._6brtf.US021_managetarrif.model.Tariff;
import com.utilitrack.project._6brtf.US021_managetarrif.service.TariffService;
import com.utilitrack.project.common.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// US021: Admin manages tariffs to enable billing
@RestController
@RequestMapping("/api/tariffs")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
public class TarifController {

    @Autowired
    private TariffService tariffService;

    // AC1: Admin can create tariffs
    @PostMapping
    public ResponseEntity<ApiResponse<Tariff>> createTariff(
            @Valid @RequestBody Tariff tariff) {
        try {
            Tariff created = tariffService.createTariff(tariff);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.ok(created, "Tariff created successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    // AC2: Admin can view a list of all existing tariffs
    @GetMapping
    public ResponseEntity<ApiResponse<List<Tariff>>> getAllTariffs() {
        List<Tariff> tariffs = tariffService.getAllTariffs();
        return ResponseEntity.ok(
                ApiResponse.ok(tariffs, "Tariffs retrieved successfully")
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Tariff>> getTariffById(
            @PathVariable Long id) {

        return tariffService.getTariffById(id)
                .map(t -> ResponseEntity.ok(
                        ApiResponse.ok(t, "Tariff found")))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<ApiResponse<List<Tariff>>> getTariffsByStatus(
            @PathVariable Tariff.TariffStatus status) {

        return ResponseEntity.ok(
                ApiResponse.ok(
                        tariffService.getTariffsByStatus(status),
                        "Filtered tariffs")
        );
    }

    @GetMapping("/billing-enabled")
    public ResponseEntity<ApiResponse<List<Tariff>>> getBillingEnabledTariffs() {
        return ResponseEntity.ok(
                ApiResponse.ok(
                        tariffService.getBillingEnabledTariffs(),
                        "Billing-enabled tariffs")
        );
    }

    // AC1 + AC3: Admin can update tariffs and changes reflect immediately
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Tariff>> updateTariff(
            @PathVariable Long id,
            @Valid @RequestBody Tariff tariff) {
        try {
            Tariff updated = tariffService.updateTariff(id, tariff);
            return ResponseEntity.ok(
                    ApiResponse.ok(
                            updated,
                            "Tariff updated successfully - changes reflected immediately")
            );
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    // AC1: Admin can delete tariffs
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTariff(
            @PathVariable Long id) {
        try {
            tariffService.deleteTariff(id);
            return ResponseEntity.ok(
                    ApiResponse.ok(null, "Tariff deleted successfully")
            );
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    // AC4: Enable billing for tariff
    @PatchMapping("/{id}/enable-billing")
    public ResponseEntity<ApiResponse<Tariff>> enableBilling(
            @PathVariable Long id) {
        try {
            return ResponseEntity.ok(
                    ApiResponse.ok(
                            tariffService.enableBilling(id),
                            "Billing enabled for tariff - billing processes will now function correctly")
            );
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @PatchMapping("/{id}/disable-billing")
    public ResponseEntity<ApiResponse<Tariff>> disableBilling(
            @PathVariable Long id) {
        try {
            return ResponseEntity.ok(
                    ApiResponse.ok(
                            tariffService.disableBilling(id),
                            "Billing disabled for tariff")
            );
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
}