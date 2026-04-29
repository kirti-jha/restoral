
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const types = await prisma.serviceRequest.groupBy({
    by: ['serviceType'],
    _count: true
  });
  console.log('Service Types:', JSON.stringify(types, null, 2));

  const allRequests = await prisma.serviceRequest.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: { user: true }
  });
  console.log('Latest Requests:', JSON.stringify(allRequests, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
