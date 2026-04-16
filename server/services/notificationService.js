const NotificationModel = require('../models/Notification');

const notifyActiveVolunteers = async ({ title, message, type }) => {
  if (!title || !message) {
    return 0;
  }

  return NotificationModel.createForActiveVolunteers({ title, message, type });
};

const notifyActiveAdmins = async ({ title, message, type }) => {
  if (!title || !message) {
    return 0;
  }

  return NotificationModel.createForActiveAdmins({ title, message, type });
};

const notifyUsers = async ({ title, message, type, userIds }) => {
  if (!title || !message) {
    return 0;
  }

  return NotificationModel.createForActiveUserIds({ title, message, type, userIds });
};

module.exports = {
  notifyActiveVolunteers,
  notifyActiveAdmins,
  notifyUsers,
};
