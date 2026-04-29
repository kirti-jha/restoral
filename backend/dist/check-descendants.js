"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("./lib/prisma"));
const userHierarchy_service_1 = require("./services/userHierarchy.service");
async function main() {
    const users = await prisma_1.default.user.findMany();
    const demoUser = users.find(u => u.email.toLowerCase().includes('demo'));
    if (!demoUser) {
        console.log('No user found with "demo" in email');
        return;
    }
    console.log(`Found User: ${demoUser.email} (ID: ${demoUser.id}, Role: ${demoUser.role})`);
    const hierarchy = await (0, userHierarchy_service_1.fetchHierarchyUsers)();
    const descendants = (0, userHierarchy_service_1.getDescendantIds)(demoUser.id, hierarchy);
    console.log(`Descendant IDs for ${demoUser.email}:`, descendants);
    if (descendants.length > 0) {
        const descendantUsers = await prisma_1.default.user.findMany({
            where: { id: { in: descendants } }
        });
        console.log('Descendant Emails:', descendantUsers.map(u => u.email));
    }
    else {
        console.log('This user has NO descendants. They will see NO ONE in search.');
    }
}
main().catch(console.error).finally(() => prisma_1.default.$disconnect());
