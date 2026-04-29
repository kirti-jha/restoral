import prisma from './lib/prisma';
import { fetchHierarchyUsers, getDescendantIds } from './services/userHierarchy.service';

async function main() {
  const users = await prisma.user.findMany();
  const demoUser = users.find(u => u.email.toLowerCase().includes('demo'));
  
  if (!demoUser) {
    console.log('No user found with "demo" in email');
    return;
  }

  console.log(`Found User: ${demoUser.email} (ID: ${demoUser.id}, Role: ${demoUser.role})`);

  const hierarchy = await fetchHierarchyUsers();
  const descendants = getDescendantIds(demoUser.id, hierarchy);

  console.log(`Descendant IDs for ${demoUser.email}:`, descendants);
  
  if (descendants.length > 0) {
    const descendantUsers = await prisma.user.findMany({
      where: { id: { in: descendants } }
    });
    console.log('Descendant Emails:', descendantUsers.map(u => u.email));
  } else {
    console.log('This user has NO descendants. They will see NO ONE in search.');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
