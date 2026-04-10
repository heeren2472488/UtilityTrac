package com.utilitrack.project._1iam.US004_audit_logs.service;

import com.utilitrack.project._1iam.US004_audit_logs.dto.AuditLogResponse;
import com.utilitrack.project.entity.AuditLog;
import com.utilitrack.project._1iam.US004_audit_logs.repository.AuditLogRepository;
import com.utilitrack.project.common.PagedResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

/**
 * US004: Audit log retrieval with filters (TEAM-60)
 * Filters: actorEmail, action, date range
 * Admin-only enforced at controller level
 */
@Service @RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Transactional(readOnly = true)
    public PagedResponse<AuditLogResponse> getLogs(
            String actorEmail, String action,
            LocalDateTime from, LocalDateTime to, Pageable pageable) {
        return PagedResponse.from(
                auditLogRepository.findWithFilters(actorEmail, action, from, to, pageable),
                this::toResponse);
    }

    private AuditLogResponse toResponse(AuditLog log) {
        return AuditLogResponse.builder()
                .id(log.getId()).actorId(log.getActorId()).actorEmail(log.getActorEmail())
                .action(log.getAction()).resource(log.getResource())
                .detail(log.getDetail()).performedAt(log.getPerformedAt()).build();
    }
}
