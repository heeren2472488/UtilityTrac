package com.utilitrack.project._5mdum.US017_20missingReads.repository;

import com.utilitrack.project._5mdum.US017_20missingReads.entity.BatchImportLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BatchImportLogRepository extends JpaRepository<BatchImportLog, Long> {

    List<BatchImportLog> findAllByOrderByCreatedAtDesc();
}
