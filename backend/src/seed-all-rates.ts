import { Role } from '@prisma/client';
import prisma from './lib/prisma';

async function main() {
  // Find all managers (Admin already handled, but we'll re-run for all)
  const managers = await prisma.user.findMany({
    where: {
      role: { in: [Role.ADMIN, Role.SUPER, Role.DISTRIBUTOR] }
    }
  });

  console.log(`Found ${managers.length} managers to populate.`);

  for (const manager of managers) {
    const slabs: any[] = [];
    let rolesToApply: Role[] = [];

    if (manager.role === Role.ADMIN) {
      rolesToApply = [Role.SUPER, Role.DISTRIBUTOR, Role.RETAILER];
    } else if (manager.role === Role.SUPER) {
      rolesToApply = [Role.DISTRIBUTOR, Role.RETAILER];
    } else if (manager.role === Role.DISTRIBUTOR) {
      rolesToApply = [Role.RETAILER];
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
      await prisma.commissionSlab.deleteMany({ where: { setById: manager.id } });
      // Create new ones
      await prisma.commissionSlab.createMany({ data: slabs });
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
    await prisma.$disconnect();
  });
