package com.utilitrack.project._8notifications.repository;

import com.utilitrack.project._8notifications.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUserId(Long userId);

    List<Notification> findByUserIdAndStatus(Long userId, Notification.Status status);

    List<Notification> findByCategory(Notification.Category category);
}
