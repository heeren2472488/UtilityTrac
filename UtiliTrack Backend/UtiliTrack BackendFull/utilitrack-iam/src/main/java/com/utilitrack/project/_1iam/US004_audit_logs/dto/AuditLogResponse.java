package com.utilitrack.project._1iam.US004_audit_logs.dto;
import lombok.*;
import java.time.LocalDateTime;
@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class AuditLogResponse {
    private Long id;
    private Long actorId;
    private String actorEmail;
    private String action;
    private String resource;
    private String detail;
    private LocalDateTime performedAt;
}
