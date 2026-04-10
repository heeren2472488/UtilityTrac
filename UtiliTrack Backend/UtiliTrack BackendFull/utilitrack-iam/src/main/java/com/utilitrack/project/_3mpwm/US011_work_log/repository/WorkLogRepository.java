package com.utilitrack.project._3mpwm.US011_work_log.repository;

import com.utilitrack.project.entity.WorkLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface WorkLogRepository extends JpaRepository<WorkLog, Long> {
    List<WorkLog> findByWorkOrder_Id(Long workOrderId);

}
