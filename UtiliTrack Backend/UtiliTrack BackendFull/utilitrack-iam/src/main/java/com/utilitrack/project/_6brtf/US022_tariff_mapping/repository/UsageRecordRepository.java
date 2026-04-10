package com.utilitrack.project._6brtf.US022_tariff_mapping.repository;

import com.utilitrack.project._6brtf.US022_tariff_mapping.model.UsageRecord;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UsageRecordRepository extends JpaRepository<UsageRecord, Long> {
}