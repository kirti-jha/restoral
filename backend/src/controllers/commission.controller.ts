import { Prisma, Role } from '@prisma/client';
import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { canManageTarget, fetchHierarchyUsers, getDescendantIds } from '../services/userHierarchy.service';
import {
  buildEffectiveSlabs,
  getAssignableRateRoles,
  isCommissionType,
  isRateServiceType,
  rangesOverlap,
  validateDefaultRateFloor,
  validateUserOverrideFloor,
  toDecimalAmount,
} from '../services/commission.service';
import { createAdminNotification, notifyAdminsAndUser } from '../services/notification.service';

class InputValidationError extends Error {}

function getRangeKey(minAmount: Prisma.Decimal | string | number, maxAmount: Prisma.Decimal | string | number | null) {
  return `${toDecimalAmount(minAmount).toFixed(2)}|${maxAmount === null ? 'null' : toDecimalAmount(maxAmount).toFixed(2)}`;
}

function dedupeCommissionSlabs<T extends { id: string; serviceType: string; applyOnRole: Role; commissionType: string; commissionValue: Prisma.Decimal | string | number; minAmount: Prisma.Decimal | string | number; maxAmount: Prisma.Decimal | string | number | null; createdAt?: Date }>(
  rows: T[]
) {
  const seen = new Set<string>();

  return rows.filter((row) => {
    const key = [
      row.serviceType,
      row.applyOnRole,
      row.commissionType,
      toDecimalAmount(row.commissionValue).toFixed(2),
      getRangeKey(row.minAmount, row.maxAmount),
    ].join('|');

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function dedupeUserOverrides<T extends { id: string; serviceType: string; commissionType: string; commissionValue: Prisma.Decimal | string | number; minAmount: Prisma.Decimal | string | number; maxAmount: Prisma.Decimal | string | number | null }>(
  rows: T[]
) {
  const seen = new Set<string>();

  return rows.filter((row) => {
    const key = [
      row.serviceType,
      row.commissionType,
      toDecimalAmount(row.commissionValue).toFixed(2),
      getRangeKey(row.minAmount, row.maxAmount),
    ].join('|');

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function sendBadRequest(res: Response, message: string) {
  res.status(400).json({ success: false, message });
}

function parseRequiredDecimal(value: unknown, fieldName: string) {
  if (value === undefined || value === null || value === '') {
    throw new InputValidationError(`${fieldName} is required`);
  }

  let decimal: Prisma.Decimal;
  try {
    decimal = toDecimalAmount(value as Prisma.Decimal | string | number);
  } catch {
    throw new InputValidationError(`${fieldName} must be a valid amount`);
  }

  if (decimal.isNegative()) {
    throw new InputValidationError(`${fieldName} cannot be negative`);
  }

  return decimal;
}

function parseOptionalDecimal(value: unknown, fieldName: string) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  let decimal: Prisma.Decimal;
  try {
    decimal = toDecimalAmount(value as Prisma.Decimal | string | number);
  } catch {
    throw new InputValidationError(`${fieldName} must be a valid amount`);
  }

  if (decimal.isNegative()) {
    throw new InputValidationError(`${fieldName} cannot be negative`);
  }

  return decimal;
}

function parseIsActive(value: unknown) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    if (value === 'true') return true;
    if (value === 'false') return false;
  }

  return true;
}

async function findOverlappingDefaultSlab(
  setById: string,
  serviceType: string,
  applyOnRole: Role,
  minAmount: Prisma.Decimal,
  maxAmount: Prisma.Decimal | null,
  excludeId?: string
) {
  const rows = await prisma.commissionSlab.findMany({
    where: {
      setById,
      serviceType,
      applyOnRole,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: {
      id: true,
      minAmount: true,
      maxAmount: true,
    },
  });

  return rows.find((row) => rangesOverlap(row.minAmount, row.maxAmount, minAmount, maxAmount));
}

async function findOverlappingOverride(
  setById: string,
  targetUserId: string,
  serviceType: string,
  minAmount: Prisma.Decimal,
  maxAmount: Prisma.Decimal | null,
  excludeId?: string
) {
  const rows = await prisma.userCommissionSetup.findMany({
    where: {
      setById,
      targetUserId,
      serviceType,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: {
      id: true,
      minAmount: true,
      maxAmount: true,
    },
  });

  return rows.find((row) => rangesOverlap(row.minAmount, row.maxAmount, minAmount, maxAmount));
}

export const getSlabs = async (req: AuthRequest, res: Response) => {
  try {
    const actorId = req.user!.id;
    const actorRole = req.user!.role;

    const mySlabs = await prisma.commissionSlab.findMany({
      where: {
        setById: actorId,
        serviceType: { in: ['PAYOUT', 'FUND_REQUEST'] },
      },
      orderBy: [{ serviceType: 'asc' }, { applyOnRole: 'asc' }, { minAmount: 'asc' }, { createdAt: 'asc' }],
    });

    const actor = await prisma.user.findUnique({
      where: { id: actorId },
      select: { parentId: true },
    });

    let inheritedSlabs: any[] = [];
    if (actorRole !== 'ADMIN') {
      const allowedRoles = getAssignableRateRoles(actorRole);
      
      if (actor?.parentId) {
        inheritedSlabs = await prisma.commissionSlab.findMany({
          where: {
            setById: actor.parentId,
            serviceType: { in: ['PAYOUT', 'FUND_REQUEST'] },
            isActive: true,
            applyOnRole: { in: allowedRoles },
          },
          include: {
            setBy: {
              select: {
                id: true,
                email: true,
                role: true,
                profile: { select: { ownerName: true, shopName: true } },
              },
            },
          },
          orderBy: [{ serviceType: 'asc' }, { applyOnRole: 'asc' }, { minAmount: 'asc' }, { createdAt: 'asc' }],
        });
      }
    }

    res.json({
      success: true,
      slabs: dedupeCommissionSlabs(mySlabs),
      inheritedSlabs: dedupeCommissionSlabs(inheritedSlabs),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const upsertSlab = async (req: AuthRequest, res: Response) => {
  const { id, serviceType, applyOnRole, commissionType, commissionValue, minAmount, maxAmount } = req.body;

  try {
    if (!isRateServiceType(serviceType)) {
      sendBadRequest(res, 'Unsupported service type');
      return;
    }

    const allowedRoles = getAssignableRateRoles(req.user!.role);
    if (!allowedRoles.includes(applyOnRole as Role)) {
      sendBadRequest(res, 'You cannot set default rates for this role');
      return;
    }

    if (!isCommissionType(commissionType)) {
      sendBadRequest(res, 'Unsupported commission type');
      return;
    }

    const normalizedMinAmount = parseRequiredDecimal(minAmount, 'minAmount');
    const normalizedMaxAmount = parseOptionalDecimal(maxAmount, 'maxAmount');
    const normalizedCommissionValue = parseRequiredDecimal(commissionValue, 'commissionValue');
    const isActive = parseIsActive(req.body.isActive);

    if (normalizedMaxAmount && normalizedMaxAmount.lessThan(normalizedMinAmount)) {
      sendBadRequest(res, 'maxAmount must be greater than or equal to minAmount');
      return;
    }

    const inheritedFloorError = await validateDefaultRateFloor(
      req.user!.id,
      applyOnRole as Role,
      serviceType,
      normalizedCommissionValue,
      normalizedMinAmount,
      normalizedMaxAmount,
      id
    );

    if (inheritedFloorError) {
      sendBadRequest(res, inheritedFloorError);
      return;
    }

    if (id) {
      const existingRow = await prisma.commissionSlab.findFirst({
        where: { id, setById: req.user!.id },
        select: { id: true },
      });

      if (!existingRow) {
        // If not found as owner, but Admin, allow it? No, user said only Admin can delete, but anyone can edit if it flows?
        // Actually the user said "overall charge kisi perticular user pe specific ek hi hoga... chahe wo admin set kre ya user k upline member"
        // This was for OVERRIDES. For Default Slabs, usually each manager has their own slabs.
        // But for Overrides, they share.
        res.status(404).json({ success: false, message: 'Default rate not found' });
        return;
      }
    }

    const overlappingRow = await findOverlappingDefaultSlab(
      req.user!.id,
      serviceType,
      applyOnRole as Role,
      normalizedMinAmount,
      normalizedMaxAmount,
      id
    );

    if (overlappingRow) {
      sendBadRequest(res, 'This amount range overlaps with an existing default rate');
      return;
    }

    const slab = id
      ? await prisma.commissionSlab.update({
          where: { id },
          data: {
            serviceType,
            applyOnRole: applyOnRole as Role,
            commissionType,
            commissionValue: normalizedCommissionValue,
            minAmount: normalizedMinAmount,
            maxAmount: normalizedMaxAmount,
            isActive,
          },
        })
      : await prisma.commissionSlab.create({
          data: {
            setById: req.user!.id,
            serviceType,
            applyOnRole: applyOnRole as Role,
            commissionType,
            commissionValue: normalizedCommissionValue,
            minAmount: normalizedMinAmount,
            maxAmount: normalizedMaxAmount,
            isActive,
          },
        });

    await createAdminNotification(
      id ? 'Default Charge Updated' : 'Default Charge Created',
      `${req.user!.role} ${id ? 'updated' : 'created'} a ${serviceType} default charge for ${applyOnRole}.`,
      'INFO'
    );

    res.json({ success: true, slab });
  } catch (error) {
    if (error instanceof InputValidationError) {
      sendBadRequest(res, error.message);
      return;
    }

    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deleteSlab = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Only administrators can delete slabs' });
      return;
    }

    const deleted = await prisma.commissionSlab.deleteMany({
      where: {
        id: req.params.id as string,
        // Admins can delete any slab? User said "charges delete bs admin kr skta h"
        // Usually means Admin can delete anyone's slab, or managers can't delete their own.
        // If I'm Admin, I can delete any slab.
      },
    });

    if (deleted.count === 0) {
      res.status(404).json({ success: false, message: 'Default rate not found' });
      return;
    }

    await createAdminNotification(
      'Default Charge Deleted',
      `${req.user!.role} deleted a default charge slab.`,
      'WARNING'
    );

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getUserOverrides = async (req: AuthRequest, res: Response) => {
  try {
    const actorId = req.user!.id;
    const actorRole = req.user!.role;

    const hierarchyUsers = await fetchHierarchyUsers();
    const targetIds = getDescendantIds(actorId, hierarchyUsers);

    // Fetch overrides for anyone in hierarchy, regardless of who set it
    const overrides = await prisma.userCommissionSetup.findMany({
      where: {
        targetUserId: { in: targetIds },
        serviceType: { in: ['PAYOUT', 'FUND_REQUEST'] },
      },
      include: {
        targetUser: {
          select: {
            id: true,
            email: true,
            role: true,
            profile: { select: { ownerName: true, shopName: true } },
          },
        },
        setBy: {
          select: {
            id: true,
            email: true,
            role: true,
            profile: { select: { ownerName: true, shopName: true } },
          },
        },
      },
      orderBy: [{ targetUserId: 'asc' }, { serviceType: 'asc' }, { minAmount: 'asc' }, { createdAt: 'asc' }],
    });

    res.json({ success: true, overrides: dedupeUserOverrides(overrides) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const upsertUserOverride = async (req: AuthRequest, res: Response) => {
  const { id, targetUserId, serviceType, commissionType, commissionValue, minAmount, maxAmount } = req.body;

  try {
    if (!targetUserId) {
      sendBadRequest(res, 'targetUserId is required');
      return;
    }

    if (!isRateServiceType(serviceType)) {
      sendBadRequest(res, 'Unsupported service type');
      return;
    }

    if (!isCommissionType(commissionType)) {
      sendBadRequest(res, 'Unsupported commission type');
      return;
    }

    const hierarchyUsers = await fetchHierarchyUsers();
    const targetUser = hierarchyUsers.find((user) => user.id === targetUserId && user.isActive);

    if (!targetUser || !canManageTarget(req.user!, targetUserId, hierarchyUsers)) {
      sendBadRequest(res, 'You can only override rates for active users in your managed hierarchy');
      return;
    }

    const normalizedMinAmount = parseRequiredDecimal(minAmount, 'minAmount');
    const normalizedMaxAmount = parseOptionalDecimal(maxAmount, 'maxAmount');
    const normalizedCommissionValue = parseRequiredDecimal(commissionValue, 'commissionValue');
    const isActive = parseIsActive(req.body.isActive);

    if (normalizedMaxAmount && normalizedMaxAmount.lessThan(normalizedMinAmount)) {
      sendBadRequest(res, 'maxAmount must be greater than or equal to minAmount');
      return;
    }

    const inheritedFloorError = await validateUserOverrideFloor(
      targetUserId,
      serviceType,
      normalizedCommissionValue,
      normalizedMinAmount,
      normalizedMaxAmount,
      id
    );

    if (inheritedFloorError) {
      sendBadRequest(res, inheritedFloorError);
      return;
    }

    // Check for existing override on same (user, service, range) regardless of who set it
    const existingOverride = await prisma.userCommissionSetup.findFirst({
      where: {
        targetUserId,
        serviceType,
        minAmount: normalizedMinAmount,
        maxAmount: normalizedMaxAmount,
      }
    });

    const override = existingOverride
      ? await prisma.userCommissionSetup.update({
          where: { id: existingOverride.id },
          data: {
            commissionType,
            commissionValue: normalizedCommissionValue,
            isActive,
            setById: req.user!.id, // Update who last set it
          },
          include: {
            targetUser: { select: { id: true, email: true, role: true, profile: { select: { ownerName: true, shopName: true } } } },
            setBy: { select: { id: true, email: true, role: true, profile: { select: { ownerName: true, shopName: true } } } },
          },
        })
      : await prisma.userCommissionSetup.create({
          data: {
            setById: req.user!.id,
            targetUserId,
            serviceType,
            commissionType,
            commissionValue: normalizedCommissionValue,
            minAmount: normalizedMinAmount,
            maxAmount: normalizedMaxAmount,
            isActive,
          },
          include: {
            targetUser: { select: { id: true, email: true, role: true, profile: { select: { ownerName: true, shopName: true } } } },
            setBy: { select: { id: true, email: true, role: true, profile: { select: { ownerName: true, shopName: true } } } },
          },
        });

    await notifyAdminsAndUser(
      targetUserId,
      existingOverride ? 'Special Charge Updated' : 'Special Charge Applied',
      `${req.user!.role} ${existingOverride ? 'updated' : 'set'} a ${serviceType} special charge for your account.`,
      'INFO'
    );

    res.json({ success: true, override });
  } catch (error) {
    if (error instanceof InputValidationError) {
      sendBadRequest(res, error.message);
      return;
    }

    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deleteUserOverride = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Only administrators can delete overrides' });
      return;
    }

    const existingOverride = await prisma.userCommissionSetup.findFirst({
      where: { id: req.params.id as string },
      select: { targetUserId: true, serviceType: true },
    });

    if (!existingOverride) {
      res.status(404).json({ success: false, message: 'User override not found' });
      return;
    }

    await prisma.userCommissionSetup.delete({
      where: { id: req.params.id as string },
    });

    await notifyAdminsAndUser(
      existingOverride.targetUserId,
      'Special Charge Removed',
      `${req.user!.role} removed a ${existingOverride.serviceType} special charge from your account.`,
      'WARNING'
    );

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getOverrideTargets = async (req: AuthRequest, res: Response) => {
  try {
    const hierarchyUsers = await fetchHierarchyUsers();
    const targetIds = getDescendantIds(req.user!.id, hierarchyUsers);

    const targets = await prisma.user.findMany({
      where: {
        id: { in: targetIds },
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        role: true,
        profile: {
          select: {
            ownerName: true,
            shopName: true,
          },
        },
      },
      orderBy: [{ role: 'asc' }, { createdAt: 'desc' }],
    });

    res.json({ success: true, targets });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getEffectiveCommissionSlabs = async (req: AuthRequest, res: Response) => {
  try {
    const slabs = await buildEffectiveSlabs(req.user!.id);
    res.json({ success: true, slabs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
