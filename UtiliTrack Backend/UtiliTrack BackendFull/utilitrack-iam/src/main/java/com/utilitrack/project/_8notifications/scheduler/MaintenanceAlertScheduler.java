package com.utilitrack.project._8notifications.scheduler;

import com.utilitrack.project._8notifications.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * US028 - As a Planner, I want to view maintenance alerts so that I can take action.
 * Runs daily at 8 AM. Checks for work orders that are due soon or overdue.
 * Acceptance criteria: due soon, overdue alerts delivered to planners.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class MaintenanceAlertScheduler {

    private final NotificationService notificationService;

    @Scheduled(cron = "0 0 8 * * *") // Every day at 08:00
    public void checkMaintenanceDueAndAlert() {
        log.info("[US028] Checking for maintenance work orders due soon or overdue...");
        notificationService.triggerMaintenanceAlerts();
    }
}
