package com.utilitrack.project._6brtf.US022_tariff_mapping.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

/**
 * US022 - Bill Reference Entity
 *
 * Represents a generated bill based on usage and tariff.
 */
@Entity
@Table(name = "bill_references")
public class BillReference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long customerId;

    @Column(nullable = false)
    private double usageUnits;

    // ✅ FIX: Use BigDecimal for money
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false)
    private String billingPeriod;

    @Column(nullable = false)
    private String status;   // GENERATED / REVIEW / FINALIZED

    /* ===============================
       Getters & Setters
       =============================== */

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public double getUsageUnits() {
        return usageUnits;
    }

    public void setUsageUnits(double usageUnits) {
        this.usageUnits = usageUnits;
    }

    // ✅ BigDecimal getter/setter
    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getBillingPeriod() {
        return billingPeriod;
    }

    public void setBillingPeriod(String billingPeriod) {
        this.billingPeriod = billingPeriod;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
