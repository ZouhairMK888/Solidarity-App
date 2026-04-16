const NotificationModel = require('../models/Notification');

const publicVolunteerNotificationTypes = new Set([
  'campaign_created',
  'campaign_updated',
  'campaign_status',
  'mission_created',
  'mission_updated',
  'mission_status',
  'application_accepted',
]);

const getMyNotifications = async (req, res, next) => {
  try {
    const { limit } = req.query;
    const allNotifications = await NotificationModel.findByUserId(req.user.id, { limit });
    const notifications = req.user.role === 'volunteer'
      ? allNotifications.filter((notification) => publicVolunteerNotificationTypes.has(notification.type))
      : allNotifications;
    const unreadCount = notifications.filter((notification) => !notification.is_read).length;

    res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

const markNotificationAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await NotificationModel.findByIdForUser(id, req.user.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.',
      });
    }

    if (req.user.role === 'volunteer' && !publicVolunteerNotificationTypes.has(notification.type)) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.',
      });
    }

    const updatedNotification = notification.is_read
      ? notification
      : await NotificationModel.markAsRead(id, req.user.id);
    const visibleNotifications = await NotificationModel.findByUserId(req.user.id, { limit: 50 });
    const unreadCount = (req.user.role === 'volunteer'
      ? visibleNotifications.filter((item) => publicVolunteerNotificationTypes.has(item.type))
      : visibleNotifications
    ).filter((item) => !item.is_read).length;

    res.status(200).json({
      success: true,
      message: 'Notification marked as read.',
      data: {
        notification: updatedNotification,
        unreadCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

const markAllNotificationsAsRead = async (req, res, next) => {
  try {
    if (req.user.role === 'volunteer') {
      const notifications = await NotificationModel.findByUserId(req.user.id, { limit: 100 });
      const allowedNotifications = notifications.filter((notification) => publicVolunteerNotificationTypes.has(notification.type));
      await Promise.all(
        allowedNotifications
          .filter((notification) => !notification.is_read)
          .map((notification) => NotificationModel.markAsRead(notification.id, req.user.id))
      );
    } else {
      await NotificationModel.markAllAsRead(req.user.id);
    }

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read.',
      data: {
        unreadCount: 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};
