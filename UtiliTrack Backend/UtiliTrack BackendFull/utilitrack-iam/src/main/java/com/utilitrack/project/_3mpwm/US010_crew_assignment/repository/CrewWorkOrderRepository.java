package com.utilitrack.project._3mpwm.US010_crew_assignment.repository;



import com.utilitrack.project._3mpwm.US009_maintenance.entity.WorkOrder;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CrewWorkOrderRepository extends JpaRepository<WorkOrder, Long> {
}

