
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  console.log('Admin ID:', admin?.id);
  
  const slabs = await prisma.commissionSlab.findMany({
    where: { serviceType: 'FUND_REQUEST' }
  });
  console.log('Fund Request Slabs:', JSON.stringify(slabs, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
