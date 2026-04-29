"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("./lib/prisma"));
async function main() {
    const adminId = '8da63c0d-cfe3-4bce-a0c5-58e16abee900';
    const roles = [client_1.Role.SUPER, client_1.Role.DISTRIBUTOR, client_1.Role.RETAILER];
    const slabs = [];
    for (const role of roles) {
        // Payout slabs
        slabs.push({
            serviceType: 'PAYOUT',
            applyOnRole: role,
            commissionType: 'FLAT',
            commissionValue: 5,
            minAmount: 1,
            maxAmount: 5000,
            setById: adminId,
            isActive: true
        });
        slabs.push({
            serviceType: 'PAYOUT',
            applyOnRole: role,
            commissionType: 'FLAT',
            commissionValue: 10,
            minAmount: 5001,
            maxAmount: 25000,
            setById: adminId,
            isActive: true
        });
        slabs.push({
            serviceType: 'PAYOUT',
            applyOnRole: role,
            commissionType: 'FLAT',
            commissionValue: 15,
            minAmount: 25001,
            maxAmount: 100000,
            setById: adminId,
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
            setById: adminId,
            isActive: true
        });
    }
    // Clear existing Admin slabs
    await prisma_1.default.commissionSlab.deleteMany({ where: { setById: adminId } });
    // Create new ones
    await prisma_1.default.commissionSlab.createMany({ data: slabs });
    console.log(`Successfully set ${slabs.length} default rates for Admin.`);
}
main()
    .catch(e => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma_1.default.$disconnect();
});
