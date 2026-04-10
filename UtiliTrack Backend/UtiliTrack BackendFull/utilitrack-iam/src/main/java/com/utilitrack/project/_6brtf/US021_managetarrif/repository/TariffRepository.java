package com.utilitrack.project._6brtf.US021_managetarrif.repository;

import com.utilitrack.project._6brtf.US021_managetarrif.model.Tariff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TariffRepository extends JpaRepository<Tariff, Long> {

    List<Tariff> findByStatus(Tariff.TariffStatus status);

    List<Tariff> findByBillingEnabledTrue();

    Optional<Tariff> findByCode(String code);

    boolean existsByCode(String code);

    boolean existsByName(String name);

    @Query("SELECT t FROM Tariff t WHERE t.billingEnabled = true AND t.status = 'ACTIVE'")
    List<Tariff> findActiveBillingTariffs();

    // ✅ ADD THIS

}