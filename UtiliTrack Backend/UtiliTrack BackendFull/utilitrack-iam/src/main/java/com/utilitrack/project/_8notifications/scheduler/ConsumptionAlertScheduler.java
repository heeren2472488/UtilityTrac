package com.utilitrack.project._8notifications.scheduler;

import com.utilitrack.project._8notifications.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * US029 - As a Billing, I want to view abnormal consumption alerts so that I can flag issues.
 * Runs every hour. Checks meter reads against threshold rules.
 * Acceptance criteria: threshold rules applied, easily identifiable and flaggable.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ConsumptionAlertScheduler {

    private final NotificationService notificationService;

    @Scheduled(fixedRate = 3600000) // every 1 hour
    public void checkAbnormalConsumptionAndAlert() {
        log.info("[US029] Checking for abnormal consumption against threshold rules...");
        notificationService.triggerConsumptionAlerts();
    }
}
