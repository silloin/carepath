import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const adminEmail = (process.env.ADMIN_EMAIL || 'admin@carepath.local').toLowerCase()
const adminPassword = process.env.ADMIN_PASSWORD || 'change-this-development-password'
const patientEmail = (process.env.DEMO_PATIENT_EMAIL || 'patient.demo@carepath.local').toLowerCase()
const patientPassword = process.env.DEMO_PATIENT_PASSWORD || 'change-this-demo-password'

const catalog = [
  ['Knee Replacement', 'knee-replacement', 'Orthopedics'], ['Hip Replacement', 'hip-replacement', 'Orthopedics'], ['Cardiac Bypass', 'cardiac-bypass', 'Cardiology'], ['Angioplasty', 'angioplasty', 'Cardiology'], ['Cataract Surgery', 'cataract-surgery', 'Ophthalmology'], ['IVF Treatment', 'ivf-treatment', 'Fertility'], ['Kidney Transplant', 'kidney-transplant', 'Transplant'], ['Liver Transplant', 'liver-transplant', 'Transplant'], ['Cancer Treatment', 'cancer-treatment', 'Oncology'], ['Neurosurgery', 'neurosurgery', 'Neurology'], ['Dental Implant', 'dental-implant', 'Dental'], ['Spine Surgery', 'spine-surgery', 'Spine'], ['ACL Reconstruction', 'acl-reconstruction', 'Orthopedics'], ['Valve Replacement', 'valve-replacement', 'Cardiology'], ['LASIK', 'lasik', 'Ophthalmology'], ['Maternity Care', 'maternity-care', 'Women Health'], ['Robotic Surgery', 'robotic-surgery', 'General Surgery'], ['Radiation Therapy', 'radiation-therapy', 'Oncology'], ['Brain Tumor Care', 'brain-tumor-care', 'Neurology'], ['Preventive Health Check', 'preventive-health-check', 'General Medicine'],
]

const hospitals = [
  ['Asteria Heart Institute', 'asteria-heart-institute', 'New Delhi'], ['NavaCare Medical Centre', 'navacare-medical-centre', 'Chennai'], ['Sahyadri Prime Hospital', 'sahyadri-prime-hospital', 'Mumbai'], ['Lotus International Care', 'lotus-international-care', 'Bengaluru'], ['Riverstone Medical City', 'riverstone-medical-city', 'Hyderabad'], ['Meridian Specialty Hospital', 'meridian-specialty-hospital', 'Kolkata'], ['Blueleaf Health Campus', 'blueleaf-health-campus', 'Pune'], ['Sundial Medical Institute', 'sundial-medical-institute', 'Jaipur'], ['Northstar Surgical Centre', 'northstar-surgical-centre', 'Ahmedabad'], ['Harborview Hospitals', 'harborview-hospitals', 'Kochi'],
]

async function upsertUser(email, password, role) {
  return prisma.user.upsert({ where: { email }, update: { role, passwordHash: await bcrypt.hash(password, 12) }, create: { email, role, passwordHash: await bcrypt.hash(password, 12) } })
}

async function main() {
  await upsertUser(adminEmail, adminPassword, 'ADMIN')
  const patientUser = await upsertUser(patientEmail, patientPassword, 'PATIENT')
  await prisma.patient.upsert({ where: { userId: patientUser.id }, update: {}, create: { userId: patientUser.id, firstName: 'Demo', lastName: 'Patient', country: 'Nigeria' } })

  const treatments = new Map()
  for (const [name, slug, specialtyName] of catalog) {
    const specialty = await prisma.specialty.upsert({ where: { name: specialtyName }, update: {}, create: { name: specialtyName } })
    treatments.set(slug, await prisma.treatment.upsert({ where: { slug }, update: { name, specialtyId: specialty.id }, create: { name, slug, specialtyId: specialty.id } }))
  }

  for (let index = 0; index < hospitals.length; index += 1) {
    const [name, slug, city] = hospitals[index]
    const user = await upsertUser(`hospital${index + 1}.demo@carepath.local`, 'change-this-demo-password', 'HOSPITAL')
    const hospital = await prisma.hospital.upsert({ where: { userId: user.id }, update: { name, city, slug, status: 'VERIFIED', description: 'Fictional demo hospital for Carepath marketplace testing.', internationalSupport: true, beds: 250 + index * 20, icuBeds: 20 + index, facilities: 'International patient desk, diagnostics, pharmacy', accreditation: index % 2 ? 'NABH' : 'JCI' }, create: { userId: user.id, name, city, slug, status: 'VERIFIED', description: 'Fictional demo hospital for Carepath marketplace testing.', internationalSupport: true, beds: 250 + index * 20, icuBeds: 20 + index, facilities: 'International patient desk, diagnostics, pharmacy', accreditation: index % 2 ? 'NABH' : 'JCI', verification: { create: { status: 'VERIFIED', reviewedAt: new Date() } } } })
    await prisma.hospitalVerification.upsert({ where: { hospitalId: hospital.id }, update: { status: 'VERIFIED', reviewedAt: new Date() }, create: { hospitalId: hospital.id, status: 'VERIFIED', reviewedAt: new Date() } })
    const offerings = []
    if (index < 3) offerings.push(['knee-replacement', 450000 + index * 50000, 600000 + index * 50000])
    if (index < 2) offerings.push(['cardiac-bypass', 580000 + index * 40000, 850000 + index * 50000])
    if (index === 0) offerings.push(['kidney-transplant', 900000, 1300000])
    if (index % 2 === 0) offerings.push(['cataract-surgery', 35000 + index * 5000, 75000 + index * 5000])
    for (const [treatmentSlug, min, max] of offerings) { const treatment = treatments.get(treatmentSlug); await prisma.hospitalTreatment.upsert({ where: { hospitalId_treatmentId: { hospitalId: hospital.id, treatmentId: treatment.id } }, update: { minEstimatedCost: min, maxEstimatedCost: max, approvalStatus: 'APPROVED', availability: 'AVAILABLE', hospitalStay: '5–7 days', recoveryEstimate: '4–6 weeks', consultationEstimate: 10000 }, create: { hospitalId: hospital.id, treatmentId: treatment.id, minEstimatedCost: min, maxEstimatedCost: max, approvalStatus: 'APPROVED', availability: 'AVAILABLE', hospitalStay: '5–7 days', recoveryEstimate: '4–6 weeks', consultationEstimate: 10000 } }) }
  }
  console.log(`Carepath demo seed complete. Admin: ${adminEmail}. Patient: ${patientEmail}. Knee replacement has 3 providers, kidney transplant has 1, and liver transplant has 0.`)
}

main().catch((error) => { console.error(error); process.exitCode = 1 }).finally(() => prisma.$disconnect())
