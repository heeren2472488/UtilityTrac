package com.utilitrack.project._5mdum.US017_20missingReads.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "batch_import_error")
public class BatchImportError {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_import_log_id", nullable = false)
    private BatchImportLog batchImportLog;

    @Column(name = "row_index")
    private Integer rowNumber;

    @Column(name = "error_message", length = 1000)
    private String errorMessage;

    @Column(name = "raw_row_data", length = 2000)
    private String rawRowData;

    public BatchImportError() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public BatchImportLog getBatchImportLog() {
        return batchImportLog;
    }

    public void setBatchImportLog(BatchImportLog batchImportLog) {
        this.batchImportLog = batchImportLog;
    }

    public Integer getRowNumber() {
        return rowNumber;
    }

    public void setRowNumber(Integer rowNumber) {
        this.rowNumber = rowNumber;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public String getRawRowData() {
        return rawRowData;
    }

    public void setRawRowData(String rawRowData) {
        this.rawRowData = rawRowData;
    }
}
