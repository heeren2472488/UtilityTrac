package com.utilitrack.project._8notifications.service.impl;

import com.utilitrack.project._8notifications.dto.NotificationDTO;
import com.utilitrack.project._8notifications.model.Notification;
import com.utilitrack.project._8notifications.repository.NotificationRepository;
import com.utilitrack.project._8notifications.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;

    // ── Helper: Entity → DTO ──────────────────────────────────────────────────

    private NotificationDTO toDTO(Notification n) {
        return NotificationDTO.builder()
                .notificationId(n.getNotificationId())
                .userId(n.getUserId())
                .message(n.getMessage())
                .category(n.getCategory())
                .status(n.getStatus())
                .createdDate(n.getCreatedDate())
                .build();
    }

    // ── Core CRUD ─────────────────────────────────────────────────────────────

    @Override
    public NotificationDTO createNotification(Long userId, String message,
                                               Notification.Category category) {
        Notification notification = Notification.builder()
                .userId(userId)
                .message(message)
                .category(category)
                .status(Notification.Status.UNREAD)
                .createdDate(LocalDateTime.now())
                .build();

        return toDTO(notificationRepository.save(notification));
    }

    @Override
    public List<NotificationDTO> getNotificationsByUser(Long userId) {
        return notificationRepository.findByUserId(userId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<NotificationDTO> getUnreadByUser(Long userId) {
        return notificationRepository
                .findByUserIdAndStatus(userId, Notification.Status.UNREAD)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public NotificationDTO markAsRead(Long notificationId) {
        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException(
                        "Notification not found with id: " + notificationId));
        n.setStatus(Notification.Status.READ);
        return toDTO(notificationRepository.save(n));
    }

    @Override
    public NotificationDTO markAsDismissed(Long notificationId) {
        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException(
                        "Notification not found with id: " + notificationId));
        n.setStatus(Notification.Status.DISMISSED);
        return toDTO(notificationRepository.save(n));
    }

    // ── US027: Outage Alert ───────────────────────────────────────────────────
    // Triggered when an outage is detected; notifies all Control Room Operators.
    // Acceptance criteria: trigger rules applied, status starts as UNREAD.
    @Override
    public void triggerOutageAlert(Long outageId, String description) {
        // Production: query UserRepository for users with Role = OPERATOR
        // Stub user IDs representing operators
        List<Long> operatorUserIds = List.of(101L, 102L, 103L);

        for (Long userId : operatorUserIds) {
            createNotification(
                    userId,
                    "OUTAGE ALERT [OutageID: " + outageId + "]: " + description
                            + " — Please take immediate action.",
                    Notification.Category.OUTAGE
            );
        }
    }

    // ── US028: Maintenance Alert ──────────────────────────────────────────────
    // Scheduled check: notifies Planners of work orders due soon or overdue.
    // Acceptance criteria: due soon, overdue — clear and accessible format.
    @Override
    public void triggerMaintenanceAlerts() {
        // Production: query WorkOrderRepository for Status=PLANNED
        //             where ScheduledStart <= now + 2 days (due soon)
        //             or ScheduledStart < now (overdue)
        // Stub user IDs representing planners
        List<Long> plannerUserIds = List.of(201L, 202L);

        for (Long userId : plannerUserIds) {
            createNotification(
                    userId,
                    "MAINTENANCE ALERT: You have work orders that are due soon or overdue. "
                            + "Please review and take action.",
                    Notification.Category.MAINTENANCE
            );
        }
    }

    // ── US029: Abnormal Consumption Alert ────────────────────────────────────
    // Scheduled check: notifies Billing team when meter reads exceed threshold.
    // Acceptance criteria: threshold rules applied, easily flaggable.
    @Override
    public void triggerConsumptionAlerts() {
        // Production: query MeterReadRepository for Quality=SUSPECT
        //             or Value > threshold defined in config
        // Stub user IDs representing billing team
        List<Long> billingUserIds = List.of(301L, 302L);

        for (Long userId : billingUserIds) {
            createNotification(
                    userId,
                    "CONSUMPTION ALERT: Abnormal consumption detected for one or more meters. "
                            + "Please review and flag the issue for follow-up.",
                    Notification.Category.METER
            );
        }
    }
}
