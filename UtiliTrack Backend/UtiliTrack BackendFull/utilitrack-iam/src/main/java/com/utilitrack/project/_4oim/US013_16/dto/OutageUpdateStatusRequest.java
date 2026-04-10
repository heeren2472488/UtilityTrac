package com.utilitrack.project._4oim.US013_16.dto;


import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OutageUpdateStatusRequest {

    @NotBlank(message = "Status is required")
    private String status;

    private String notes;
}
