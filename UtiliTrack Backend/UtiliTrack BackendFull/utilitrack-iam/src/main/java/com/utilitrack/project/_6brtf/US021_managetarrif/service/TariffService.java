package com.utilitrack.project._6brtf.US021_managetarrif.service;

import com.utilitrack.project._6brtf.US021_managetarrif.model.Tariff;
import com.utilitrack.project._6brtf.US021_managetarrif.repository.TariffRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

// US021: Admin can create, update, delete tariffs; view all; changes reflect immediately; billing works with updated tariffs
@Service
@Transactional
public class TariffService {

    @Autowired
    private TariffRepository tariffRepository;

    // AC1: Admin can create tariffs
    public Tariff createTariff(Tariff tariff) {
        if (tariffRepository.existsByCode(tariff.getCode())) {
            throw new IllegalArgumentException("Tariff with code '" + tariff.getCode() + "' already exists");
        }
        if (tariffRepository.existsByName(tariff.getName())) {
            throw new IllegalArgumentException("Tariff with name '" + tariff.getName() + "' already exists");
        }
        return tariffRepository.save(tariff);
    }

    // AC2: Admin can view a list of all existing tariffs
    @Transactional(readOnly = true)
    public List<Tariff> getAllTariffs() {
        return tariffRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Tariff> getTariffById(Long id) {
        return tariffRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public List<Tariff> getTariffsByStatus(Tariff.TariffStatus status) {
        return tariffRepository.findByStatus(status);
    }

    @Transactional(readOnly = true)
    public List<Tariff> getBillingEnabledTariffs() {
        return tariffRepository.findActiveBillingTariffs();
    }

    // AC1: Admin can update tariffs - AC3: Changes reflect immediately
    public Tariff updateTariff(Long id, Tariff updatedTariff) {
        Tariff existing = tariffRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Tariff not found with id: " + id));

        // Check code uniqueness if changed
        if (!existing.getCode().equals(updatedTariff.getCode()) &&
                tariffRepository.existsByCode(updatedTariff.getCode())) {
            throw new IllegalArgumentException("Tariff code '" + updatedTariff.getCode() + "' already exists");
        }

        existing.setName(updatedTariff.getName());
        existing.setCode(updatedTariff.getCode());
        existing.setRatePerUnit(updatedTariff.getRatePerUnit());
        existing.setUnitType(updatedTariff.getUnitType());
        existing.setFixedCharge(updatedTariff.getFixedCharge());
        existing.setDescription(updatedTariff.getDescription());
        existing.setBillingEnabled(updatedTariff.isBillingEnabled());
        existing.setStatus(updatedTariff.getStatus());
        existing.setEffectiveFrom(updatedTariff.getEffectiveFrom());
        existing.setEffectiveTo(updatedTariff.getEffectiveTo());

        // AC3: Save immediately - JPA flush ensures changes reflect immediately
        return tariffRepository.save(existing);
    }

    // AC1: Admin can delete tariffs
    public void deleteTariff(Long id) {
        if (!tariffRepository.existsById(id)) {
            throw new IllegalArgumentException("Tariff not found with id: " + id);
        }
        tariffRepository.deleteById(id);
    }

    // AC4: Enable billing for a tariff
    public Tariff enableBilling(Long id) {
        Tariff tariff = tariffRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Tariff not found with id: " + id));
        tariff.setBillingEnabled(true);
        tariff.setStatus(Tariff.TariffStatus.ACTIVE);
        return tariffRepository.save(tariff);
    }

    public Tariff disableBilling(Long id) {
        Tariff tariff = tariffRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Tariff not found with id: " + id));
        tariff.setBillingEnabled(false);
        return tariffRepository.save(tariff);
    }
}
