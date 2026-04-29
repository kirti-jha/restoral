"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("./lib/prisma"));
async function main() {
    // Find all managers (Admin already handled, but we'll re-run for all)
    const managers = await prisma_1.default.user.findMany({
        where: {
            role: { in: [client_1.Role.ADMIN, client_1.Role.SUPER, client_1.Role.DISTRIBUTOR] }
        }
    });
    console.log(`Found ${managers.length} managers to populate.`);
    for (const manager of managers) {
        const slabs = [];
        let rolesToApply = [];
        if (manager.role === client_1.Role.ADMIN) {
            rolesToApply = [client_1.Role.SUPER, client_1.Role.DISTRIBUTOR, client_1.Role.RETAILER];
        }
        else if (manager.role === client_1.Role.SUPER) {
            rolesToApply = [client_1.Role.DISTRIBUTOR, client_1.Role.RETAILER];
        }
        else if (manager.role === client_1.Role.DISTRIBUTOR) {
            rolesToApply = [client_1.Role.RETAILER];
        }
        for (const role of rolesToApply) {
            // Payout slabs
            slabs.push({
                serviceType: 'PAYOUT',
                applyOnRole: role,
                commissionType: 'FLAT',
                commissionValue: 5,
                minAmount: 1,
                maxAmount: 5000,
                setById: manager.id,
                isActive: true
            });
            slabs.push({
                serviceType: 'PAYOUT',
                applyOnRole: role,
                commissionType: 'FLAT',
                commissionValue: 10,
                minAmount: 5001,
                maxAmount: 25000,
                setById: manager.id,
                isActive: true
            });
            slabs.push({
                serviceType: 'PAYOUT',
                applyOnRole: role,
                commissionType: 'FLAT',
                commissionValue: 15,
                minAmount: 25001,
                maxAmount: 100000,
                setById: manager.id,
                isActive: true
            });
            // Fund Request slabs
            slabs.push({
                serviceType: 'FUND_REQUEST',
                applyOnRole: role,
                commissionType: 'FLAT',
                commissionValue: 5,
                minAmount: 1,
                maxAmount: 100000,
                setById: manager.id,
                isActive: true
            });
        }
        if (slabs.length > 0) {
            // Clear existing slabs for this manager
            await prisma_1.default.commissionSlab.deleteMany({ where: { setById: manager.id } });
            // Create new ones
            await prisma_1.default.commissionSlab.createMany({ data: slabs });
            console.log(`Set ${slabs.length} default rates for ${manager.role} (${manager.email})`);
        }
    }
    console.log('Finished setting default rates for all managers.');
}
main()
    .catch(e => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma_1.default.$disconnect();
});
