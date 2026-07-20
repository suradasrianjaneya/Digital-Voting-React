import prisma from '../config/db.js';

export const logEvent = async ({ userId, action, details, ipAddress }) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        details,
        ipAddress: ipAddress || null,
      },
    });
  } catch (error) {
    console.error('Failed to write audit log event to database:', error);
  }
};
