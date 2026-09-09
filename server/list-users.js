import { prisma } from './src/config/db.js';

async function listAllUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      hospital: { select: { name: true, status: true } },
      patient: { select: { firstName: true, lastName: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log('=== All Users in Database ===');
  users.forEach(user => {
    const accountDetails = user.hospital 
      ? `🏥 HOSPITAL: ${user.hospital.name} (${user.hospital.status})` 
      : user.patient 
        ? `👤 PATIENT: ${user.patient.firstName} ${user.patient.lastName}`
        : `👑 ${user.role}`;
    
    console.log(`${user.email} - Role: ${user.role} - ID: ${user.id} - ${accountDetails}`);
  });

  await prisma.$disconnect();
}

listAllUsers().catch(console.error);