"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEffectiveCommissionSlabs = exports.getOverrideTargets = exports.deleteUserOverride = exports.upsertUserOverride = exports.getUserOverrides = exports.deleteSlab = exports.upsertSlab = exports.getSlabs = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const userHierarchy_service_1 = require("../services/userHierarchy.service");
const commission_service_1 = require("../services/commission.service");
const notification_service_1 = require("../services/notification.service");
class InputValidationError extends Error {
}
function getRangeKey(minAmount, maxAmount) {
    return `${(0, commission_service_1.toDecimalAmount)(minAmount).toFixed(2)}|${maxAmount === null ? 'null' : (0, commission_service_1.toDecimalAmount)(maxAmount).toFixed(2)}`;
}
function dedupeCommissionSlabs(rows) {
    const seen = new Set();
    return rows.filter((row) => {
        const key = [
            row.serviceType,
            row.applyOnRole,
            row.commissionType,
            (0, commission_service_1.toDecimalAmount)(row.commissionValue).toFixed(2),
            getRangeKey(row.minAmount, row.maxAmount),
        ].join('|');
        if (seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
    });
}
function dedupeUserOverrides(rows) {
    // Use a Map to keep the LAST seen record for each unique (target, service, range)
    // Since the input rows are ordered by createdAt ASC, the last one will be the newest.
    const map = new Map();
    for (const row of rows) {
        const key = [
            row.targetUserId,
            row.serviceType,
            getRangeKey(row.minAmount, row.maxAmount),
        ].join('|');
        map.set(key, row);
    }
    return Array.from(map.values());
}
function sendBadRequest(res, message) {
    res.status(400).json({ success: false, message });
}
function parseRequiredDecimal(value, fieldName) {
    if (value === undefined || value === null || value === '') {
        throw new InputValidationError(`${fieldName} is required`);
    }
    let decimal;
    try {
        decimal = (0, commission_service_1.toDecimalAmount)(value);
    }
    catch {
        throw new InputValidationError(`${fieldName} must be a valid amount`);
    }
    if (decimal.isNegative()) {
        throw new InputValidationError(`${fieldName} cannot be negative`);
    }
    return decimal;
}
function parseOptionalDecimal(value, fieldName) {
    if (value === undefined || value === null || value === '') {
        return null;
    }
    let decimal;
    try {
        decimal = (0, commission_service_1.toDecimalAmount)(value);
    }
    catch {
        throw new InputValidationError(`${fieldName} must be a valid amount`);
    }
    if (decimal.isNegative()) {
        throw new InputValidationError(`${fieldName} cannot be negative`);
    }
    return decimal;
}
function parseIsActive(value) {
    if (typeof value === 'boolean') {
        return value;
    }
    if (typeof value === 'string') {
        if (value === 'true')
            return true;
        if (value === 'false')
            return false;
    }
    return true;
}
async function findOverlappingDefaultSlab(setById, serviceType, applyOnRole, minAmount, maxAmount, excludeId) {
    const rows = await prisma_1.default.commissionSlab.findMany({
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
    return rows.find((row) => (0, commission_service_1.rangesOverlap)(row.minAmount, row.maxAmount, minAmount, maxAmount));
}
async function findOverlappingOverride(setById, targetUserId, serviceType, minAmount, maxAmount, excludeId) {
    const rows = await prisma_1.default.userCommissionSetup.findMany({
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
    return rows.find((row) => (0, commission_service_1.rangesOverlap)(row.minAmount, row.maxAmount, minAmount, maxAmount));
}
const getSlabs = async (req, res) => {
    try {
        const actorId = req.user.id;
        const actorRole = req.user.role;
        const mySlabs = await prisma_1.default.commissionSlab.findMany({
            where: {
                setById: actorId,
                serviceType: { in: ['PAYOUT', 'FUND_REQUEST'] },
            },
            orderBy: [{ serviceType: 'asc' }, { applyOnRole: 'asc' }, { minAmount: 'asc' }, { createdAt: 'asc' }],
        });
        const actor = await prisma_1.default.user.findUnique({
            where: { id: actorId },
            select: { parentId: true },
        });
        let inheritedSlabs = [];
        if (actorRole !== 'ADMIN') {
            const allowedRoles = (0, commission_service_1.getAssignableRateRoles)(actorRole);
            // Include actor's own role to see inherited base rates
            const rolesToFetch = [...new Set([...allowedRoles, actorRole])];
            if (actor?.parentId) {
                inheritedSlabs = await prisma_1.default.commissionSlab.findMany({
                    where: {
                        setById: actor.parentId,
                        serviceType: { in: ['PAYOUT', 'FUND_REQUEST'] },
                        isActive: true,
                        applyOnRole: { in: rolesToFetch },
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.getSlabs = getSlabs;
const upsertSlab = async (req, res) => {
    const { id, serviceType, applyOnRole, commissionType, commissionValue, minAmount, maxAmount } = req.body;
    try {
        if (!(0, commission_service_1.isRateServiceType)(serviceType)) {
            sendBadRequest(res, 'Unsupported service type');
            return;
        }
        const allowedRoles = (0, commission_service_1.getAssignableRateRoles)(req.user.role);
        if (!allowedRoles.includes(applyOnRole)) {
            sendBadRequest(res, 'You cannot set default rates for this role');
            return;
        }
        if (!(0, commission_service_1.isCommissionType)(commissionType)) {
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
        const inheritedFloorError = await (0, commission_service_1.validateDefaultRateFloor)(req.user.id, applyOnRole, serviceType, normalizedCommissionValue, normalizedMinAmount, normalizedMaxAmount, id);
        if (inheritedFloorError) {
            sendBadRequest(res, inheritedFloorError);
            return;
        }
        if (id) {
            const existingRow = await prisma_1.default.commissionSlab.findFirst({
                where: { id, setById: req.user.id },
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
        const overlappingRow = await findOverlappingDefaultSlab(req.user.id, serviceType, applyOnRole, normalizedMinAmount, normalizedMaxAmount, id);
        if (overlappingRow) {
            sendBadRequest(res, 'This amount range overlaps with an existing default rate');
            return;
        }
        const slab = id
            ? await prisma_1.default.commissionSlab.update({
                where: { id },
                data: {
                    serviceType,
                    applyOnRole: applyOnRole,
                    commissionType,
                    commissionValue: normalizedCommissionValue,
                    minAmount: normalizedMinAmount,
                    maxAmount: normalizedMaxAmount,
                    isActive,
                },
            })
            : await prisma_1.default.commissionSlab.create({
                data: {
                    setById: req.user.id,
                    serviceType,
                    applyOnRole: applyOnRole,
                    commissionType,
                    commissionValue: normalizedCommissionValue,
                    minAmount: normalizedMinAmount,
                    maxAmount: normalizedMaxAmount,
                    isActive,
                },
            });
        await (0, notification_service_1.createAdminNotification)(id ? 'Default Charge Updated' : 'Default Charge Created', `${req.user.role} ${id ? 'updated' : 'created'} a ${serviceType} default charge for ${applyOnRole}.`, 'INFO');
        res.json({ success: true, slab });
    }
    catch (error) {
        if (error instanceof InputValidationError) {
            sendBadRequest(res, error.message);
            return;
        }
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.upsertSlab = upsertSlab;
const deleteSlab = async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') {
            res.status(403).json({ success: false, message: 'Only administrators can delete slabs' });
            return;
        }
        const deleted = await prisma_1.default.commissionSlab.deleteMany({
            where: {
                id: req.params.id,
                // Admins can delete any slab? User said "charges delete bs admin kr skta h"
                // Usually means Admin can delete anyone's slab, or managers can't delete their own.
                // If I'm Admin, I can delete any slab.
            },
        });
        if (deleted.count === 0) {
            res.status(404).json({ success: false, message: 'Default rate not found' });
            return;
        }
        await (0, notification_service_1.createAdminNotification)('Default Charge Deleted', `${req.user.role} deleted a default charge slab.`, 'WARNING');
        res.json({ success: true });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.deleteSlab = deleteSlab;
const getUserOverrides = async (req, res) => {
    try {
        const actorId = req.user.id;
        const actorRole = req.user.role;
        const hierarchyUsers = await (0, userHierarchy_service_1.fetchHierarchyUsers)();
        let targetIds;
        if (actorRole === 'ADMIN') {
            // Admins can see overrides for all users in the system
            targetIds = hierarchyUsers.map(u => u.id);
        }
        else {
            // Other managers only see overrides for their descendants
            targetIds = (0, userHierarchy_service_1.getDescendantIds)(actorId, hierarchyUsers);
        }
        // Fetch overrides for anyone in hierarchy, regardless of who set it
        const overrides = await prisma_1.default.userCommissionSetup.findMany({
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
            orderBy: [{ targetUserId: 'asc' }, { serviceType: 'asc' }, { minAmount: 'asc' }, { createdAt: 'desc' }],
        });
        res.json({ success: true, overrides: dedupeUserOverrides(overrides) });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.getUserOverrides = getUserOverrides;
const upsertUserOverride = async (req, res) => {
    const { id, targetUserId, serviceType, commissionType, commissionValue, minAmount, maxAmount } = req.body;
    try {
        if (!targetUserId) {
            sendBadRequest(res, 'targetUserId is required');
            return;
        }
        if (!(0, commission_service_1.isRateServiceType)(serviceType)) {
            sendBadRequest(res, 'Unsupported service type');
            return;
        }
        if (!(0, commission_service_1.isCommissionType)(commissionType)) {
            sendBadRequest(res, 'Unsupported commission type');
            return;
        }
        const hierarchyUsers = await (0, userHierarchy_service_1.fetchHierarchyUsers)();
        const targetUser = hierarchyUsers.find((user) => user.id === targetUserId && user.isActive);
        if (!targetUser || !(0, userHierarchy_service_1.canManageTarget)(req.user, targetUserId, hierarchyUsers)) {
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
        const inheritedFloorError = await (0, commission_service_1.validateUserOverrideFloor)(targetUserId, serviceType, normalizedCommissionValue, normalizedMinAmount, normalizedMaxAmount, id);
        if (inheritedFloorError) {
            sendBadRequest(res, inheritedFloorError);
            return;
        }
        // Check for existing override on same (user, service, range) regardless of who set it
        const existingOverride = await prisma_1.default.userCommissionSetup.findFirst({
            where: {
                targetUserId,
                serviceType,
                minAmount: normalizedMinAmount,
                maxAmount: normalizedMaxAmount,
            }
        });
        const override = existingOverride
            ? await prisma_1.default.userCommissionSetup.update({
                where: { id: existingOverride.id },
                data: {
                    commissionType,
                    commissionValue: normalizedCommissionValue,
                    isActive,
                    setById: req.user.id, // Update who last set it
                },
                include: {
                    targetUser: { select: { id: true, email: true, role: true, profile: { select: { ownerName: true, shopName: true } } } },
                    setBy: { select: { id: true, email: true, role: true, profile: { select: { ownerName: true, shopName: true } } } },
                },
            })
            : await prisma_1.default.userCommissionSetup.create({
                data: {
                    setById: req.user.id,
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
        await (0, notification_service_1.notifyAdminsAndUser)(targetUserId, existingOverride ? 'Special Charge Updated' : 'Special Charge Applied', `${req.user.role} ${existingOverride ? 'updated' : 'set'} a ${serviceType} special charge for your account.`, 'INFO');
        res.json({ success: true, override });
    }
    catch (error) {
        if (error instanceof InputValidationError) {
            sendBadRequest(res, error.message);
            return;
        }
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.upsertUserOverride = upsertUserOverride;
const deleteUserOverride = async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') {
            res.status(403).json({ success: false, message: 'Only administrators can delete overrides' });
            return;
        }
        const existingOverride = await prisma_1.default.userCommissionSetup.findFirst({
            where: { id: req.params.id },
            select: { targetUserId: true, serviceType: true },
        });
        if (!existingOverride) {
            res.status(404).json({ success: false, message: 'User override not found' });
            return;
        }
        await prisma_1.default.userCommissionSetup.delete({
            where: { id: req.params.id },
        });
        await (0, notification_service_1.notifyAdminsAndUser)(existingOverride.targetUserId, 'Special Charge Removed', `${req.user.role} removed a ${existingOverride.serviceType} special charge from your account.`, 'WARNING');
        res.json({ success: true });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.deleteUserOverride = deleteUserOverride;
const getOverrideTargets = async (req, res) => {
    try {
        const hierarchyUsers = await (0, userHierarchy_service_1.fetchHierarchyUsers)();
        let targetIds;
        if (req.user.role === 'ADMIN') {
            targetIds = hierarchyUsers.map(u => u.id);
        }
        else {
            targetIds = (0, userHierarchy_service_1.getDescendantIds)(req.user.id, hierarchyUsers);
        }
        const targets = await prisma_1.default.user.findMany({
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.getOverrideTargets = getOverrideTargets;
const getEffectiveCommissionSlabs = async (req, res) => {
    try {
        const slabs = await (0, commission_service_1.buildEffectiveSlabs)(req.user.id);
        res.json({ success: true, slabs });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.getEffectiveCommissionSlabs = getEffectiveCommissionSlabs;
