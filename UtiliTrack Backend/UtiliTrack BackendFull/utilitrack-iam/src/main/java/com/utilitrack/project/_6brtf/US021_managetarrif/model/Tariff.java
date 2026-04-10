package com.utilitrack.project._6brtf.US021_managetarrif.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.time.LocalDateTime;

// US021: As an Admin, I want to manage tariffs so that enable billing
@Entity
@Table(name = "tariffs")
public class Tariff {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Tariff name is required")
    @Column(nullable = false, unique = true)
    private String name;

    @NotBlank(message = "Tariff code is required")
    @Column(nullable = false, unique = true)
    private String code;

    @NotNull(message = "Rate per unit is required")
    @Positive(message = "Rate must be positive")
    @Column(name = "rate_per_unit", nullable = false, precision = 10, scale = 4)
    private BigDecimal ratePerUnit;

    @NotBlank(message = "Unit type is required")
    @Column(name = "unit_type", nullable = false)
    private String unitType; // kWh, m3, etc.

    @Column(name = "fixed_charge", precision = 10, scale = 2)
    private BigDecimal fixedCharge = BigDecimal.ZERO;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "billing_enabled", nullable = false)
    private boolean billingEnabled = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TariffStatus status = TariffStatus.ACTIVE;

    @Column(name = "effective_from")
    private LocalDateTime effectiveFrom;

    @Column(name = "effective_to")
    private LocalDateTime effectiveTo;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum TariffStatus {
        ACTIVE, INACTIVE, DRAFT
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public BigDecimal getRatePerUnit() { return ratePerUnit; }
    public void setRatePerUnit(BigDecimal ratePerUnit) { this.ratePerUnit = ratePerUnit; }
    public String getUnitType() { return unitType; }
    public void setUnitType(String unitType) { this.unitType = unitType; }
    public BigDecimal getFixedCharge() { return fixedCharge; }
    public void setFixedCharge(BigDecimal fixedCharge) { this.fixedCharge = fixedCharge; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public boolean isBillingEnabled() { return billingEnabled; }
    public void setBillingEnabled(boolean billingEnabled) { this.billingEnabled = billingEnabled; }
    public TariffStatus getStatus() { return status; }
    public void setStatus(TariffStatus status) { this.status = status; }
    public LocalDateTime getEffectiveFrom() { return effectiveFrom; }
    public void setEffectiveFrom(LocalDateTime effectiveFrom) { this.effectiveFrom = effectiveFrom; }
    public LocalDateTime getEffectiveTo() { return effectiveTo; }
    public void setEffectiveTo(LocalDateTime effectiveTo) { this.effectiveTo = effectiveTo; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
