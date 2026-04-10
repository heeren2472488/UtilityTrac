package com.utilitrack.project._4oim.US013_16.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OutageResponse {

    private Long id;

    private String region;

    private LocalDateTime outageTime;

    private String cause;

    private LocalDateTime loggedTime;

    private String status;

    private String loggedByOperatorId;

    private String notes;

    private Integer affectedCustomers;

    private String severityLevel;
}
