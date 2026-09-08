import test from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { app } from '../src/server.js'
import { PrismaClient } from '@prisma/client'
import { signUser } from '../src/middleware/auth.js'

const prisma = new PrismaClient()

const getToken = (id, role) => signUser({ id, role })

test.after(async () => {
  await prisma.$disconnect()
})

test('5. Authentication & Authorization Security Isolation', async (t) => {
  const adminUser = await prisma.user.create({ data: { email: `admin-sec-${Date.now()}@example.com`, passwordHash: 'hash', role: 'ADMIN' } })
  const patientAUser = await prisma.user.create({ data: { email: `patientA-${Date.now()}@example.com`, passwordHash: 'hash', role: 'PATIENT' } })
  const patientA = await prisma.patient.create({ data: { userId: patientAUser.id, firstName: 'PatientA', lastName: 'Test' } })

  const patientBUser = await prisma.user.create({ data: { email: `patientB-${Date.now()}@example.com`, passwordHash: 'hash', role: 'PATIENT' } })
  const patientB = await prisma.patient.create({ data: { userId: patientBUser.id, firstName: 'PatientB', lastName: 'Test' } })

  const hospitalAUser = await prisma.user.create({ data: { email: `hospitalA-${Date.now()}@example.com`, passwordHash: 'hash', role: 'HOSPITAL' } })
  const hospitalA = await prisma.hospital.create({ data: { userId: hospitalAUser.id, name: `Hospital A ${Date.now()}`, slug: `hosp-a-${Date.now()}`, city: 'Delhi', status: 'VERIFIED' } })

  const hospitalBUser = await prisma.user.create({ data: { email: `hospitalB-${Date.now()}@example.com`, passwordHash: 'hash', role: 'HOSPITAL' } })
  const hospitalB = await prisma.hospital.create({ data: { userId: hospitalBUser.id, name: `Hospital B ${Date.now()}`, slug: `hosp-b-${Date.now()}`, city: 'Mumbai', status: 'VERIFIED' } })

  const specialty = await prisma.specialty.create({ data: { name: `Sec Specialty ${Date.now()}` } })
  const treatment = await prisma.treatment.create({ data: { name: `Sec Treatment ${Date.now()}`, slug: `sec-treatment-${Date.now()}`, specialtyId: specialty.id } })

  const htA = await prisma.hospitalTreatment.create({ data: { hospitalId: hospitalA.id, treatmentId: treatment.id, minEstimatedCost: 100, maxEstimatedCost: 200, approvalStatus: 'APPROVED', availability: 'AVAILABLE' } })
  const htB = await prisma.hospitalTreatment.create({ data: { hospitalId: hospitalB.id, treatmentId: treatment.id, minEstimatedCost: 150, maxEstimatedCost: 250, approvalStatus: 'APPROVED', availability: 'AVAILABLE' } })

  const caseA = await prisma.patientCase.create({ data: { patientId: patientA.id, hospitalId: hospitalA.id, treatmentId: treatment.id, status: 'SUBMITTED' } })
  const caseB = await prisma.patientCase.create({ data: { patientId: patientB.id, hospitalId: hospitalB.id, treatmentId: treatment.id, status: 'SUBMITTED' } })

  const tokenAdmin = getToken(adminUser.id, 'ADMIN')
  const tokenPatientA = getToken(patientAUser.id, 'PATIENT')
  const tokenPatientB = getToken(patientBUser.id, 'PATIENT')
  const tokenHospitalA = getToken(hospitalAUser.id, 'HOSPITAL')
  const tokenHospitalB = getToken(hospitalBUser.id, 'HOSPITAL')

  await t.test('Unauthenticated requests rejected with 401', async () => {
    await request(app).get('/api/admin/patients').expect(401)
    await request(app).get('/api/patient/cases').expect(401)
    await request(app).get('/api/hospital/cases').expect(401)
  })

  await t.test('Patient A can access own case, but Patient B case is forbidden/not found', async () => {
    await request(app).get(`/api/patient/cases/${caseA.id}`).set('Authorization', `Bearer ${tokenPatientA}`).expect(200)
    await request(app).get(`/api/patient/cases/${caseB.id}`).set('Authorization', `Bearer ${tokenPatientA}`).expect(404)
  })

  await t.test('Hospital A can update own treatment, but cannot update Hospital B treatment', async () => {
    await request(app).put(`/api/hospitals/me/treatments/${htA.id}`).set('Authorization', `Bearer ${tokenHospitalA}`).send({ minEstimatedCost: 120 }).expect(200)
    await request(app).put(`/api/hospitals/me/treatments/${htB.id}`).set('Authorization', `Bearer ${tokenHospitalA}`).send({ minEstimatedCost: 999 }).expect(404)
  })

  await t.test('Hospital A cannot access Hospital B private case', async () => {
    await request(app).get(`/api/hospital/cases/${caseA.id}`).set('Authorization', `Bearer ${tokenHospitalA}`).expect(200)
    await request(app).get(`/api/hospital/cases/${caseB.id}`).set('Authorization', `Bearer ${tokenHospitalA}`).expect(404)
  })

  await t.test('Admin endpoints protected strictly for ADMIN role', async () => {
    await request(app).get('/api/admin/patients').set('Authorization', `Bearer ${tokenAdmin}`).expect(200)
    await request(app).get('/api/admin/cases').set('Authorization', `Bearer ${tokenAdmin}`).expect(200)
    await request(app).get('/api/admin/appointments').set('Authorization', `Bearer ${tokenAdmin}`).expect(200)
    await request(app).get('/api/admin/reviews').set('Authorization', `Bearer ${tokenAdmin}`).expect(200)

    await request(app).get('/api/admin/patients').set('Authorization', `Bearer ${tokenPatientA}`).expect(403)
    await request(app).get('/api/admin/cases').set('Authorization', `Bearer ${tokenHospitalA}`).expect(403)
  })
})

test('6 & 7. Hospital Verification & Hospital-Treatment Moderation Rules', async (t) => {
  const user = await prisma.user.create({ data: { email: `rule-hosp-${Date.now()}@example.com`, passwordHash: 'hash', role: 'HOSPITAL' } })
  const pendingHosp = await prisma.hospital.create({ data: { userId: user.id, name: `Pending Hosp ${Date.now()}`, slug: `pending-hosp-${Date.now()}`, city: 'City', status: 'PENDING_VERIFICATION' } })

  const user2 = await prisma.user.create({ data: { email: `rule-hosp2-${Date.now()}@example.com`, passwordHash: 'hash', role: 'HOSPITAL' } })
  const verifHosp = await prisma.hospital.create({ data: { userId: user2.id, name: `Verif Hosp ${Date.now()}`, slug: `verif-hosp-${Date.now()}`, city: 'City', status: 'VERIFIED' } })

  const specialty = await prisma.specialty.create({ data: { name: `Rules Specialty ${Date.now()}` } })
  const treatment = await prisma.treatment.create({ data: { name: `Rules Treatment ${Date.now()}`, slug: `rules-treatment-${Date.now()}`, specialtyId: specialty.id } })

  await prisma.hospitalTreatment.create({ data: { hospitalId: pendingHosp.id, treatmentId: treatment.id, minEstimatedCost: 100, maxEstimatedCost: 200, approvalStatus: 'APPROVED', availability: 'AVAILABLE' } })
  const htPending = await prisma.hospitalTreatment.create({ data: { hospitalId: verifHosp.id, treatmentId: treatment.id, minEstimatedCost: 100, maxEstimatedCost: 200, approvalStatus: 'PENDING', availability: 'AVAILABLE' } })

  await t.test('Unverified hospital records do not appear in public marketplace', async () => {
    const res = await request(app).get(`/api/public/hospitals/${pendingHosp.slug}`).expect(404)
    assert.equal(res.body.success, false)
  })

  await t.test('Pending hospital treatment does not appear publicly until approved', async () => {
    const res = await request(app).get(`/api/public/treatments/${treatment.slug}`).expect(200)
    assert.equal(res.body.data.availableHospitalCount, 0)
    assert.ok(res.body.data.hospitals.every(h => h.id !== htPending.id))
  })
})

test('8. Provider Availability States (0, 1, 2+)', async (t) => {
  const specialty = await prisma.specialty.create({ data: { name: `State Spec ${Date.now()}` } })
  const t0 = await prisma.treatment.create({ data: { name: `T0 ${Date.now()}`, slug: `t0-${Date.now()}`, specialtyId: specialty.id } })
  const t1 = await prisma.treatment.create({ data: { name: `T1 ${Date.now()}`, slug: `t1-${Date.now()}`, specialtyId: specialty.id } })
  const t2 = await prisma.treatment.create({ data: { name: `T2 ${Date.now()}`, slug: `t2-${Date.now()}`, specialtyId: specialty.id } })

  const u1 = await prisma.user.create({ data: { email: `u1-${Date.now()}@example.com`, passwordHash: 'h', role: 'HOSPITAL' } })
  const h1 = await prisma.hospital.create({ data: { userId: u1.id, name: `H1 ${Date.now()}`, slug: `h1-${Date.now()}`, city: 'C', status: 'VERIFIED' } })

  const u2 = await prisma.user.create({ data: { email: `u2-${Date.now()}@example.com`, passwordHash: 'h', role: 'HOSPITAL' } })
  const h2 = await prisma.hospital.create({ data: { userId: u2.id, name: `H2 ${Date.now()}`, slug: `h2-${Date.now()}`, city: 'C', status: 'VERIFIED' } })

  await prisma.hospitalTreatment.create({ data: { hospitalId: h1.id, treatmentId: t1.id, minEstimatedCost: 100, maxEstimatedCost: 200, approvalStatus: 'APPROVED', availability: 'AVAILABLE' } })
  await prisma.hospitalTreatment.create({ data: { hospitalId: h1.id, treatmentId: t2.id, minEstimatedCost: 100, maxEstimatedCost: 200, approvalStatus: 'APPROVED', availability: 'AVAILABLE' } })
  await prisma.hospitalTreatment.create({ data: { hospitalId: h2.id, treatmentId: t2.id, minEstimatedCost: 120, maxEstimatedCost: 220, approvalStatus: 'APPROVED', availability: 'AVAILABLE' } })

  await t.test('Case 0: 0 available hospitals', async () => {
    const res = await request(app).get(`/api/public/treatments/${t0.slug}`).expect(200)
    assert.equal(res.body.data.availableHospitalCount, 0)
    assert.equal(res.body.data.state, 'NONE')
    assert.equal(res.body.data.comparisonEnabled, false)
  })

  await t.test('Case 1: Exactly 1 available hospital', async () => {
    const res = await request(app).get(`/api/public/treatments/${t1.slug}`).expect(200)
    assert.equal(res.body.data.availableHospitalCount, 1)
    assert.equal(res.body.data.state, 'SINGLE')
    assert.equal(res.body.data.comparisonEnabled, false)
  })

  await t.test('Case 2+: 2+ available hospitals enables comparison', async () => {
    const res = await request(app).get(`/api/public/treatments/${t2.slug}`).expect(200)
    assert.equal(res.body.data.availableHospitalCount, 2)
    assert.equal(res.body.data.state, 'COMPARABLE')
    assert.equal(res.body.data.comparisonEnabled, true)
  })
})

test('9. Cost Calculator Endpoints', async (t) => {
  const u = await prisma.user.create({ data: { email: `cost-u-${Date.now()}@example.com`, passwordHash: 'h', role: 'HOSPITAL' } })
  const h = await prisma.hospital.create({ data: { userId: u.id, name: `Cost Hosp ${Date.now()}`, slug: `cost-hosp-${Date.now()}`, city: 'C', status: 'VERIFIED' } })
  const s = await prisma.specialty.create({ data: { name: `Cost Spec ${Date.now()}` } })
  const tr = await prisma.treatment.create({ data: { name: `Cost Tr ${Date.now()}`, slug: `cost-tr-${Date.now()}`, specialtyId: s.id } })

  await prisma.hospitalTreatment.create({ data: { hospitalId: h.id, treatmentId: tr.id, minEstimatedCost: 50000, maxEstimatedCost: 70000, consultationEstimate: 5000, approvalStatus: 'APPROVED', availability: 'AVAILABLE' } })

  await t.test('Valid calculation calculates minimum & maximum total including consultation', async () => {
    const res = await request(app).get(`/api/public/cost-estimate?treatmentId=${tr.id}&hospitalId=${h.id}`).expect(200)
    assert.equal(res.body.success, true)
    assert.equal(res.body.data.minimumEstimatedTotal, 55000)
    assert.equal(res.body.data.maximumEstimatedTotal, 75000)
    assert.ok(res.body.data.disclaimer.includes('Estimated cost only'))
  })

  await t.test('Invalid hospital/treatment combination returns 404', async () => {
    await request(app).get(`/api/public/cost-estimate?treatmentId=${tr.id}&hospitalId=invalid-hosp-id`).expect(404)
  })
})

test('10. End-to-End Real Workflow Journey', async () => {
  // 1. Hospital registers
  const regRes = await request(app).post('/api/hospitals/register').send({
    name: `Full Journey Hospital ${Date.now()}`,
    email: `fulljourney-hosp-${Date.now()}@example.com`,
    password: 'password123',
    phone: '9876543210',
    city: 'New Delhi',
    country: 'India',
    address: '123 Healthcare Way'
  }).expect(201)

  const hospUserId = regRes.body.data.id
  const hospital = await prisma.hospital.findUnique({ where: { userId: hospUserId } })

  // 2. Admin logs in & verifies hospital
  const adminUser = await prisma.user.create({ data: { email: `e2e-admin-${Date.now()}@example.com`, passwordHash: 'h', role: 'ADMIN' } })
  const tokenAdmin = getToken(adminUser.id, 'ADMIN')

  await request(app).patch(`/api/admin/hospitals/${hospital.id}/verify`).set('Authorization', `Bearer ${tokenAdmin}`).expect(200)

  // 3. Hospital logs in & adds treatment from catalog
  const tokenHosp = getToken(hospUserId, 'HOSPITAL')
  const specialty = await prisma.specialty.create({ data: { name: `Full Journey Spec ${Date.now()}` } })
  const treatment = await prisma.treatment.create({ data: { name: `Full Journey Treatment ${Date.now()}`, slug: `full-journey-tr-${Date.now()}`, specialtyId: specialty.id } })

  const addHtRes = await request(app).post('/api/hospitals/me/treatments').set('Authorization', `Bearer ${tokenHosp}`).send({
    treatmentId: treatment.id,
    minEstimatedCost: 400000,
    maxEstimatedCost: 600000,
    consultationEstimate: 10000,
    availability: 'AVAILABLE'
  }).expect(201)

  const htId = addHtRes.body.data.id

  // 4. Admin approves hospital treatment
  await request(app).patch(`/api/admin/hospital-treatments/${htId}/approve`).set('Authorization', `Bearer ${tokenAdmin}`).expect(200)

  // 5. Patient registers & searches treatment
  const patRegRes = await request(app).post('/api/auth/register').send({
    email: `fulljourney-patient-${Date.now()}@example.com`,
    password: 'password123',
    firstName: 'Jane',
    lastName: 'Doe',
    country: 'Kenya'
  }).expect(201)

  const patUserId = patRegRes.body.data.id
  const tokenPat = getToken(patUserId, 'PATIENT')

  const pubTrRes = await request(app).get(`/api/public/treatments/${treatment.slug}`).expect(200)
  assert.equal(pubTrRes.body.data.availableHospitalCount, 1)

  // 6. Patient creates case
  const createCaseRes = await request(app).post('/api/patient/cases').set('Authorization', `Bearer ${tokenPat}`).send({
    hospitalId: hospital.id,
    treatmentId: treatment.id,
    description: 'Looking for knee replacement schedule and plan.'
  }).expect(201)

  const caseId = createCaseRes.body.data.id

  // 7. Hospital receives case & sends response
  const hospCasesRes = await request(app).get('/api/hospital/cases').set('Authorization', `Bearer ${tokenHosp}`).expect(200)
  assert.ok(hospCasesRes.body.data.some(c => c.id === caseId))

  await request(app).post(`/api/hospital/cases/${caseId}/response`).set('Authorization', `Bearer ${tokenHosp}`).send({
    summary: 'Initial assessment completed.',
    recommendedNextStep: 'Schedule online consultation.',
    estimatedTreatmentCost: 450000,
    estimatedHospitalStay: '5 days'
  }).expect(201)

  // 8. Patient requests appointment
  const apptRes = await request(app).post(`/api/patient/cases/${caseId}/appointments`).set('Authorization', `Bearer ${tokenPat}`).send({
    preferredAt: new Date(Date.now() + 86400000).toISOString(),
    type: 'HOSPITAL_CONSULTATION',
    notes: 'Morning preferred'
  }).expect(201)

  const apptId = apptRes.body.data.id

  // 9. Hospital confirms appointment
  await request(app).patch(`/api/hospital/appointments/${apptId}`).set('Authorization', `Bearer ${tokenHosp}`).send({ status: 'CONFIRMED' }).expect(200)

  // 10. Complete case & patient submits review
  await request(app).patch(`/api/hospital/cases/${caseId}/status`).set('Authorization', `Bearer ${tokenHosp}`).send({ status: 'COMPLETED' }).expect(200)

  await request(app).post(`/api/patient/cases/${caseId}/review`).set('Authorization', `Bearer ${tokenPat}`).send({
    overallRating: 5,
    hospitalRating: 5,
    communicationRating: 5,
    treatmentExperience: 5,
    writtenReview: 'Excellent care and smooth experience.'
  }).expect(201)
})

test('11. Public Doctor Marketplace Audit', () => {
  // Audit test ensuring no public doctor routes exist in backend API definitions
  const publicDoctorRoutes = ['/api/public/doctors', '/api/public/doctors/search', '/api/public/compare/doctors']
  for (const route of publicDoctorRoutes) {
    const matched = app._router.stack.some(layer => layer.route && layer.route.path === route)
    assert.equal(matched, false, `Public doctor route ${route} must NOT exist.`)
  }
})
