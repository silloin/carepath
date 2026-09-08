import test from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { app } from '../src/server.js'
import { PrismaClient } from '@prisma/client'
import { signUser } from '../src/middleware/auth.js'

const prisma = new PrismaClient()

// Helper to create authenticated requests
const getAuthToken = (role) => {
  const user = { id: `test-user-${role.toLowerCase()}`, role }
  return signUser(user)
}

const adminToken = getAuthToken('ADMIN')
const hospitalToken = getAuthToken('HOSPITAL')
const patientToken = getAuthToken('PATIENT')

// Helper to create a hospital treatment for testing
async function createTestHospitalTreatment(status = 'PENDING') {
  const user = await prisma.user.create({
    data: {
      email: `test-hospital-user-${Date.now()}@example.com`,
      passwordHash: 'hashedpassword',
      role: 'HOSPITAL'
    }
  })
  const hospital = await prisma.hospital.create({
    data: {
      userId: user.id,
      name: `Test Hospital ${Date.now()}`,
      slug: `test-hospital-${Date.now()}`,
      city: 'Test City',
      status: 'VERIFIED',
      verification: { create: { status: 'VERIFIED' } }
    }
  })
  const specialty = await prisma.specialty.create({ data: { name: `Test Specialty ${Date.now()}` } })
  const treatment = await prisma.treatment.create({
    data: {
      name: `Test Treatment ${Date.now()}`,
      slug: `test-treatment-${Date.now()}`,
      specialtyId: specialty.id
    }
  })
  return prisma.hospitalTreatment.create({
    data: {
      hospitalId: hospital.id,
      treatmentId: treatment.id,
      minEstimatedCost: 1000,
      maxEstimatedCost: 2000,
      approvalStatus: status,
      availability: 'AVAILABLE',
      hospitalStay: '1-2 days',
      recoveryEstimate: '1 week',
      consultationEstimate: 100
    },
    include: {
      hospital: true,
      treatment: true
    }
  })
}

test('Admin moderation endpoints authorization', async (t) => {
  await t.test('ADMIN can access admin hospital-treatments', async () => {
    const response = await request(app)
      .get('/api/admin/hospital-treatments')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
    assert.equal(response.body.success, true)
  })

  await t.test('HOSPITAL cannot access admin hospital-treatments', async () => {
    await request(app)
      .get('/api/admin/hospital-treatments')
      .set('Authorization', `Bearer ${hospitalToken}`)
      .expect(403)
  })

  await t.test('PATIENT cannot access admin hospital-treatments', async () => {
    await request(app)
      .get('/api/admin/hospital-treatments')
      .set('Authorization', `Bearer ${patientToken}`)
      .expect(403)
  })

  await t.test('Unauthenticated user cannot access admin hospital-treatments', async () => {
    await request(app)
      .get('/api/admin/hospital-treatments')
      .expect(401)
  })
})

test('Admin can view hospital treatments with filters', async (t) => {
  const ht1 = await createTestHospitalTreatment('PENDING')
  const ht2 = await createTestHospitalTreatment('APPROVED')

  await t.test('Admin can get all hospital treatments', async () => {
    const response = await request(app)
      .get('/api/admin/hospital-treatments')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
    assert.equal(response.body.success, true)
    assert.ok(response.body.data.length >= 2) // Should contain at least the two created
  })

  await t.test('Admin can filter by approvalStatus', async () => {
    const response = await request(app)
      .get('/api/admin/hospital-treatments?approvalStatus=PENDING')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
    assert.equal(response.body.success, true)
    assert.ok(response.body.data.some(ht => ht.id === ht1.id))
    assert.ok(response.body.data.every(ht => ht.approvalStatus === 'PENDING'))
  })

  await t.test('Admin can filter by hospitalId', async () => {
    const response = await request(app)
      .get(`/api/admin/hospital-treatments?hospitalId=${ht2.hospitalId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
    assert.equal(response.body.success, true)
    assert.ok(response.body.data.some(ht => ht.id === ht2.id))
    assert.ok(response.body.data.every(ht => ht.hospitalId === ht2.hospitalId))
  })

  await t.test('Admin can filter by treatmentId', async () => {
    const response = await request(app)
      .get(`/api/admin/hospital-treatments?treatmentId=${ht1.treatmentId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
    assert.equal(response.body.success, true)
    assert.ok(response.body.data.some(ht => ht.id === ht1.id))
    assert.ok(response.body.data.every(ht => ht.treatmentId === ht1.treatmentId))
  })
})

test('Admin can approve and reject hospital treatments', async (t) => {
  const htToApprove = await createTestHospitalTreatment('PENDING')
  const htToReject = await createTestHospitalTreatment('PENDING')

  await t.test('Admin can approve a hospital treatment', async () => {
    const response = await request(app)
      .patch(`/api/admin/hospital-treatments/${htToApprove.id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
    assert.equal(response.body.success, true)
    assert.equal(response.body.data.approvalStatus, 'APPROVED')

    const updatedHt = await prisma.hospitalTreatment.findUnique({ where: { id: htToApprove.id } })
    assert.equal(updatedHt.approvalStatus, 'APPROVED')
  })

  await t.test('Admin can reject a hospital treatment', async () => {
    const response = await request(app)
      .patch(`/api/admin/hospital-treatments/${htToReject.id}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
    assert.equal(response.body.success, true)
    assert.equal(response.body.data.approvalStatus, 'REJECTED')

    const updatedHt = await prisma.hospitalTreatment.findUnique({ where: { id: htToReject.id } })
    assert.equal(updatedHt.approvalStatus, 'REJECTED')
  })
})

test('Public APIs do not expose unapproved or rejected hospital-treatment records', async (t) => {
  const approvedHt = await createTestHospitalTreatment('APPROVED')
  const pendingHt = await createTestHospitalTreatment('PENDING')
  const rejectedHt = await createTestHospitalTreatment('REJECTED')

  await t.test('Public hospitals API filters out unapproved/rejected treatments', async () => {
    const response = await request(app)
      .get(`/api/public/hospitals/${approvedHt.hospital.slug}`)
      .expect(200)
    assert.equal(response.body.success, true)
    const hospital = response.body.data
    assert.ok(hospital.treatments.some(t => t.id === approvedHt.id))
    assert.ok(hospital.treatments.every(t => t.id !== pendingHt.id && t.id !== rejectedHt.id))
  })

  await t.test('Public treatment API filters out unapproved/rejected hospital-treatments', async () => {
    const response = await request(app)
      .get(`/api/public/treatments/${approvedHt.treatment.slug}`)
      .expect(200)
    assert.equal(response.body.success, true)
    const treatment = response.body.data
    assert.ok(treatment.hospitals.some(h => h.id === approvedHt.id))
    assert.ok(treatment.hospitals.every(h => h.id !== pendingHt.id && h.id !== rejectedHt.id))
  })
})

test('Public visibility rule: VERIFIED hospital + APPROVED HospitalTreatment + AVAILABLE status = Public verified treatment provider', async (t) => {
  const user = await prisma.user.create({
    data: {
      email: `rule-hospital-user-${Date.now()}@example.com`,
      passwordHash: 'hashedpassword',
      role: 'HOSPITAL'
    }
  })
  const hospital = await prisma.hospital.create({
    data: {
      userId: user.id,
      name: `Rule Hospital ${Date.now()}`,
      slug: `rule-hospital-${Date.now()}`,
      city: 'Rule City',
      status: 'VERIFIED',
      verification: { create: { status: 'VERIFIED' } }
    }
  })
  const specialty = await prisma.specialty.create({ data: { name: `Rule Specialty ${Date.now()}` } })
  const treatment = await prisma.treatment.create({
    data: {
      name: `Rule Treatment ${Date.now()}`,
      slug: `rule-treatment-${Date.now()}`,
      specialtyId: specialty.id
    }
  })

  const baseData = {
    hospitalId: hospital.id,
    treatmentId: treatment.id,
    minEstimatedCost: 100,
    maxEstimatedCost: 200,
    hospitalStay: '1 day',
    recoveryEstimate: '1 day',
    consultationEstimate: 10
  }

  await t.test('Fully compliant record is public', async () => {
    const treatmentForTest = await prisma.treatment.create({ data: { name: `Test Treatment ${Date.now()}-compliant`, slug: `test-treatment-${Date.now()}-compliant`, specialtyId: specialty.id } })
    const ht = await prisma.hospitalTreatment.create({
      data: { ...baseData, treatmentId: treatmentForTest.id, approvalStatus: 'APPROVED', availability: 'AVAILABLE' }
    })
    const response = await request(app)
      .get(`/api/public/treatments/${treatmentForTest.slug}`)
      .expect(200)
    assert.equal(response.body.success, true)
    assert.ok(response.body.data.hospitals.some(h => h.id === ht.id))
  })

  await t.test('PENDING record is not public', async () => {
    const treatmentForTest = await prisma.treatment.create({ data: { name: `Test Treatment ${Date.now()}-pending`, slug: `test-treatment-${Date.now()}-pending`, specialtyId: specialty.id } })
    const ht = await prisma.hospitalTreatment.create({
      data: { ...baseData, treatmentId: treatmentForTest.id, approvalStatus: 'PENDING', availability: 'AVAILABLE' }
    })
    const response = await request(app)
      .get(`/api/public/treatments/${treatmentForTest.slug}`)
      .expect(200)
    assert.equal(response.body.success, true)
    assert.ok(response.body.data.hospitals.every(h => h.id !== ht.id))
  })

  await t.test('REJECTED record is not public', async () => {
    const treatmentForTest = await prisma.treatment.create({ data: { name: `Test Treatment ${Date.now()}-rejected`, slug: `test-treatment-${Date.now()}-rejected`, specialtyId: specialty.id } })
    const ht = await prisma.hospitalTreatment.create({
      data: { ...baseData, treatmentId: treatmentForTest.id, approvalStatus: 'REJECTED', availability: 'AVAILABLE' }
    })
    const response = await request(app)
      .get(`/api/public/treatments/${treatmentForTest.slug}`)
      .expect(200)
    assert.equal(response.body.success, true)
    assert.ok(response.body.data.hospitals.every(h => h.id !== ht.id))
  })

  await t.test('UNAVAILABLE record is not public', async () => {
    const treatmentForTest = await prisma.treatment.create({ data: { name: `Test Treatment ${Date.now()}-unavailable`, slug: `test-treatment-${Date.now()}-unavailable`, specialtyId: specialty.id } })
    const ht = await prisma.hospitalTreatment.create({
      data: { ...baseData, treatmentId: treatmentForTest.id, approvalStatus: 'APPROVED', availability: 'TEMPORARILY_UNAVAILABLE' }
    })
    const response = await request(app)
      .get(`/api/public/treatments/${treatmentForTest.slug}`)
      .expect(200)
    assert.equal(response.body.success, true)
    assert.ok(response.body.data.hospitals.every(h => h.id !== ht.id))
  })

  await t.test('Hospital with SUSPENDED status is not public', async () => {
    const suspendedHospitalUser = await prisma.user.create({
      data: {
        email: `suspended-hospital-user-${Date.now()}@example.com`,
        passwordHash: 'hashedpassword',
        role: 'HOSPITAL'
      }
    })
    const suspendedHospital = await prisma.hospital.create({
      data: {
        userId: suspendedHospitalUser.id,
        name: `Suspended Hospital ${Date.now()}`,
        slug: `suspended-hospital-${Date.now()}`,
        city: 'Suspended City',
        status: 'SUSPENDED',
        verification: { create: { status: 'VERIFIED' } }
      }
    })
    const treatmentForTest = await prisma.treatment.create({ data: { name: `Test Treatment ${Date.now()}-suspended`, slug: `test-treatment-${Date.now()}-suspended`, specialtyId: specialty.id } })
    const ht = await prisma.hospitalTreatment.create({
      data: { ...baseData, hospitalId: suspendedHospital.id, treatmentId: treatmentForTest.id, approvalStatus: 'APPROVED', availability: 'AVAILABLE' }
    })
    const response = await request(app)
      .get(`/api/public/treatments/${treatmentForTest.slug}`)
      .expect(200)
    assert.equal(response.body.success, true)
    assert.ok(response.body.data.hospitals.every(h => h.id !== ht.id))
  })
})

test('Hospital availability states (0, 1, 2+ available hospitals)', async (t) => {
  const specialty = await prisma.specialty.create({ data: { name: `Availability Specialty ${Date.now()}` } })
  const treatment0 = await prisma.treatment.create({ data: { name: `Treatment 0 Hospitals ${Date.now()}`, slug: `treatment-0-${Date.now()}`, specialtyId: specialty.id } })
  const treatment1 = await prisma.treatment.create({ data: { name: `Treatment 1 Hospital ${Date.now()}`, slug: `treatment-1-${Date.now()}`, specialtyId: specialty.id } })
  const treatment2 = await prisma.treatment.create({ data: { name: `Treatment 2 Hospitals ${Date.now()}`, slug: `treatment-2-${Date.now()}`, specialtyId: specialty.id } })

  const user1 = await prisma.user.create({
    data: {
      email: `avail-user-1-${Date.now()}@example.com`,
      passwordHash: 'hashedpassword',
      role: 'HOSPITAL'
    }
  })
  const user2 = await prisma.user.create({
    data: {
      email: `avail-user-2-${Date.now()}@example.com`,
      passwordHash: 'hashedpassword',
      role: 'HOSPITAL'
    }
  })

  const hospital1 = await prisma.hospital.create({
    data: {
      userId: user1.id,
      name: `Avail Hospital 1 ${Date.now()}`,
      slug: `avail-hospital-1-${Date.now()}`,
      city: 'Avail City',
      status: 'VERIFIED',
      verification: { create: { status: 'VERIFIED' } }
    }
  })
  const hospital2 = await prisma.hospital.create({
    data: {
      userId: user2.id,
      name: `Avail Hospital 2 ${Date.now()}`,
      slug: `avail-hospital-2-${Date.now()}`,
      city: 'Avail City',
      status: 'VERIFIED',
      verification: { create: { status: 'VERIFIED' } }
    }
  })

  // 1 available hospital for treatment1
  await prisma.hospitalTreatment.create({
    data: {
      hospitalId: hospital1.id,
      treatmentId: treatment1.id,
      minEstimatedCost: 100, maxEstimatedCost: 200, approvalStatus: 'APPROVED', availability: 'AVAILABLE',
      hospitalStay: '1 day', recoveryEstimate: '1 day', consultationEstimate: 10
    }
  })

  // 2 available hospitals for treatment2
  await prisma.hospitalTreatment.create({
    data: {
      hospitalId: hospital1.id,
      treatmentId: treatment2.id,
      minEstimatedCost: 100, maxEstimatedCost: 200, approvalStatus: 'APPROVED', availability: 'AVAILABLE',
      hospitalStay: '1 day', recoveryEstimate: '1 day', consultationEstimate: 10
    }
  })
  await prisma.hospitalTreatment.create({
    data: {
      hospitalId: hospital2.id,
      treatmentId: treatment2.id,
      minEstimatedCost: 100, maxEstimatedCost: 200, approvalStatus: 'APPROVED', availability: 'AVAILABLE',
      hospitalStay: '1 day', recoveryEstimate: '1 day', consultationEstimate: 10
    }
  })

  await t.test('0 available hospitals -> unavailable state', async () => {
    const response = await request(app)
      .get(`/api/public/treatments/${treatment0.slug}`)
      .expect(200)
    assert.equal(response.body.success, true)
    assert.equal(response.body.data.availableHospitalCount, 0)
    assert.equal(response.body.data.comparisonEnabled, false)
  })

  await t.test('1 available hospital -> single-provider state', async () => {
    const response = await request(app)
      .get(`/api/public/treatments/${treatment1.slug}`)
      .expect(200)
    assert.equal(response.body.success, true)
    assert.equal(response.body.data.availableHospitalCount, 1)
    assert.equal(response.body.data.comparisonEnabled, false)
  })

  await t.test('2+ available hospitals -> comparison can be enabled', async () => {
    const response = await request(app)
      .get(`/api/public/treatments/${treatment2.slug}`)
      .expect(200)
    assert.equal(response.body.success, true)
    assert.equal(response.body.data.availableHospitalCount, 2)
    assert.equal(response.body.data.comparisonEnabled, true) // This is based on the backend logic, not UI
  })
})

// Cleanup after all tests
test.after(async () => {
  await prisma.$disconnect()
})