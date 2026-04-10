package com.utilitrack.project._5mdum.US017_20missingReads.repository;

import com.utilitrack.project._5mdum.US017_20missingReads.entity.BatchImportError;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BatchImportErrorRepository extends JpaRepository<BatchImportError, Long> {

    List<BatchImportError> findByBatchImportLogIdOrderByRowNumber(Long batchImportLogId);
}
