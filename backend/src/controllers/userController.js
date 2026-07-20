import bcrypt from 'bcryptjs';
import prisma from '../config/db.js';
import { logEvent } from '../services/auditService.js';

const getIpAddress = (req) => {
  return req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
};

export const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isVerified: true,
        isApproved: true,
        createdAt: true,
      },
    });

    const votes = await prisma.vote.findMany({
      where: { userId },
      include: {
        election: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
            endDate: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const uniqueHistoryMap = new Map();
    votes.forEach((v) => {
      if (!uniqueHistoryMap.has(v.electionId)) {
        uniqueHistoryMap.set(v.electionId, {
          electionId: v.electionId,
          electionName: v.election.name,
          electionType: v.election.type,
          status: v.election.status,
          votedAt: v.createdAt,
        });
      }
    });

    res.status(200).json({
      success: true,
      profile: user,
      votingHistory: Array.from(uniqueHistoryMap.values()),
    });
  } catch (error) {
    next(error);
  }
};

export const updatePassword = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    const ipAddress = getIpAddress(req);

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password incorrect' });
    }

    const hashedNew = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNew },
    });

    await logEvent({
      userId,
      action: 'PASSWORD_UPDATE',
      details: 'User updated password from profile settings',
      ipAddress,
    });

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isVerified: true,
        isApproved: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ success: true, users });
  } catch (error) {
    next(error);
  }
};

export const toggleUserApproval = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isApproved } = req.body;
    const ipAddress = getIpAddress(req);

    if (id === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot toggle approval status of your own account' });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isApproved },
    });

    await logEvent({
      userId: req.user.id,
      action: isApproved ? 'USER_APPROVE' : 'USER_SUSPEND',
      details: `${isApproved ? 'Approved' : 'Suspended'} user "${user.fullName}" (${user.email})`,
      ipAddress,
    });

    res.status(200).json({
      success: true,
      message: `User account is now ${isApproved ? 'approved' : 'suspended'}.`,
      user: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const changeUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const ipAddress = getIpAddress(req);

    if (id === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot demote yourself' });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
    });

    await logEvent({
      userId: req.user.id,
      action: 'USER_ROLE_CHANGE',
      details: `Changed role of user "${user.fullName}" (${user.email}) to ${role}`,
      ipAddress,
    });

    res.status(200).json({
      success: true,
      message: `User role updated to ${role}`,
      user: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ipAddress = getIpAddress(req);

    if (id === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own active admin session' });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await prisma.user.delete({ where: { id } });

    await logEvent({
      userId: req.user.id,
      action: 'USER_DELETE',
      details: `Deleted user "${user.fullName}" (${user.email})`,
      ipAddress,
    });

    res.status(200).json({ success: true, message: 'User successfully deleted' });
  } catch (error) {
    next(error);
  }
};
