package com.utilitrack.project._4oim.US013_16.dto;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RestorationProgressResponse {

    private Long outageId;

    private Long totalSteps;

    private Long completedSteps;

    private Integer progressPercentage;
}

