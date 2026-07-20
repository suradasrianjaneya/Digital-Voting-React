import prisma from '../config/db.js';

export const getAuditLogs = async (req, res, next) => {
  try {
    const logs = await prisma.auditLog.findMany({
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 200, // Safety limit
    });

    res.status(200).json({
      success: true,
      logs: logs.map((log) => ({
        id: log.id,
        action: log.action,
        details: log.details,
        ipAddress: log.ipAddress,
        createdAt: log.createdAt,
        user: log.user
          ? {
              fullName: log.user.fullName,
              email: log.user.email,
              role: log.user.role,
            }
          : null,
      })),
    });
  } catch (error) {
    next(error);
  }
};
