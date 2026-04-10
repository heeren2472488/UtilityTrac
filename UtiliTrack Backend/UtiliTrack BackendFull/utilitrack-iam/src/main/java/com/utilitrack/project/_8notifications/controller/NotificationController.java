package com.utilitrack.project._8notifications.controller;

import com.utilitrack.project._8notifications.dto.NotificationDTO;
import com.utilitrack.project._8notifications.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * US027 / US028 / US029
     * GET /api/v1/notifications/user/{userId}
     * Retrieve all notifications for a user (all categories).
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<NotificationDTO>> getByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(notificationService.getNotificationsByUser(userId));
    }

    /**
     * US027 / US028 / US029
     * GET /api/v1/notifications/user/{userId}/unread
     * Retrieve only UNREAD notifications for a user.
     */
    @GetMapping("/user/{userId}/unread")
    public ResponseEntity<List<NotificationDTO>> getUnreadByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(notificationService.getUnreadByUser(userId));
    }

    /**
     * US027 / US028 / US029
     * PATCH /api/v1/notifications/{notificationId}/read
     * Mark a notification as READ.
     */
    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<NotificationDTO> markAsRead(@PathVariable Long notificationId) {
        return ResponseEntity.ok(notificationService.markAsRead(notificationId));
    }

    /**
     * US027 / US028 / US029
     * PATCH /api/v1/notifications/{notificationId}/dismiss
     * Dismiss a notification.
     */
    @PatchMapping("/{notificationId}/dismiss")
    public ResponseEntity<NotificationDTO> markAsDismissed(@PathVariable Long notificationId) {
        return ResponseEntity.ok(notificationService.markAsDismissed(notificationId));
    }

    /**
     * US027
     * POST /api/v1/notifications/trigger/outage/{outageId}?description=...
     * Manually trigger outage alerts for all operators.
     * Also called internally by OutageAlertScheduler.
     */
    @PostMapping("/trigger/outage/{outageId}")
    public ResponseEntity<String> triggerOutageAlert(
            @PathVariable Long outageId,
            @RequestParam String description) {
        notificationService.triggerOutageAlert(outageId, description);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body("Outage alerts triggered for OutageID: " + outageId);
    }

    /**
     * US028
     * POST /api/v1/notifications/trigger/maintenance
     * Manually trigger maintenance due/overdue alerts for planners.
     */
    @PostMapping("/trigger/maintenance")
    public ResponseEntity<String> triggerMaintenanceAlerts() {
        notificationService.triggerMaintenanceAlerts();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body("Maintenance alerts triggered for all planners.");
    }

    /**
     * US029
     * POST /api/v1/notifications/trigger/consumption
     * Manually trigger abnormal consumption alerts for billing team.
     */
    @PostMapping("/trigger/consumption")
    public ResponseEntity<String> triggerConsumptionAlerts() {
        notificationService.triggerConsumptionAlerts();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body("Consumption alerts triggered for billing team.");
    }
}
