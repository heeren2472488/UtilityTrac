package com.utilitrack.project._2arnt.US008_asset.service;

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
public class ValidationResult {
    private boolean valid;
    private List<String> errors;
    private List<String> warnings;

    public static ValidationResult success() {
        return ValidationResult.builder()
            .valid(true)
            .errors(new ArrayList<>())
            .warnings(new ArrayList<>())
            .build();
    }

    public static ValidationResult failure(String error) {
        return ValidationResult.builder()
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
