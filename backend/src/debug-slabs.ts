import prisma from './lib/prisma';
import { fetchHierarchyUsers } from './services/userHierarchy.service';

async function main() {
  const vikram = await prisma.user.findFirst({ where: { email: 'distributor2@abheepay.com' } });
  if (!vikram) {
    console.error('Vikram not found');
    return;
  }
  const actorId = vikram.id;
  const actorRole = vikram.role;
  
  const actor = await prisma.user.findUnique({ where: { id: actorId }, select: { parentId: true } });
  const hierarchy = await fetchHierarchyUsers();
  const ancestors: string[] = [];
  let currentId = actor?.parentId;
  while (currentId) {
    ancestors.push(currentId);
    const parent = hierarchy.find((u) => u.id === currentId);
    currentId = parent?.parentId;
  }
  
  const inheritedSlabs = await prisma.commissionSlab.findMany({
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
    await prisma.$disconnect();
  });
