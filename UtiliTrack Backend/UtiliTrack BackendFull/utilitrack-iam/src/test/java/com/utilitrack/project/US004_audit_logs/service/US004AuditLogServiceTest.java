package com.utilitrack.project.US004_audit_logs.service;
import com.utilitrack.project._1iam.US004_audit_logs.dto.AuditLogResponse;
import com.utilitrack.project.entity.AuditLog;
import com.utilitrack.project._1iam.US004_audit_logs.repository.AuditLogRepository;
import com.utilitrack.project.common.PagedResponse;
import com.utilitrack.project._1iam.US004_audit_logs.service.AuditLogService;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;
import java.time.LocalDateTime;
import java.util.List;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

/** TEAM-62: Audit log unit tests */
@ExtendWith(MockitoExtension.class)
class US004AuditLogServiceTest {
    @Mock AuditLogRepository auditLogRepository;
    @InjectMocks
    AuditLogService service;

    @Test @DisplayName("TEAM-62: Should return paged audit logs with filters")
    void getLogs_withFilters_returnsPaged() {
        AuditLog log = AuditLog.builder().id(1L).actorId(1L).actorEmail("admin@x.com")
                .action("LOGIN").resource("User#admin@x.com").performedAt(LocalDateTime.now()).build();
        Page<AuditLog> page = new PageImpl<>(List.of(log), PageRequest.of(0,20), 1);
        when(auditLogRepository.findWithFilters(any(), any(), any(), any(), any())).thenReturn(page);
        PagedResponse<AuditLogResponse> result = service.getLogs("admin@x.com","LOGIN",null,null,PageRequest.of(0,20));
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getAction()).isEqualTo("LOGIN");
        assertThat(result.getTotalElements()).isEqualTo(1);
    }

    @Test @DisplayName("TEAM-62: Should return empty result when no logs match")
    void getLogs_noMatch_returnsEmpty() {
        Page<AuditLog> empty = new PageImpl<>(List.of(), PageRequest.of(0,20), 0);
        when(auditLogRepository.findWithFilters(any(),any(),any(),any(),any())).thenReturn(empty);
        PagedResponse<AuditLogResponse> result = service.getLogs(null,null,null,null,PageRequest.of(0,20));
        assertThat(result.getContent()).isEmpty();
        assertThat(result.getTotalElements()).isZero();
    }
}
