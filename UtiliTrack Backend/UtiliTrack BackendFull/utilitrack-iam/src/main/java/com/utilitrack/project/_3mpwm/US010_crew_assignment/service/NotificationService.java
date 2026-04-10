package com.utilitrack.project._3mpwm.US010_crew_assignment.service;

import com.utilitrack.project._3mpwm.US009_maintenance.entity.WorkOrder;
import com.utilitrack.project.entity.Crew;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * US010 - AC3: Notifications should be sent to crew members upon assignment.
 * This service simulates sending notifications (email/SMS) to crew members.
 */
@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    public void notifyCrew(Crew crew, WorkOrder workOrder) {

        String message = String.format(
                "[NOTIFICATION] Crew '%s' (ID: %d) assigned to WorkOrder ID: %d | Asset ID: %d | Priority: %s | Scheduled Start: %s",
                crew.getName(),
                crew.getId(),
                workOrder.getId(),                     // ✅ FIXED
                workOrder.getAssetId(),                // ✅ FIXED
                workOrder.getPriority(),
                workOrder.getScheduledStartDate()      // ✅ FIXED
        );

        log.info("📧 {}", message);
        System.out.println("📧 NOTIFICATION SENT: " + message);

        // Future integrations:
        // emailService.send(...)
        // smsService.send(...)
    }
}