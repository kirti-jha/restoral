"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("./lib/prisma"));
async function main() {
    const adminId = '8da63c0d-cfe3-4bce-a0c5-58e16abee900';
    // Add some default rates for DISTRIBUTOR and RETAILER as Admin
    await prisma_1.default.commissionSlab.createMany({
        data: [
            { serviceType: 'PAYOUT', applyOnRole: 'DISTRIBUTOR', commissionType: 'FLAT', commissionValue: 10, minAmount: 1, maxAmount: 100000, setById: adminId },
            { serviceType: 'PAYOUT', applyOnRole: 'RETAILER', commissionType: 'FLAT', commissionValue: 15, minAmount: 1, maxAmount: 100000, setById: adminId }
        ]
    });
    // Add a demo user
    await prisma_1.default.user.create({
        data: {
            email: 'demo@example.com',
            passwordHash: 'dummy',
            role: 'RETAILER',
            parentId: adminId,
            profile: {
                create: {
                    ownerName: 'Demo User',
                    shopName: 'Demo Shop',
                    mobileNumber: '1234567890',
                    fullAddress: 'Demo Address',
                    state: 'Demo State',
                    pinCode: '123456'
                }
            }
        }
    });
    console.log('Seed updated');
}
main()
    .catch(e => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma_1.default.$disconnect();
});
