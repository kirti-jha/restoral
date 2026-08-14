import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { canManageTarget, fetchHierarchyUsers } from '../services/userHierarchy.service';

const publicUserBaseSelect = {
  id: true,
  email: true,
  role: true,
  isActive: true,
  profile: true,
  wallet: true,
} as const;

const publicUserSelect = {
  ...publicUserBaseSelect,
  transactionPinHash: true,
} as const;

const authUserSelect = {
  ...publicUserSelect,
  passwordHash: true,
} as const;

const authUserBaseSelect = {
  ...publicUserBaseSelect,
  passwordHash: true,
} as const;

function isMissingTransactionPinColumnError(error: any) {
  return error?.code === 'P2022' && String(error?.meta?.column || error?.message || '').includes('transactionPinHash');
}

async function withTransactionPinFallback<T>(query: () => Promise<T>, fallbackQuery: () => Promise<T>) {
  try {
    return await query();
  } catch (error) {
    if (isMissingTransactionPinColumnError(error)) {
      console.warn('transactionPinHash column is missing; continuing auth response without transaction PIN state');
      return fallbackQuery();
    }

    throw error;
  }
}

function buildPublicUserPayload(user: any) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    profile: user.profile,
    wallet: user.wallet,
    transactionPinSet: Boolean(user.transactionPinHash),
  };
}

function getJwtSecret(res: Response) {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    console.error('JWT_SECRET is not configured');
    res.status(500).json({ success: false, message: 'Server auth configuration is missing' });
    return null;
  }

  return jwtSecret;
}

function ensureDatabaseConfigured(res: Response) {
  if (process.env.DATABASE_URL) return true;

  console.error('DATABASE_URL is not configured');
  res.status(500).json({ success: false, message: 'Server database configuration is missing' });
  return false;
}

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  try {
    if (!ensureDatabaseConfigured(res)) return;

    const user = await withTransactionPinFallback(
      () => prisma.user.findFirst({
        where: {
          email: {
            equals: normalizedEmail,
            mode: 'insensitive',
          },
        },
        select: authUserSelect,
      }),
      () => prisma.user.findFirst({
        where: {
          email: {
            equals: normalizedEmail,
            mode: 'insensitive',
          },
        },
        select: authUserBaseSelect,
      }),
    );
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }
    if (!user.isActive) {
      res.status(403).json({ success: false, message: 'Account is deactivated' });
      return;
    }
    const jwtSecret = getJwtSecret(res);
    if (!jwtSecret) return;

    const token = jwt.sign(
      { id: user.id, role: user.role },
      jwtSecret,
      { expiresIn: '7d' }
    );
    res.json({
      success: true,
      token,
      user: buildPublicUserPayload(user),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getMe = async (req: any, res: Response) => {
  try {
    const user = await withTransactionPinFallback(
      () => prisma.user.findUnique({
        where: { id: req.user.id },
        select: publicUserSelect,
      }),
      () => prisma.user.findUnique({
        where: { id: req.user.id },
        select: publicUserBaseSelect,
      }),
    );
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    res.json({ success: true, user: buildPublicUserPayload(user) });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const changePassword = async (req: any, res: Response) => {
  const { oldPassword, newPassword } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const valid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!valid) {
      res.status(400).json({ success: false, message: 'Current password is incorrect' });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const loginAs = async (req: any, res: Response) => {
  const { userId } = req.body;

  try {
    const hierarchyUsers = await fetchHierarchyUsers();
    if (!canManageTarget(req.user, userId, hierarchyUsers)) {
      res.status(403).json({ success: false, message: 'Forbidden: You cannot login as this user' });
      return;
    }
    const targetUser = await withTransactionPinFallback(
      () => prisma.user.findUnique({
        where: { id: userId },
        select: publicUserSelect,
      }),
      () => prisma.user.findUnique({
        where: { id: userId },
        select: publicUserBaseSelect,
      }),
    );

    if (!targetUser) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (!targetUser.isActive) {
      res.status(403).json({ success: false, message: 'Target user account is deactivated' });
      return;
    }
    const jwtSecret = getJwtSecret(res);
    if (!jwtSecret) return;

    const token = jwt.sign(
      { id: targetUser.id, role: targetUser.role },
      jwtSecret,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: buildPublicUserPayload(targetUser),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const changeTransactionPin = async (req: any, res: Response) => {
  const { currentPin, newPin, confirmPin } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        transactionPinHash: true,
      },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const normalizedNewPin = typeof newPin === 'string' ? newPin.trim() : '';
    const normalizedConfirmPin = typeof confirmPin === 'string' ? confirmPin.trim() : '';
    const normalizedCurrentPin = typeof currentPin === 'string' ? currentPin.trim() : '';

    if (!/^\d{4,6}$/.test(normalizedNewPin)) {
      res.status(400).json({ success: false, message: 'Transaction PIN must be 4 to 6 digits' });
      return;
    }

    if (normalizedNewPin !== normalizedConfirmPin) {
      res.status(400).json({ success: false, message: 'Transaction PIN confirmation does not match' });
      return;
    }

    if (user.transactionPinHash) {
      if (!normalizedCurrentPin) {
        res.status(400).json({ success: false, message: 'Current Transaction PIN is required' });
        return;
      }

      const matches = await bcrypt.compare(normalizedCurrentPin, user.transactionPinHash);
      if (!matches) {
        res.status(400).json({ success: false, message: 'Current Transaction PIN is incorrect' });
        return;
      }
    }

    const transactionPinHash = await bcrypt.hash(normalizedNewPin, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        transactionPinHash,
        transactionPinUpdatedAt: new Date(),
      },
    });

    res.json({ success: true, message: 'Transaction PIN updated successfully', transactionPinSet: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
