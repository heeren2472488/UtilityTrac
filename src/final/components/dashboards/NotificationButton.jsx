import React from 'react';
import { FaBell } from 'react-icons/fa';

export default function NotificationButton() {
  const handleOpenNotifications = () => {
    window.alert('Notifications center will be available here.');
  };

  return (
    <button className="dashboard-notify-btn" type="button" onClick={handleOpenNotifications}>
      <FaBell style={{ marginRight: 8 }} /> Notifications
    </button>
  );
}
