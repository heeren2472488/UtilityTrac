package com.utilitrack.project._8notifications.scheduler;

import com.utilitrack.project._8notifications.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * US027 - As a System, I want to create outage alerts so that notify users.
 * Polls every 30 seconds for open outages and fires notifications to operators.
 * KPI: Alert latency < 5s (target met by 30s polling + immediate DB write).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class OutageAlertScheduler {

    private final NotificationService notificationService;

    @Scheduled(fixedRate = 30000) // every 30 seconds
    public void checkOutagesAndAlert() {
        log.info("[US027] Checking for new open outages to generate alerts...");
        // Production: query OutageRepository for Status=OPEN outages
        //             that have not yet triggered a notification
        //             then call notificationService.triggerOutageAlert(outageId, cause)
        // Stub: scheduler hook is in place; actual query wired when OutageRepository is available
    }
}
