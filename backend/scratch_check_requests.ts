
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const requests = await prisma.serviceRequest.findMany({
    where: { serviceType: 'FUND_REQUEST' },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { 
      user: {
        select: {
          id: true,
          email: true,
          role: true,
          parentId: true
        }
      }
    }
  });

  console.log(JSON.stringify(requests, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
