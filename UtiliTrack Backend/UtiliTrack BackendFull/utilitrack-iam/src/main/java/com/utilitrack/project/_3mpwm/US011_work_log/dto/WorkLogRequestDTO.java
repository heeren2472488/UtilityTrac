package com.utilitrack.project._3mpwm.US011_work_log.dto;

import lombok.Data;

import java.time.LocalDate;



@Data


public class WorkLogRequestDTO {

    private String technicianId;
    private String completionStatus;
    private Double hoursWorked;
    private LocalDate loggedDate;
    private String notes;
    private String partsUsedJson;

    // getters & setters
}