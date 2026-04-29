"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("./lib/prisma"));
const userHierarchy_service_1 = require("./services/userHierarchy.service");
async function main() {
    const vikram = await prisma_1.default.user.findFirst({ where: { email: 'distributor2@abheepay.com' } });
    if (!vikram) {
        console.error('Vikram not found');
        return;
    }
    const actorId = vikram.id;
    const actorRole = vikram.role;
    const actor = await prisma_1.default.user.findUnique({ where: { id: actorId }, select: { parentId: true } });
    const hierarchy = await (0, userHierarchy_service_1.fetchHierarchyUsers)();
    const ancestors = [];
    let currentId = actor?.parentId;
    while (currentId) {
        ancestors.push(currentId);
        const parent = hierarchy.find((u) => u.id === currentId);
        currentId = parent?.parentId;
    }
    const inheritedSlabs = await prisma_1.default.commissionSlab.findMany({
        where: {
            setById: { in: ancestors },
            serviceType: { in: ['PAYOUT', 'FUND_REQUEST'] },
            isActive: true,
        }
    });
    console.log('Ancestors:', ancestors);
    console.log('Inherited Slabs Count:', inheritedSlabs.length);
    console.log('Inherited Slabs:', JSON.stringify(inheritedSlabs, null, 2));
}
main()
    .catch(e => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma_1.default.$disconnect();
});
