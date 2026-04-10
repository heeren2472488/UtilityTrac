package com.utilitrack.project._8notifications.service;

import com.utilitrack.project._8notifications.dto.NotificationDTO;
import com.utilitrack.project._8notifications.model.Notification;

import java.util.List;

public interface NotificationService {

    // Core CRUD
    NotificationDTO createNotification(Long userId, String message, Notification.Category category);

    List<NotificationDTO> getNotificationsByUser(Long userId);

    List<NotificationDTO> getUnreadByUser(Long userId);

    NotificationDTO markAsRead(Long notificationId);

    NotificationDTO markAsDismissed(Long notificationId);

    // US027 - System creates outage alerts to notify users
    void triggerOutageAlert(Long outageId, String description);

    // US028 - Planner views maintenance alerts (due soon / overdue)
    void triggerMaintenanceAlerts();

    // US029 - Billing views abnormal consumption alerts (threshold rules)
    void triggerConsumptionAlerts();
}
