package com.utilitrack.project._8notifications.dto;
import com.utilitrack.project._8notifications.model.Notification;
import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationDTO {

    private Long notificationId;
    private Long userId;
    private String message;
    private Notification.Category category;
    private Notification.Status status;
    private LocalDateTime createdDate;
}
