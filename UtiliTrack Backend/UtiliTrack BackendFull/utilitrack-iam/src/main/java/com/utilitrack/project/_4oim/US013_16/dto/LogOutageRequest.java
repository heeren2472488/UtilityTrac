package com.utilitrack.project._4oim.US013_16.dto;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LogOutageRequest {

    @NotBlank(message = "Region is required")
    @Size(min = 2, max = 100, message = "Region must be between 2 and 100 characters")
    private String region;

    @NotNull(message = "Outage time is required")
    private LocalDateTime outageTime;

    @NotBlank(message = "Cause is required")
    @Size(min = 5, max = 500, message = "Cause must be between 5 and 500 characters")
    private String cause;

    private String notes;

    private Integer affectedCustomers;

    private String severityLevel;
}
