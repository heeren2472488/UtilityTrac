package com.utilitrack.project._8notifications.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notification")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long notificationId;

    private Long userId;

    @Column(length = 500)
    private String message;

    @Enumerated(EnumType.STRING)
    private Category category;

    @Enumerated(EnumType.STRING)
    private Status status;

    private LocalDateTime createdDate;

    public enum Category {
        OUTAGE, MAINTENANCE, METER, SAFETY
    }

    public enum Status {
        UNREAD, READ, DISMISSED
    }
}
