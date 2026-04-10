package com.utilitrack.project._2arnt.US006_7_Topology.model;


import jakarta.persistence.*;
import java.time.LocalDateTime;


@Entity(name = "TopologyOutage")
@Table(name = "outages_us006_topology")
public class Outage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long outageId;

    @Column(nullable = false)
    private Long regionId;

    @Column(nullable = false)
    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private Integer affectedCustomers;

    @Enumerated(EnumType.STRING)
    private OutageCause cause;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OutageStatus status;

    public enum OutageCause {
        WEATHER, EQUIPMENT_FAILURE, PLANNED, OTHER
    }

    public enum OutageStatus {
        OPEN, RESTORING, RESTORED, CLOSED
    }

    // Getters and Setters
    public Long getOutageId() { return outageId; }
    public void setOutageId(Long outageId) { this.outageId = outageId; }

    public Long getRegionId() { return regionId; }
    public void setRegionId(Long regionId) { this.regionId = regionId; }

    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }

    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }

    public Integer getAffectedCustomers() { return affectedCustomers; }
    public void setAffectedCustomers(Integer affectedCustomers) { this.affectedCustomers = affectedCustomers; }

    public OutageCause getCause() { return cause; }
    public void setCause(OutageCause cause) { this.cause = cause; }

    public OutageStatus getStatus() { return status; }
    public void setStatus(OutageStatus status) { this.status = status; }
}

