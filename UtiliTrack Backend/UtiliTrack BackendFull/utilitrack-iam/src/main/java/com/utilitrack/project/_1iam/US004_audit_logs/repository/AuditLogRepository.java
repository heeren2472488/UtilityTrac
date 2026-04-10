package com.utilitrack.project._1iam.US004_audit_logs.repository;
import com.utilitrack.project.entity.AuditLog;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    // US004: filter by user, action, date (TEAM-60)
    @Query("SELECT a FROM AuditLog a WHERE " +
           "(:actorEmail IS NULL OR LOWER(a.actorEmail) = LOWER(:actorEmail)) AND " +
           "(:action IS NULL OR LOWER(a.action) = LOWER(:action)) AND " +
           "(:from IS NULL OR a.performedAt >= :from) AND " +
           "(:to IS NULL OR a.performedAt <= :to) " +
           "ORDER BY a.performedAt DESC")
    Page<AuditLog> findWithFilters(String actorEmail, String action,
                                   LocalDateTime from, LocalDateTime to, Pageable pageable);
}
