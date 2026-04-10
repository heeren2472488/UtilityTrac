package com.utilitrack.project._7rsra.repository;

import com.utilitrack.project._7rsra.entity.SafetyRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SafetyRecordRepository extends JpaRepository<SafetyRecord, Long> {
    List<SafetyRecord> findByWorkOrderId(Long workOrderId);
}
