package com.utilitrack.project._3mpwm.US009_maintenance.service;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class WorkOrderValidationResult {
    private boolean valid;
    private List<String> errors;
    private List<String> warnings;

    public static WorkOrderValidationResult success() {
        return WorkOrderValidationResult.builder()
            .valid(true)
            .errors(new ArrayList<>())
            .warnings(new ArrayList<>())
            .build();
    }

    public static WorkOrderValidationResult failure(String error) {
        return WorkOrderValidationResult.builder()
            .valid(false)
            .errors(List.of(error))
            .warnings(new ArrayList<>())
            .build();
    }

    public void addError(String error) {
        if (this.errors == null) {
            this.errors = new ArrayList<>();
        }
        this.errors.add(error);
        this.valid = false;
    }

    public void addWarning(String warning) {
        if (this.warnings == null) {
            this.warnings = new ArrayList<>();
        }
        this.warnings.add(warning);
    }
}
