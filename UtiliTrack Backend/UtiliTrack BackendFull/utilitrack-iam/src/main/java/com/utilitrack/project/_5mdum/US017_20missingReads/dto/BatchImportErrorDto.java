package com.utilitrack.project._5mdum.US017_20missingReads.dto;

public class BatchImportErrorDto {

    private Long id;
    private Integer rowNumber;
    private String errorMessage;
    private String rawRowData;

    public BatchImportErrorDto() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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
