import { Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { fetchHierarchyUsers, getDescendantIds } from '../services/userHierarchy.service';

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  const isAdmin = req.user!.role === 'ADMIN' || req.user!.role === 'SUPER';
  try {
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;

    const startTime = from ? new Date(from) : new Date();
    if (!from) startTime.setDate(startTime.getDate() - 15);
    
    const endTime = to ? new Date(to) : new Date();

    const commonWhere: any = {
      createdAt: { gte: startTime, lte: endTime },
      ...(isAdmin ? {} : { userId: req.user!.id })
    };

    const [
      totalUsers, 
      totalBalance, 
      totalTransactions, 
      pendingFundRequests,
      pendingPayouts,
      recentTransactions
    ] = await Promise.all([
      prisma.user.count({ where: isAdmin ? {} : { parentId: req.user!.id, createdAt: { lte: endTime } } }),
      prisma.wallet.aggregate({ _sum: { balance: true }, where: isAdmin ? {} : { userId: req.user!.id } }),
      prisma.serviceRequest.count({ where: commonWhere }),
      prisma.serviceRequest.count({ where: { status: 'PENDING', serviceType: 'FUND_REQUEST', ...commonWhere } }),
      prisma.serviceRequest.count({ where: { status: 'PENDING', serviceType: 'PAYOUT', ...commonWhere } }),
      prisma.serviceRequest.findMany({
        where: commonWhere,
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: { include: { profile: true } } },
      })
    ]);

    const toNum = (val: any) => (val ? Number(val.toString()) : 0);
    
    let totalCredit = 0;
    let totalDebit = 0;
    let netProfit = 0;
    let totalCharges = 0;
    let totalCommissionEarned = 0;

    if (isAdmin) {
      const payInStats = await prisma.serviceRequest.aggregate({
        _sum: { amount: true, chargeAmount: true },
        where: { serviceType: 'FUND_REQUEST', status: 'SUCCESS', createdAt: { gte: startTime, lte: endTime } }
      });
      const payOutStats = await prisma.serviceRequest.aggregate({
        _sum: { amount: true, chargeAmount: true },
        where: { serviceType: 'PAYOUT', status: 'SUCCESS', createdAt: { gte: startTime, lte: endTime } }
      });
      const commissionStats = await prisma.walletTransaction.aggregate({
        _sum: { amount: true },
        where: {
          type: 'CREDIT',
          description: { contains: 'Commission', mode: 'insensitive' },
          createdAt: { gte: startTime, lte: endTime }
        }
      });

      totalCredit = toNum(payInStats._sum.amount);
      totalDebit = toNum(payOutStats._sum.amount);
      totalCommissionEarned = toNum(commissionStats._sum.amount);
      totalCharges = toNum(payInStats._sum.chargeAmount) + toNum(payOutStats._sum.chargeAmount);
      netProfit = totalCharges + totalCommissionEarned;
    } else {
      const [creditStats, debitStats, chargeStats, commissionStats] = await Promise.all([
        prisma.walletTransaction.aggregate({
          _sum: { amount: true },
          where: {
            type: 'CREDIT',
            receiverId: req.user!.id,
            createdAt: { gte: startTime, lte: endTime },
            NOT: { description: { contains: 'Commission', mode: 'insensitive' } }
          }
        }),
        prisma.walletTransaction.aggregate({
          _sum: { amount: true },
          where: {
            type: 'DEBIT',
            receiverId: req.user!.id,
            createdAt: { gte: startTime, lte: endTime },
            NOT: [
              { description: { contains: 'Charge', mode: 'insensitive' } },
              { description: { contains: 'Deducted', mode: 'insensitive' } },
              { description: { contains: 'Fee', mode: 'insensitive' } }
            ]
          }
        }),
        prisma.walletTransaction.aggregate({
          _sum: { amount: true },
          where: {
            type: 'DEBIT',
            receiverId: req.user!.id,
            createdAt: { gte: startTime, lte: endTime },
            OR: [
              { description: { contains: 'Charge', mode: 'insensitive' } },
              { description: { contains: 'Deducted', mode: 'insensitive' } },
              { description: { contains: 'Fee', mode: 'insensitive' } }
            ]
          }
        }),
        prisma.walletTransaction.aggregate({
          _sum: { amount: true },
          where: {
            type: 'CREDIT',
            receiverId: req.user!.id,
            createdAt: { gte: startTime, lte: endTime },
            description: { contains: 'Commission', mode: 'insensitive' }
          }
        })
      ]);

      totalCredit = toNum(creditStats._sum.amount);
      totalDebit = toNum(debitStats._sum.amount);
      totalCharges = toNum(chargeStats._sum.amount);
      totalCommissionEarned = toNum(commissionStats._sum.amount);
      netProfit = totalCommissionEarned - totalCharges;
    }

    const dailyStats: any[] = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('day', "createdAt") as date,
        COUNT(*)::int as transactions,
        COALESCE(SUM("amount"), 0)::float as volume
      FROM "ServiceRequest"
      WHERE "createdAt" >= ${startTime} AND "createdAt" <= ${endTime}
      AND "status" = 'SUCCESS'
      ${isAdmin ? Prisma.empty : Prisma.sql`AND "userId" = ${req.user!.id}::text`}
      GROUP BY 1
      ORDER BY 1 ASC
    `;
    
    const chartData = dailyStats.map(d => ({
      name: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue: d.volume,
      transactions: d.transactions
    }));

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalBalance: toNum(totalBalance._sum.balance),
        totalTransactions,
        totalCredit,
        totalDebit,
        totalCharges,
        totalCommissionEarned,
        netProfit,
        pendingFundRequests,
        pendingPayouts,
        recentTransactions,
        chartData
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getLedger = async (req: AuthRequest, res: Response) => {
  const from = req.query.from as string | undefined;
  const to = req.query.to as string | undefined;
  const page = (req.query.page as string) || '1';
  const limit = (req.query.limit as string) || '20';
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);
  const type = req.query.type as string | undefined;
  
  let where: any = req.user!.role === 'ADMIN'
    ? {}
    : {
        OR: [
          { receiverId: req.user!.id },
          { senderId: req.user!.id, type: 'DEBIT' },
        ],
      };

  if (type === 'fund_added') {
    where = {
      type: 'CREDIT',
      description: { contains: 'Top-up', mode: 'insensitive' },
      ...(req.user!.role !== 'ADMIN' ? { receiverId: req.user!.id } : {})
    };
  }

  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from as string);
    if (to) where.createdAt.lte = new Date(to as string);
  }

  const filterUserId = req.query.userId as string | undefined;
  if (filterUserId && req.user!.role === 'ADMIN') {
    where.receiverId = filterUserId;
  }

  try {
    const [transactions, total] = await Promise.all([
      prisma.walletTransaction.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: { include: { profile: true } },
          receiver: { include: { profile: true } },
          serviceRequest: {
            include: {
              companyBankAccount: true,
              user: {
                include: { profile: true },
              },
            },
          },
        },
      }),
      prisma.walletTransaction.count({ where }),
    ]);
    res.json({ success: true, transactions, total });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getReport = async (req: AuthRequest, res: Response) => {
  const type = req.query.type as string | undefined;
  const from = req.query.from as string | undefined;
  const to = req.query.to as string | undefined;
  const filterUserId = req.query.userId as string | undefined;
  const page = (req.query.page as string) || '1';
  const limit = (req.query.limit as string) || '20';
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const where: any = {};
  if (filterUserId) where.userId = filterUserId;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from as string);
    if (to) where.createdAt.lte = new Date(to as string);
  }

  if (type === 'payout_pending') {
    where.serviceType = 'PAYOUT';
    where.status = 'PENDING';
  } else if (type === 'payout_history') {
    where.serviceType = 'PAYOUT';
  } else if (type === 'distributor') {
    const distributors = await prisma.user.findMany({
      where: { role: 'DISTRIBUTOR', parentId: req.user!.id },
      select: { id: true },
    });
    where.userId = { in: distributors.map((d) => d.id) };
  } else if (type === 'retailer') {
    const retailers = await prisma.user.findMany({
      where: { role: 'RETAILER', parentId: req.user!.id },
      select: { id: true },
    });
    where.userId = { in: retailers.map((r) => r.id) };
  }

  if (req.user!.role !== 'ADMIN' && !filterUserId && !where.userId) {
    where.userId = req.user!.id;
  }

  try {
    const [requests, total] = await Promise.all([
      prisma.serviceRequest.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { user: { include: { profile: true } } },
      }),
      prisma.serviceRequest.count({ where }),
    ]);
    res.json({ success: true, requests, total });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getCommissionReport = async (req: AuthRequest, res: Response) => {
  const from = req.query.from as string | undefined;
  const to = req.query.to as string | undefined;
  const page = (req.query.page as string) || '1';
  const limit = (req.query.limit as string) || '20';
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const REPORT_RECEIVER_SCOPE: Record<string, string[]> = {
    ADMIN: ['ADMIN', 'SUPER', 'DISTRIBUTOR', 'RETAILER'],
    SUPER: ['SUPER', 'DISTRIBUTOR'],
    DISTRIBUTOR: ['DISTRIBUTOR'],
    RETAILER: ['RETAILER'],
  };

  const where: any = {
    status: 'SUCCESS',
    chargeAmount: { gt: 0 },
  };

  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from as string);
    if (to) where.createdAt.lte = new Date(to as string);
  }

  try {
    const [requests, total] = await Promise.all([
      prisma.serviceRequest.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { user: { include: { profile: true } } },
      }),
      prisma.serviceRequest.count({ where }),
    ]);

    const formattedRequests = requests.map((request) => {
      const distribution = JSON.parse(request.chargeDistribution || '[]');
      const allowedReceiverRoles = new Set(REPORT_RECEIVER_SCOPE[req.user!.role] || []);

      const filteredDistribution = req.user!.role === 'ADMIN'
          ? distribution
          : distribution.filter((entry: any) => {
              if (entry.receiverId === req.user!.id) return true;
              return false; // For now, non-admins only see their own commission
            });

      return {
        ...request,
        chargeDistribution: JSON.stringify(filteredDistribution),
      };
    });

    const userIds = new Set<string>();
    requests.forEach(r => {
      userIds.add(r.userId);
      const dist = JSON.parse(r.chargeDistribution || '[]');
      dist.forEach((entry: any) => userIds.add(entry.receiverId));
    });

    const users = await prisma.user.findMany({
      where: { id: { in: Array.from(userIds) } },
      include: { profile: true }
    });

    res.json({ success: true, requests: formattedRequests, total, users });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
