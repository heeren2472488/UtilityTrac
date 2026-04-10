package com.utilitrack.project._1iam.US001_user_role_management.service;

import com.utilitrack.project.entity.AuditLog;
import com.utilitrack.project._1iam.US004_audit_logs.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Shared audit service — used by all user stories to log actions
 * US004 reads these logs via GET /api/iam/audit-logs
 */
@Service @RequiredArgsConstructor @Slf4j
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public void log(Long actorId, String actorEmail, String action, String resource, String detail) {
        AuditLog entry = AuditLog.builder()
                .actorId(actorId).actorEmail(actorEmail)
                .action(action).resource(resource).detail(detail).build();
        auditLogRepository.save(entry);
        log.info("[AUDIT] actor={} action={} resource={}", actorEmail, action, resource);
    }

    public void log(Long actorId, String actorEmail, String action, String resource) {
        log(actorId, actorEmail, action, resource, null);
    }
}
