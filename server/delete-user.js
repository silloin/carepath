import { prisma } from './src/config/db.js';

async function deleteUser(email) {
  if (!email) {
    console.error('Please provide an email to delete. Usage: node delete-user.js user@example.com');
    process.exit(1);
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    
    if (!user) {
      console.log(`No user found with email: ${email}`);
      await prisma.$disconnect();
      return;
    }

    // Delete associated records first
    if (user.hospital) {
      await prisma.hospital.delete({ where: { userId: user.id } });
      console.log(`Deleted hospital record for user: ${email}`);
    }
    if (user.patient) {
      await prisma.patient.delete({ where: { userId: user.id } });
      console.log(`Deleted patient record for user: ${email}`);
    }

    // Delete the user
    await prisma.user.delete({ where: { id: user.id } });
    console.log(`Successfully deleted user: ${email} (role: ${user.role})`);
    
  } catch (error) {
    console.error('Error deleting user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

const emailToDelete = process.argv[2];
deleteUser(emailToDelete);