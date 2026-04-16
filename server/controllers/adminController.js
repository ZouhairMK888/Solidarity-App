const UserModel = require('../models/User');
const CampaignModel = require('../models/Campaign');
const VolunteerApplicationModel = require('../models/VolunteerApplication');
const { notifyActiveAdmins } = require('../services/notificationService');

const allowedRoles = ['organizer', 'volunteer'];
const editableRoles = ['admin', 'organizer', 'volunteer'];

const notifyAdminsSafely = async (payload) => {
  try {
    await notifyActiveAdmins(payload);
  } catch (error) {
    console.error('Failed to send admin notifications:', error.message);
  }
};

const getOverview = async (req, res, next) => {
  try {
    const [userStats, campaignStats, applicationStats, users, campaigns] = await Promise.all([
      UserModel.getStats(),
      CampaignModel.getStats(),
      VolunteerApplicationModel.getStats(),
      UserModel.findAll(),
      CampaignModel.findManageable({ user: req.user }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          users: userStats,
          campaigns: campaignStats,
          applications: applicationStats,
        },
        recentUsers: users.slice(0, 5),
        recentCampaigns: campaigns.slice(0, 5),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const { role, search } = req.query;
    const users = await UserModel.findAll({ role, search });

    res.status(200).json({
      success: true,
      data: { users },
    });
  } catch (error) {
    next(error);
  }
};

const createOrganizer = async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword, phone } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password and confirm password are required.',
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long.',
      });
    }

    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    const userId = await UserModel.createByAdmin({
      name,
      email,
      password,
      phone,
      role: 'organizer',
    });

    const organizer = await UserModel.findById(userId);

    await notifyAdminsSafely({
      title: 'New organizer added',
      message: `${req.user.name} added ${organizer.name} as a new organizer.`,
      type: 'organizer_created',
    });

    res.status(201).json({
      success: true,
      message: 'Organizer account created successfully.',
      data: { user: organizer },
    });
  } catch (error) {
    next(error);
  }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'is_active must be a boolean value.',
      });
    }

    if (parseInt(id, 10) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own admin account.',
      });
    }

    const updatedUser = await UserModel.updateStatus(id, is_active);
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: `User ${is_active ? 'activated' : 'deactivated'} successfully.`,
      data: { user: updatedUser },
    });
  } catch (error) {
    next(error);
  }
};

const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Only organizer and volunteer roles can be assigned here.',
      });
    }

    if (parseInt(id, 10) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot change your own admin role here.',
      });
    }

    const updatedUser = await UserModel.updateRole(id, role);
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'User role updated successfully.',
      data: { user: updatedUser },
    });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, phone, role, is_active } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({
        success: false,
        message: 'Name, email and role are required.',
      });
    }

    if (!editableRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role provided.',
      });
    }

    if (parseInt(id, 10) === req.user.id && role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'You cannot remove your own admin permissions.',
      });
    }

    const existingUser = await UserModel.findById(id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const duplicateUser = await UserModel.findByEmail(email);
    if (duplicateUser && duplicateUser.id !== parseInt(id, 10)) {
      return res.status(409).json({
        success: false,
        message: 'Another account already uses this email.',
      });
    }

    const updatedUser = await UserModel.update(id, {
      name,
      email,
      phone,
      role,
      is_active: typeof is_active === 'boolean' ? is_active : existingUser.is_active,
    });

    res.status(200).json({
      success: true,
      message: 'User updated successfully.',
      data: { user: updatedUser },
    });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (parseInt(id, 10) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own admin account.',
      });
    }

    const deleted = await UserModel.delete(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOverview,
  getUsers,
  createOrganizer,
  updateUserStatus,
  updateUserRole,
  updateUser,
  deleteUser,
};
