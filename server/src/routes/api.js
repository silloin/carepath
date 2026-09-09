import { Router } from 'express'

import bcrypt from 'bcryptjs'

import multer from 'multer'

import { mkdir, readFile, writeFile, unlink } from 'node:fs/promises'

import { join } from 'node:path'

import { randomUUID } from 'node:crypto'

import { z } from 'zod'

import { prisma } from '../config/db.js'

import { requireAuth, requireRole, signUser } from '../middleware/auth.js'

import { providerState } from '../utils/provider-state.js'

import { approvedAvailableProviderWhere } from '../utils/marketplace.js'



const router = Router()

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: Number(process.env.UPLOAD_MAX_MB || 10) * 1024 * 1024 }, fileFilter: (_request, file, callback) => callback(null, ['application/pdf', 'image/jpeg', 'image/png'].includes(file.mimetype)) })

const authSchema = z.object({ email: z.string().email(), password: z.string().min(8) })

const hospitalRegistrationSchema = authSchema.extend({ name: z.string().min(2), phone: z.string().min(6), city: z.string().min(2), country: z.string().min(2).default('India'), state: z.string().optional(), address: z.string().min(5), website: z.string().url().optional().or(z.literal('')), hospitalType: z.string().optional(), beds: z.coerce.number().int().positive().optional(), icuBeds: z.coerce.number().int().nonnegative().optional(), description: z.string().optional(), internationalSupport: z.boolean().optional(), languages: z.string().optional() })

const emptyToNull = (value) => (value === '' ? null : value);

const adminHospitalCreationSchema = z.object({

  name: z.string().min(2),

  email: z.string().email(),

  password: z.string().min(8).optional().or(z.literal('')).transform(emptyToNull),

  confirmPassword: z.string().min(8).optional().or(z.literal('')).transform(emptyToNull),

  phone: z.string().min(6).optional().or(z.literal('')).transform(emptyToNull),

  city: z.string().min(2),

  country: z.string().min(2).default('India'),

  state: z.string().optional().or(z.literal('')).transform(emptyToNull),

  address: z.string().min(5).optional().or(z.literal('')).transform(emptyToNull),

  website: z.string().url().optional().or(z.literal('')).transform(emptyToNull),

  hospitalType: z.string().optional().or(z.literal('')).transform(emptyToNull),

  beds: z.union([z.coerce.number().int().positive(), z.literal('')]).optional().transform(emptyToNull),

  icuBeds: z.union([z.coerce.number().int().nonnegative(), z.literal('')]).optional().transform(emptyToNull),

  description: z.string().optional().or(z.literal('')).transform(emptyToNull),

  internationalSupport: z.boolean().optional(),

  languages: z.string().optional().or(z.literal('')).transform(emptyToNull),

}).superRefine((input, ctx) => {

  if (input.password && !input.confirmPassword) {

    ctx.addIssue({ code: 'custom', path: ['confirmPassword'], message: 'Confirm password is required when setting a password.' });

  }

  if (!input.password && input.confirmPassword) {

    ctx.addIssue({ code: 'custom', path: ['password'], message: 'Password is required when confirming a password.' });

  }

  if (input.password && input.confirmPassword && input.password !== input.confirmPassword) {

    ctx.addIssue({ code: 'custom', path: ['confirmPassword'], message: 'Passwords do not match.' });

  }

});

const patientRegistrationSchema = authSchema.extend({ firstName: z.string().min(2), lastName: z.string().min(2), country: z.string().optional() })



const success = (response, message, data, status = 200) => response.status(status).json({ success: true, message, data })

const failure = (response, message, status = 400, error = {}) => response.status(status).json({ success: false, message, error })

const publicHospitalWhere = { status: 'VERIFIED', treatments: { some: { availability: 'AVAILABLE' } } }

const verifiedHospitalWhere = { status: 'VERIFIED' }



async function getTreatmentHospitals(treatmentId, sort = 'recommended') {

  const orderBy = sort === 'lowest-cost' ? { minEstimatedCost: 'asc' } : sort === 'highest-cost' ? { maxEstimatedCost: 'desc' } : sort === 'shortest-stay' ? { hospitalStay: 'asc' } : { updatedAt: 'desc' }

  return prisma.hospitalTreatment.findMany({ where: { treatmentId, ...approvedAvailableProviderWhere }, include: { hospital: true, treatment: true }, orderBy })

}



router.post('/auth/register', async (request, response, next) => {

  try {

    const input = patientRegistrationSchema.parse(request.body)

    const passwordHash = await bcrypt.hash(input.password, 12)

    const user = await prisma.user.create({ data: { email: input.email.toLowerCase(), passwordHash, role: 'PATIENT', patient: { create: { firstName: input.firstName, lastName: input.lastName, country: input.country } } } })

    response.cookie('carepath_token', signUser(user), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 * 1000 })

    return success(response, 'Account created', { id: user.id, role: user.role }, 201)

  } catch (error) { return next(error) }

})



router.post('/hospitals/register', async (request, response, next) => {

  return failure(response, 'Only administrators can create hospital accounts.', 403);

});



router.post('/auth/login', async (request, response, next) => {

  try {

    const input = authSchema.parse(request.body)

    const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } })

    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) return failure(response, 'Invalid email or password', 401)

    response.cookie('carepath_token', signUser(user), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 * 1000 })

    return success(response, 'Signed in', { id: user.id, role: user.role, mustChangePassword: user.mustChangePassword })

  } catch (error) { return next(error) }

})



router.patch('/auth/change-password', requireAuth, async (request, response, next) => {

  try {

    const input = z.object({

      currentPassword: z.string(),

      newPassword: z.string().min(8, 'Password must be at least 8 characters long'),

    }).parse(request.body);



    const user = await prisma.user.findUnique({ where: { id: request.user.id } });



    if (!user || !(await bcrypt.compare(input.currentPassword, user.passwordHash))) {

      return failure(response, 'Invalid current password', 401);

    }



    const newPasswordHash = await bcrypt.hash(input.newPassword, 12);



    await prisma.user.update({

      where: { id: request.user.id },

      data: {

        passwordHash: newPasswordHash,

        mustChangePassword: false,

      },

    });



    return success(response, 'Password changed successfully');

  } catch (error) {

    return next(error);

  }

});



router.post('/auth/logout', (_request, response) => { response.clearCookie('carepath_token'); return success(response, 'Signed out', null) })

router.get('/auth/me', requireAuth, async (request, response, next) => { try { const user = await prisma.user.findUnique({ where: { id: request.auth.sub }, include: { patient: true, hospital: true } }); return success(response, 'Session loaded', user) } catch (error) { return next(error) } })



router.get('/public/treatments', async (request, response, next) => {

  try {

    const search = String(request.query.search || '')

    const treatments = await prisma.treatment.findMany({ where: search ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { specialty: { name: { contains: search, mode: 'insensitive' } } }] } : undefined, include: { specialty: true, hospitals: { where: approvedAvailableProviderWhere, include: { hospital: true } } }, orderBy: { name: 'asc' } })

    return success(response, 'Treatments loaded', treatments.map(({ hospitals, ...treatment }) => ({ ...treatment, hospitals, hospitalCount: hospitals.length })))

  } catch (error) { return next(error) }

})



router.get('/public/treatments/:slug', async (request, response, next) => {

  try {

    const treatment = await prisma.treatment.findUnique({ where: { slug: request.params.slug }, include: { specialty: true, hospitals: { where: approvedAvailableProviderWhere, include: { hospital: { include: { verification: true } } } } } })

    if (!treatment) return failure(response, 'Treatment not found', 404)

    const providers = treatment.hospitals.map(({ hospital, ...entry }) => ({ ...entry, hospital }))

    return success(response, 'Treatment loaded', { ...treatment, hospitals: providers, availableHospitalCount: providers.length, ...providerState(providers.length) })

  } catch (error) { return next(error) }

})



router.get('/public/hospitals', async (request, response, next) => {

  try {

    const city = String(request.query.city || '')

    const search = String(request.query.search || '')

    const specialtyId = String(request.query.specialtyId || '')

    const treatmentId = String(request.query.treatmentId || '')

    const availability = String(request.query.availability || 'AVAILABLE')

    const hospitals = await prisma.hospital.findMany({ where: { status: 'VERIFIED', ...(city ? { city: { equals: city, mode: 'insensitive' } } : {}), ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}), ...(request.query.accreditation ? { accreditation: { contains: String(request.query.accreditation), mode: 'insensitive' } } : {}), treatments: { some: { approvalStatus: 'APPROVED', ...(availability ? { availability } : {}), ...(treatmentId ? { treatmentId } : {}), ...(specialtyId ? { treatment: { specialtyId } } : {}) } } }, include: { treatments: { where: { approvalStatus: 'APPROVED', ...(availability ? { availability } : {}) }, include: { treatment: { include: { specialty: true } } } }, verification: true }, orderBy: { name: 'asc' } })

    return success(response, 'Hospitals loaded', hospitals)

  } catch (error) { return next(error) }

})



router.get('/public/hospitals/:slug', async (request, response, next) => {

  try { const hospital = await prisma.hospital.findFirst({ where: { slug: request.params.slug, status: 'VERIFIED' }, include: { treatments: { where: { approvalStatus: 'APPROVED', availability: 'AVAILABLE' }, include: { treatment: { include: { specialty: true } } } }, verification: true } }); if (!hospital) return failure(response, 'Hospital not found', 404); return success(response, 'Hospital loaded', hospital) } catch (error) { return next(error) }

})



router.get('/specialties', async (_request, response, next) => { try { return success(response, 'Specialties loaded', await prisma.specialty.findMany({ include: { _count: { select: { treatments: true } } }, orderBy: { name: 'asc' } })) } catch (error) { return next(error) } })

router.get('/treatments', async (_request, response, next) => { try { return success(response, 'Treatment catalog loaded', await prisma.treatment.findMany({ include: { specialty: true }, orderBy: { name: 'asc' } })) } catch (error) { return next(error) } })

router.post('/specialties', requireAuth, requireRole('ADMIN'), async (request, response, next) => { try { const input = z.object({ name: z.string().min(2).max(80) }).parse(request.body); return success(response, 'Specialty created', await prisma.specialty.create({ data: { name: input.name.trim() } }), 201) } catch (error) { return next(error) } })

router.post('/treatments', requireAuth, requireRole('ADMIN'), async (request, response, next) => { try { const input = z.object({ name: z.string().min(2).max(120), slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), specialtyId: z.string(), description: z.string().max(5000).optional() }).parse(request.body); return success(response, 'Treatment created', await prisma.treatment.create({ data: input, include: { specialty: true } }), 201) } catch (error) { return next(error) } })



router.get('/public/compare/hospitals', async (request, response, next) => {

  try {

    const treatmentId = String(request.query.treatmentId || '')

    if (!treatmentId) return failure(response, 'treatmentId is required')

    const sort = String(request.query.sort || 'recommended')

    const hospitals = await getTreatmentHospitals(treatmentId, sort)

    return success(response, 'Comparison loaded', { treatment: hospitals[0]?.treatment ?? null, hospitals, availableHospitalCount: hospitals.length, ...providerState(hospitals.length) })

  } catch (error) { return next(error) }

})



router.get('/public/cost-estimate', async (request, response, next) => { try { const treatmentId = String(request.query.treatmentId || ''); const hospitalId = String(request.query.hospitalId || ''); if (!treatmentId || !hospitalId) return failure(response, 'treatmentId and hospitalId are required'); const provider = await prisma.hospitalTreatment.findFirst({ where: { treatmentId, hospitalId, ...approvedAvailableProviderWhere }, include: { treatment: true, hospital: true } }); if (!provider) return failure(response, 'No verified hospital offers this treatment', 404); const consultation = Number(provider.consultationEstimate || 0); const min = Number(provider.minEstimatedCost || 0) + consultation; const max = Number(provider.maxEstimatedCost || provider.minEstimatedCost || 0) + consultation; return success(response, 'Cost estimate calculated', { treatment: provider.treatment, hospital: provider.hospital, hospitalTreatment: provider, consultationEstimate: consultation, minimumEstimatedTotal: min, maximumEstimatedTotal: max, disclaimer: "Estimated cost only. Final cost depends on medical assessment and the hospital's final quotation." }) } catch (error) { return next(error) } })



router.get('/hospitals/me', requireAuth, requireRole('HOSPITAL'), async (request, response, next) => { try { const hospital = await prisma.hospital.findUnique({ where: { userId: request.auth.sub }, include: { verification: true, treatments: { include: { treatment: true } } } }); return success(response, 'Hospital profile loaded', hospital) } catch (error) { return next(error) } })

router.get('/hospitals/me/treatments', requireAuth, requireRole('HOSPITAL'), async (request, response, next) => { try { const hospital = await prisma.hospital.findUnique({ where: { userId: request.auth.sub } }); return success(response, 'Hospital treatments loaded', await prisma.hospitalTreatment.findMany({ where: { hospitalId: hospital.id }, include: { treatment: { include: { specialty: true } } }, orderBy: { updatedAt: 'desc' } })) } catch (error) { return next(error) } })

router.put('/hospitals/me', requireAuth, requireRole('HOSPITAL'), async (request, response, next) => { try { const input = z.object({ name: z.string().min(2).optional(), phone: z.string().min(6).optional(), country: z.string().min(2).optional(), state: z.string().optional(), city: z.string().min(2).optional(), address: z.string().min(5).optional(), website: z.string().url().optional().or(z.literal('')), hospitalType: z.string().optional(), beds: z.coerce.number().int().positive().optional(), icuBeds: z.coerce.number().int().nonnegative().optional(), description: z.string().optional(), internationalSupport: z.boolean().optional(), languages: z.string().optional(), facilities: z.string().optional(), accreditation: z.string().optional() }).parse(request.body); const hospital = await prisma.hospital.update({ where: { userId: request.auth.sub }, data: { ...input, website: input.website || null } }); return success(response, 'Hospital profile updated', hospital) } catch (error) { return next(error) } })

router.post('/hospitals/me/treatments', requireAuth, requireRole('HOSPITAL'), async (request, response, next) => { try { const hospital = await prisma.hospital.findUnique({ where: { userId: request.auth.sub } }); if (!hospital) return failure(response, 'Hospital profile not found', 404); const input = z.object({ treatmentId: z.string(), minEstimatedCost: z.coerce.number().nonnegative().optional(), maxEstimatedCost: z.coerce.number().nonnegative().optional(), currency: z.string().length(3).default('INR'), hospitalStay: z.string().optional(), recoveryEstimate: z.string().optional(), consultationEstimate: z.coerce.number().nonnegative().optional(), availability: z.enum(['AVAILABLE', 'TEMPORARILY_UNAVAILABLE', 'NOT_OFFERED', 'COMING_SOON']).default('AVAILABLE'), inclusions: z.string().optional(), exclusions: z.string().optional() }).parse(request.body); const existing = await prisma.hospitalTreatment.findUnique({ where: { hospitalId_treatmentId: { hospitalId: hospital.id, treatmentId: input.treatmentId } } }); if (existing) return failure(response, 'This treatment is already associated with your hospital', 400); const entry = await prisma.hospitalTreatment.create({ data: { ...input, hospitalId: hospital.id, approvalStatus: 'PENDING' } }); return success(response, 'Treatment submitted for admin approval', entry, 201) } catch (error) { return next(error) } })

router.put('/hospitals/me/treatments/:id', requireAuth, requireRole('HOSPITAL'), async (request, response, next) => { try { const hospital = await prisma.hospital.findUnique({ where: { userId: request.auth.sub } }); const input = z.object({ minEstimatedCost: z.coerce.number().nonnegative().optional(), maxEstimatedCost: z.coerce.number().nonnegative().optional(), currency: z.string().length(3).optional(), hospitalStay: z.string().optional(), recoveryEstimate: z.string().optional(), consultationEstimate: z.coerce.number().nonnegative().optional(), availability: z.enum(['AVAILABLE', 'TEMPORARILY_UNAVAILABLE', 'NOT_OFFERED', 'COMING_SOON']).optional(), inclusions: z.string().optional(), exclusions: z.string().optional() }).parse(request.body); const owned = await prisma.hospitalTreatment.findFirst({ where: { id: request.params.id, hospitalId: hospital.id } }); if (!owned) return failure(response, 'Treatment record not found', 404); return success(response, 'Treatment updated', await prisma.hospitalTreatment.update({ where: { id: owned.id }, data: input })) } catch (error) { return next(error) } })

router.delete('/hospitals/me/treatments/:id', requireAuth, requireRole('HOSPITAL'), async (request, response, next) => { try { const hospital = await prisma.hospital.findUnique({ where: { userId: request.auth.sub } }); const owned = await prisma.hospitalTreatment.findFirst({ where: { id: request.params.id, hospitalId: hospital.id } }); if (!owned) return failure(response, 'Treatment record not found', 404); await prisma.hospitalTreatment.delete({ where: { id: owned.id } }); return success(response, 'Treatment removed', null) } catch (error) { return next(error) } })

router.patch('/hospitals/me/treatments/:id/status', requireAuth, requireRole('HOSPITAL'), async (request, response, next) => { try { const hospital = await prisma.hospital.findUnique({ where: { userId: request.auth.sub } }); const input = z.object({ availability: z.enum(['AVAILABLE', 'TEMPORARILY_UNAVAILABLE', 'NOT_OFFERED', 'COMING_SOON']) }).parse(request.body); const owned = await prisma.hospitalTreatment.findFirst({ where: { id: request.params.id, hospitalId: hospital.id } }); if (!owned) return failure(response, 'Treatment record not found', 404); return success(response, 'Treatment availability updated', await prisma.hospitalTreatment.update({ where: { id: owned.id }, data: input })) } catch (error) { return next(error) } })



router.get('/patient/notifications', requireAuth, requireRole('PATIENT'), async (request, response, next) => { try { const notifications = await prisma.notification.findMany({ where: { userId: request.auth.sub }, orderBy: { createdAt: 'desc' }, take: 50 }); return success(response, 'Notifications loaded', notifications) } catch (error) { return next(error) } })

router.patch('/notifications/:id/read', requireAuth, async (request, response, next) => { try { const notification = await prisma.notification.updateMany({ where: { id: request.params.id, userId: request.auth.sub }, data: { readAt: new Date() } }); if (!notification.count) return failure(response, 'Notification not found', 404); return success(response, 'Notification marked as read', null) } catch (error) { return next(error) } })

router.get('/patient/cases/:id', requireAuth, requireRole('PATIENT'), async (request, response, next) => { try { const patient = await prisma.patient.findUnique({ where: { userId: request.auth.sub } }); const item = await prisma.patientCase.findFirst({ where: { id: request.params.id, patientId: patient.id }, include: { hospital: true, treatment: true, reports: true, responses: true, appointments: true, conversation: { include: { messages: { orderBy: { createdAt: 'asc' } } } } } }); if (!item) return failure(response, 'Case not found', 404); return success(response, 'Case loaded', item) } catch (error) { return next(error) } })

router.get('/hospital/cases/:id', requireAuth, requireRole('HOSPITAL'), async (request, response, next) => { try { const hospital = await prisma.hospital.findUnique({ where: { userId: request.auth.sub } }); const item = await prisma.patientCase.findFirst({ where: { id: request.params.id, hospitalId: hospital.id }, include: { patient: true, treatment: true, reports: true, responses: true, appointments: true, conversation: { include: { messages: { orderBy: { createdAt: 'asc' } } } } } }); if (!item) return failure(response, 'Case not found', 404); return success(response, 'Case loaded', item) } catch (error) { return next(error) } })

router.get('/patient/cases', requireAuth, requireRole('PATIENT'), async (request, response, next) => { try { const patient = await prisma.patient.findUnique({ where: { userId: request.auth.sub } }); const cases = await prisma.patientCase.findMany({ where: { patientId: patient.id }, include: { hospital: true, treatment: true, reports: true, responses: true, appointments: true, conversation: true }, orderBy: { createdAt: 'desc' } }); return success(response, 'Cases loaded', cases) } catch (error) { return next(error) } })



router.get('/admin/hospital-treatments', requireAuth, requireRole('ADMIN'), async (request, response, next) => {

  try {

    const { approvalStatus, status, hospitalId, treatmentId } = request.query;

    const targetStatus = approvalStatus || status;

    const where = {};



    if (targetStatus && ['PENDING', 'APPROVED', 'REJECTED'].includes(String(targetStatus))) {

      where.approvalStatus = String(targetStatus);

    }

    if (hospitalId) {

      where.hospitalId = String(hospitalId);

    }

    if (treatmentId) {

      where.treatmentId = String(treatmentId);

    }



    const hospitalTreatments = await prisma.hospitalTreatment.findMany({

      where,

      include: {

        hospital: true,

        treatment: true,

      },

      orderBy: {

        createdAt: 'desc',

      },

    });

    return success(response, 'Hospital treatments loaded', hospitalTreatments);

  } catch (error) {

    return next(error);

  }

});



router.patch('/admin/hospital-treatments/:id/approve', requireAuth, requireRole('ADMIN'), async (request, response, next) => {

  try {

    const { id } = request.params;

    const updatedTreatment = await prisma.hospitalTreatment.update({

      where: { id },

      data: { approvalStatus: 'APPROVED' },

      include: {

        hospital: true,

        treatment: true,

      },

    });

    return success(response, 'Hospital treatment approved', updatedTreatment);

  } catch (error) {

    return next(error);

  }

});



router.patch('/admin/hospital-treatments/:id/reject', requireAuth, requireRole('ADMIN'), async (request, response, next) => {

  try {

    const { id } = request.params;

    const updatedTreatment = await prisma.hospitalTreatment.update({

      where: { id },

      data: { approvalStatus: 'REJECTED' },

      include: {

        hospital: true,

        treatment: true,

      },

    });

    return success(response, 'Hospital treatment rejected', updatedTreatment);

  } catch (error) {

    return next(error);

  }

});



router.get('/admin/hospitals', requireAuth, requireRole('ADMIN'), async (request, response, next) => {

  try {

    const hospitals = await prisma.hospital.findMany({

      include: {

        user: { select: { email: true, mustChangePassword: true, createdAt: true } },

        verification: true,

      },

      orderBy: { user: { createdAt: 'desc' } },

    });

    return success(response, 'Hospitals loaded', hospitals);

  } catch (error) {

    return next(error);

  }

});



router.put('/admin/hospitals/:id', requireAuth, requireRole('ADMIN'), async (request, response, next) => {

  try {

    const input = z.object({

      name: z.string().min(2).optional(),

      phone: z.string().min(6).optional(),

      city: z.string().min(2).optional(),

      state: z.string().optional(),

      country: z.string().min(2).optional(),

      address: z.string().min(5).optional(),

      website: z.string().url().optional().or(z.literal('')),

      hospitalType: z.string().optional(),

      beds: z.coerce.number().int().positive().optional(),

      icuBeds: z.coerce.number().int().nonnegative().optional(),

      description: z.string().optional(),

      internationalSupport: z.boolean().optional(),

      languages: z.string().optional(),

      facilities: z.string().optional(),

      accreditation: z.string().optional(),

    }).parse(request.body);



    const hospital = await prisma.hospital.update({

      where: { id: request.params.id },

      data: { ...input, website: input.website || null },

    });



    return success(response, 'Hospital updated successfully', hospital);

  } catch (error) {

    return next(error);

  }

});



router.delete('/admin/hospitals/:id', requireAuth, requireRole('ADMIN'), async (request, response, next) => {

  try {

    const hospital = await prisma.hospital.findUnique({ where: { id: request.params.id } });

    if (!hospital) {

      return failure(response, 'Hospital not found', 404);

    }



    await prisma.user.delete({ where: { id: hospital.userId } });



    return success(response, 'Hospital deleted successfully');

  } catch (error) {

    return next(error);

  }

});



router.patch('/admin/hospitals/:id/status', requireAuth, requireRole('ADMIN'), async (request, response, next) => {

  try {

    const input = z.object({

      status: z.enum(['VERIFIED', 'PENDING_VERIFICATION', 'SUSPENDED']),

    }).parse(request.body);



    const hospital = await prisma.hospital.update({

      where: { id: request.params.id },

      data: {

        status: input.status,

        verification: {

          upsert: {

            create: { status: input.status, reviewedAt: new Date() },

            update: { status: input.status, reviewedAt: new Date() },

          },

        },

      },

    });



    return success(response, 'Hospital status updated successfully', hospital);

  } catch (error) {

    return next(error);

  }

});



router.patch('/admin/hospitals/:id/password', requireAuth, requireRole('ADMIN'), async (request, response, next) => {

  try {

    const { id } = request.params;

    const hospital = await prisma.hospital.findUnique({ where: { id } });

    if (!hospital) return failure(response, 'Hospital not found', 404);



    const temporaryPassword = Math.random().toString(36).slice(-10);

    const passwordHash = await bcrypt.hash(temporaryPassword, 12);



    await prisma.user.update({

      where: { id: hospital.userId },

      data: { passwordHash, mustChangePassword: true },

    });



    return success(response, 'Temporary password reset successfully', { hospital, temporaryPassword });

  } catch (error) {

    return next(error);

  }

});



router.delete('/admin/hospitals/:id', requireAuth, requireRole('ADMIN'), async (request, response, next) => {

  try {

    const { id } = request.params;

    const hospital = await prisma.hospital.findUnique({ where: { id } });

    if (!hospital) return failure(response, 'Hospital not found', 404);



    // Delete associated user first due to foreign key constraint

    await prisma.user.delete({ where: { id: hospital.userId } });

    await prisma.hospital.delete({ where: { id } });



    return success(response, 'Hospital deleted successfully');

  } catch (error) {

    return next(error);

  }

});



const adminHospitalUpdateSchema = z.object({

  name: z.string().min(2).optional(),

  email: z.string().email().optional(),

  city: z.string().min(2).optional(),

  country: z.string().min(2).optional(),

  description: z.string().optional(),

  status: z.enum(['PENDING_VERIFICATION', 'VERIFIED', 'REJECTED', 'SUSPENDED']).optional(),

});



router.put('/admin/hospitals/:id', requireAuth, requireRole('ADMIN'), async (request, response, next) => {

  try {

    const { id } = request.params;

    const input = adminHospitalUpdateSchema.parse(request.body);



    const hospital = await prisma.hospital.findUnique({ where: { id } });

    if (!hospital) return failure(response, 'Hospital not found', 404);



    if (input.email && input.email.toLowerCase() !== hospital.user.email) {
      const existingUser = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
      if (existingUser && existingUser.id !== hospital.userId) {
        console.log(`Email update conflict detected: ${input.email} exists with role: ${existingUser.role}, user ID: ${existingUser.id}`);
        return failure(response, 'A user with this email already exists.', 409);
      }

      await prisma.user.update({

        where: { id: hospital.userId },

        data: { email: input.email.toLowerCase() },

      });

    }



    const updatedHospital = await prisma.hospital.update({

      where: { id },

      data: {

        name: input.name,

        city: input.city,

        country: input.country,

        description: input.description,

        status: input.status,

      },

      include: { user: true },

    });



    return success(response, 'Hospital updated successfully', updatedHospital);

  } catch (error) {

    return next(error);

  }

});



router.post('/patient/cases', requireAuth, requireRole('PATIENT'), async (request, response, next) => { try { const patient = await prisma.patient.findUnique({ where: { userId: request.auth.sub } }); const input = z.object({ hospitalId: z.string(), treatmentId: z.string(), description: z.string().max(5000).optional() }).parse(request.body); const provider = await prisma.hospitalTreatment.findFirst({ where: { hospitalId: input.hospitalId, treatmentId: input.treatmentId, availability: 'AVAILABLE', approvalStatus: 'APPROVED', hospital: { status: 'VERIFIED' } } }); if (!provider) return failure(response, 'This hospital does not currently offer that treatment', 422); const newCase = await prisma.patientCase.create({ data: { ...input, patientId: patient.id, status: 'SUBMITTED', conversation: { create: { patientId: patient.id, hospitalId: input.hospitalId } } }, include: { hospital: true, treatment: true, conversation: true } }); await prisma.notification.create({ data: { userId: (await prisma.hospital.findUnique({ where: { id: input.hospitalId } })).userId, title: 'New patient case', body: 'A patient has submitted a case for your hospital.' } }); return success(response, 'Case submitted', newCase, 201) } catch (error) { return next(error) } })

router.post('/patient/cases/:id/appointments', requireAuth, requireRole('PATIENT'), async (request, response, next) => { try { const patient = await prisma.patient.findUnique({ where: { userId: request.auth.sub } }); const input = z.object({ preferredAt: z.coerce.date(), type: z.string().default('HOSPITAL_CONSULTATION'), notes: z.string().optional() }).parse(request.body); const ownedCase = await prisma.patientCase.findFirst({ where: { id: request.params.id, patientId: patient.id }, include: { hospital: true } }); if (!ownedCase) return failure(response, 'Case not found', 404); const startOfDay = new Date(input.preferredAt); startOfDay.setHours(0,0,0,0); const endOfDay = new Date(input.preferredAt); endOfDay.setHours(23,59,59,999); const existingAppointments = await prisma.appointment.count({ where: { caseId: ownedCase.id, preferredAt: { gte: startOfDay, lte: endOfDay } } }); if (existingAppointments >= 2) return failure(response, 'Maximum two appointments per day are allowed for this case', 422); const appointment = await prisma.appointment.create({ data: { caseId: ownedCase.id, ...input } }); await prisma.notification.create({ data: { userId: ownedCase.hospital.userId, title: 'Appointment requested', body: 'A patient has requested an appointment for an assigned case.' } }); return success(response, 'Appointment requested', appointment, 201) } catch (error) { return next(error) } })

router.post('/patient/cases/:id/reports', requireAuth, requireRole('PATIENT'), upload.single('report'), async (request, response, next) => { try { const patient = await prisma.patient.findUnique({ where: { userId: request.auth.sub } }); const ownedCase = await prisma.patientCase.findFirst({ where: { id: request.params.id, patientId: patient.id } }); if (!ownedCase) return failure(response, 'Case not found', 404); if (!request.file) return failure(response, 'A PDF, JPG, or PNG report is required', 422); const storageKey = `${randomUUID()}-${request.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`; const directory = join(process.cwd(), 'private-uploads'); await mkdir(directory, { recursive: true }); await writeFile(join(directory, storageKey), request.file.buffer); const report = await prisma.medicalReport.create({ data: { caseId: ownedCase.id, originalName: request.file.originalname, storageKey, mimeType: request.file.mimetype, size: request.file.size, category: String(request.body.category || 'OTHER') } }); return success(response, 'Report uploaded securely', report, 201) } catch (error) { return next(error) } })

router.get('/patient/cases/:caseId/reports/:reportId', requireAuth, requireRole('PATIENT'), async (request, response, next) => { try { const patient = await prisma.patient.findUnique({ where: { userId: request.auth.sub } }); const report = await prisma.medicalReport.findFirst({ where: { id: request.params.reportId, caseId: request.params.caseId, patientCase: { patientId: patient.id } } }); if (!report) return failure(response, 'Report not found', 404); const file = await readFile(join(process.cwd(), 'private-uploads', report.storageKey)); await prisma.documentAccessLog.create({ data: { reportId: report.id, userId: request.auth.sub, action: 'PATIENT_READ' } }); return response.type(report.mimeType).send(file) } catch (error) { return next(error) } })

router.get('/hospital/cases/:caseId/reports/:reportId', requireAuth, requireRole('HOSPITAL'), async (request, response, next) => { try { const hospital = await prisma.hospital.findUnique({ where: { userId: request.auth.sub } }); const report = await prisma.medicalReport.findFirst({ where: { id: request.params.reportId, caseId: request.params.caseId, patientCase: { hospitalId: hospital.id } } }); if (!report) return failure(response, 'Report not found', 404); const file = await readFile(join(process.cwd(), 'private-uploads', report.storageKey)); await prisma.documentAccessLog.create({ data: { reportId: report.id, userId: request.auth.sub, action: 'HOSPITAL_READ' } }); return response.type(report.mimeType).send(file) } catch (error) { return next(error) } })

router.delete('/patient/cases/:caseId/reports/:reportId', requireAuth, requireRole('PATIENT'), async (request, response, next) => {
  try {
    const patient = await prisma.patient.findUnique({ where: { userId: request.auth.sub } });
    const report = await prisma.medicalReport.findFirst({ where: { id: request.params.reportId, caseId: request.params.caseId, patientCase: { patientId: patient.id } } });
    if (!report) return failure(response, 'Report not found', 404);
    // Delete the file from the filesystem
    try {
      await unlink(join(process.cwd(), 'private-uploads', report.storageKey));
    } catch (fileError) {
      console.warn('Could not delete file from storage:', fileError);
    }
    // Delete the report from the database
    await prisma.medicalReport.delete({ where: { id: report.id } });
    return success(response, 'Report deleted successfully', null, 200);
  } catch (error) {
    return next(error);
  }
})

router.get('/hospital/cases', requireAuth, requireRole('HOSPITAL'), async (request, response, next) => { try { const hospital = await prisma.hospital.findUnique({ where: { userId: request.auth.sub } }); const cases = await prisma.patientCase.findMany({ where: { hospitalId: hospital.id }, include: { patient: true, treatment: true, reports: true, responses: true, appointments: true, conversation: { include: { messages: { orderBy: { createdAt: 'asc' } } } } }, orderBy: { createdAt: 'desc' } }); return success(response, 'Assigned cases loaded', cases) } catch (error) { return next(error) } })

router.patch('/hospital/cases/:id/status', requireAuth, requireRole('HOSPITAL'), async (request, response, next) => { try { const hospital = await prisma.hospital.findUnique({ where: { userId: request.auth.sub } }); const input = z.object({ status: z.enum(['SUBMITTED', 'UNDER_REVIEW', 'RESPONDED', 'HOSPITAL_SELECTED', 'COMPLETED', 'CANCELLED']) }).parse(request.body); const ownedCase = await prisma.patientCase.findFirst({ where: { id: request.params.id, hospitalId: hospital.id } }); if (!ownedCase) return failure(response, 'Case not found', 404); const updated = await prisma.patientCase.update({ where: { id: ownedCase.id }, data: { status: input.status }, include: { patient: true } }); await prisma.notification.create({ data: { userId: updated.patient.userId, title: 'Case status updated', body: `Your case is now ${input.status.replaceAll('_', ' ').toLowerCase()}.` } }); return success(response, 'Case status updated', updated) } catch (error) { return next(error) } })

router.post('/hospital/cases/:id/response', requireAuth, requireRole('HOSPITAL'), async (request, response, next) => { try { const hospital = await prisma.hospital.findUnique({ where: { userId: request.auth.sub } }); const input = z.object({ summary: z.string().min(5), recommendedNextStep: z.string().min(5), estimatedTreatmentCost: z.coerce.number().nonnegative().optional(), estimatedHospitalStay: z.string().optional(), additionalInformation: z.string().optional() }).parse(request.body); const ownedCase = await prisma.patientCase.findFirst({ where: { id: request.params.id, hospitalId: hospital.id }, include: { patient: true } }); if (!ownedCase) return failure(response, 'Case not found', 404); const result = await prisma.$transaction(async (transaction) => { const reply = await transaction.hospitalResponse.create({ data: { caseId: ownedCase.id, ...input } }); await transaction.patientCase.update({ where: { id: ownedCase.id }, data: { status: 'RESPONDED' } }); await transaction.notification.create({ data: { userId: ownedCase.patient.userId, title: 'Hospital response received', body: 'Your hospital has responded to your case.' } }); return reply }); return success(response, 'Hospital response sent', result, 201) } catch (error) { return next(error) } })

router.patch('/hospital/appointments/:id', requireAuth, requireRole('HOSPITAL'), async (request, response, next) => { try { const hospital = await prisma.hospital.findUnique({ where: { userId: request.auth.sub } }); const input = z.object({ 
  status: z.enum(['CONFIRMED', 'CANCELLED', 'COMPLETED']).optional(),
  preferredAt: z.coerce.date().optional()
}).parse(request.body); const appointment = await prisma.appointment.findFirst({ where: { id: request.params.id, patientCase: { hospitalId: hospital.id }, }, include: { patientCase: { include: { patient: true } } } }); if (!appointment) return failure(response, 'Appointment not found', 404); const updateData = {};
if (input.status) updateData.status = input.status;
if (input.preferredAt) updateData.preferredAt = input.preferredAt;
const updated = await prisma.appointment.update({ where: { id: appointment.id }, data: updateData }); 
const notificationBody = input.status 
  ? `Your appointment is ${input.status.toLowerCase()}.`
  : `Your appointment has been rescheduled to ${new Date(input.preferredAt).toLocaleString()}.`;
await prisma.notification.create({ data: { userId: appointment.patientCase.patient.userId, title: 'Appointment updated', body: notificationBody } }); return success(response, 'Appointment updated', updated) } catch (error) { return next(error) } })

router.post('/patient/cases/:id/review', requireAuth, requireRole('PATIENT'), async (request, response, next) => { try { const patient = await prisma.patient.findUnique({ where: { userId: request.auth.sub } }); const input = z.object({ overallRating: z.coerce.number().int().min(1).max(5), hospitalRating: z.coerce.number().int().min(1).max(5), communicationRating: z.coerce.number().int().min(1).max(5), treatmentExperience: z.coerce.number().int().min(1).max(5), writtenReview: z.string().max(2000).optional() }).parse(request.body); const completedCase = await prisma.patientCase.findFirst({ where: { id: request.params.id, patientId: patient.id, status: 'COMPLETED' } }); if (!completedCase) return failure(response, 'A review is available after a completed case', 422); return success(response, 'Review submitted', await prisma.review.create({ data: { caseId: completedCase.id, patientId: patient.id, hospitalId: completedCase.hospitalId, ...input } }), 201) } catch (error) { return next(error) } })



router.get('/admin/hospitals', requireAuth, requireRole('ADMIN'), async (_request, response, next) => { try { return success(response, 'Hospitals loaded', await prisma.hospital.findMany({ include: { verification: true, user: { select: { email: true } } }, orderBy: { createdAt: 'desc' } })) } catch (error) { return next(error) } })

router.get('/admin/dashboard', requireAuth, requireRole('ADMIN'), async (_request, response, next) => { try { const [patients, hospitals, verifiedHospitals, treatments] = await Promise.all([prisma.user.count({ where: { role: 'PATIENT' } }), prisma.hospital.count(), prisma.hospital.count({ where: { status: 'VERIFIED' } }), prisma.treatment.count()]); return success(response, 'Admin dashboard loaded', { patients, hospitals, verifiedHospitals, treatments }) } catch (error) { return next(error) } })

router.patch('/admin/hospitals/:id/verify', requireAuth, requireRole('ADMIN'), async (request, response, next) => { try { const hospital = await prisma.hospital.update({ where: { id: request.params.id }, data: { status: 'VERIFIED', verification: { upsert: { create: { status: 'VERIFIED', reviewedAt: new Date() }, update: { status: 'VERIFIED', reviewedAt: new Date() } } } } }); return success(response, 'Hospital verified', hospital) } catch (error) { return next(error) } })

router.patch('/admin/hospitals/:id/reject', requireAuth, requireRole('ADMIN'), async (request, response, next) => { try { const hospital = await prisma.hospital.update({ where: { id: request.params.id }, data: { status: 'REJECTED', verification: { upsert: { create: { status: 'REJECTED', reviewedAt: new Date() }, update: { status: 'REJECTED', reviewedAt: new Date() } } } } }); return success(response, 'Hospital rejected', hospital) } catch (error) { return next(error) } })

router.patch('/admin/hospitals/:id/request-changes', requireAuth, requireRole('ADMIN'), async (request, response, next) => { try { const notes = z.object({ notes: z.string().min(3).max(1000) }).parse(request.body); const hospital = await prisma.hospital.update({ where: { id: request.params.id }, data: { status: 'CHANGES_REQUESTED', verification: { upsert: { create: { status: 'CHANGES_REQUESTED', notes: notes.notes, reviewedAt: new Date() }, update: { status: 'CHANGES_REQUESTED', notes: notes.notes, reviewedAt: new Date() } } } } }); return success(response, 'Changes requested', hospital) } catch (error) { return next(error) } })

router.patch('/admin/hospitals/:id/suspend', requireAuth, requireRole('ADMIN'), async (request, response, next) => { try { const hospital = await prisma.hospital.update({ where: { id: request.params.id }, data: { status: 'SUSPENDED', verification: { upsert: { create: { status: 'SUSPENDED', reviewedAt: new Date() }, update: { status: 'SUSPENDED', reviewedAt: new Date() } } } } }); return success(response, 'Hospital suspended', hospital) } catch (error) { return next(error) } })

// =================== CENTRAL CATALOG: SPECIALTIES & TREATMENTS (ADMIN ONLY) ===================
// Create Specialty (Admin only)
router.post('/admin/specialties', requireAuth, requireRole('ADMIN'), async (request, response, next) => {
  try {
    const { name } = z.object({ name: z.string().min(2).max(100) }).parse(request.body);
    
    const existing = await prisma.specialty.findUnique({ where: { name } });
    if (existing) {
      return failure(response, 'Specialty with this name already exists', 409);
    }

    const specialty = await prisma.specialty.create({ data: { name } });
    return success(response, 'Specialty created successfully', specialty, 201);
  } catch (error) { return next(error); }
});

// Get all Specialties (Public)
router.get('/specialties', async (_request, response, next) => {
  try {
    const specialties = await prisma.specialty.findMany({
      include: { treatments: { select: { id: true, name: true, slug: true, description: true } } },
      orderBy: { name: 'asc' }
    });
    return success(response, 'Specialties loaded', specialties);
  } catch (error) { return next(error); }
});

// Update Specialty (Admin only)
router.put('/admin/specialties/:id', requireAuth, requireRole('ADMIN'), async (request, response, next) => {
  try {
    const { name } = z.object({ name: z.string().min(2).max(100) }).parse(request.body);
    const specialty = await prisma.specialty.update({
      where: { id: request.params.id },
      data: { name }
    });
    return success(response, 'Specialty updated successfully', specialty);
  } catch (error) { return next(error); }
});

// Delete Specialty (Admin only)
router.delete('/admin/specialties/:id', requireAuth, requireRole('ADMIN'), async (request, response, next) => {
  try {
    await prisma.specialty.delete({ where: { id: request.params.id } });
    return success(response, 'Specialty deleted successfully');
  } catch (error) { return next(error); }
});

// Create Treatment (Admin only)
router.post('/admin/treatments', requireAuth, requireRole('ADMIN'), async (request, response, next) => {
  try {
    const input = z.object({
      name: z.string().min(2).max(200),
      description: z.string().max(5000).optional(),
      specialtyId: z.string().cuid()
    }).parse(request.body);

    const slug = `${input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now()}`;
    
    const existing = await prisma.treatment.findUnique({ where: { slug } });
    if (existing) {
      return failure(response, 'Treatment with similar name already exists', 409);
    }

    const treatment = await prisma.treatment.create({
      data: { ...input, slug },
      include: { specialty: true }
    });
    return success(response, 'Treatment created successfully', treatment, 201);
  } catch (error) { return next(error); }
});

// Get all Treatments (Public)
router.get('/treatments', async (_request, response, next) => {
  try {
    const treatments = await prisma.treatment.findMany({
      include: { specialty: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' }
    });
    return success(response, 'Treatments loaded', treatments);
  } catch (error) { return next(error); }
});

// Get single Treatment by slug (Public)
router.get('/treatments/:slug', async (request, response, next) => {
  try {
    const treatment = await prisma.treatment.findUnique({
      where: { slug: request.params.slug },
      include: { specialty: { select: { id: true, name: true } } }
    });
    if (!treatment) return failure(response, 'Treatment not found', 404);
    return success(response, 'Treatment loaded', treatment);
  } catch (error) { return next(error); }
});

// Update Treatment (Admin only)
router.put('/admin/treatments/:id', requireAuth, requireRole('ADMIN'), async (request, response, next) => {
  try {
    const input = z.object({
      name: z.string().min(2).max(200).optional(),
      description: z.string().max(5000).optional(),
      specialtyId: z.string().cuid().optional()
    }).parse(request.body);

    const treatment = await prisma.treatment.update({
      where: { id: request.params.id },
      data: input,
      include: { specialty: true }
    });
    return success(response, 'Treatment updated successfully', treatment);
  } catch (error) { return next(error); }
});

// Delete Treatment (Admin only)
router.delete('/admin/treatments/:id', requireAuth, requireRole('ADMIN'), async (request, response, next) => {
  try {
    await prisma.treatment.delete({ where: { id: request.params.id } });
    return success(response, 'Treatment deleted successfully');
  } catch (error) { return next(error); }
});

// =================== HOSPITAL TREATMENT MODERATION ===================
// Get all pending hospital treatments for moderation (Admin only)
router.get('/admin/hospital-treatments/pending', requireAuth, requireRole('ADMIN'), async (_request, response, next) => {
  try {
    const pendingTreatments = await prisma.hospitalTreatment.findMany({
      where: { approvalStatus: 'PENDING' },
      include: {
        hospital: { select: { id: true, name: true, slug: true } },
        treatment: { select: { id: true, name: true, slug: true, specialty: { select: { name: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return success(response, 'Pending hospital treatments loaded', pendingTreatments);
  } catch (error) { return next(error); }
});

// Approve hospital treatment (Admin only)
router.patch('/admin/hospital-treatments/:id/approve', requireAuth, requireRole('ADMIN'), async (request, response, next) => {
  try {
    const hospitalTreatment = await prisma.hospitalTreatment.update({
      where: { id: request.params.id },
      data: { approvalStatus: 'APPROVED' },
      include: { hospital: { select: { name: true } }, treatment: { select: { name: true } } }
    });
    return success(response, 'Hospital treatment approved successfully', hospitalTreatment);
  } catch (error) { return next(error); }
});

// Reject hospital treatment (Admin only)
router.patch('/admin/hospital-treatments/:id/reject', requireAuth, requireRole('ADMIN'), async (request, response, next) => {
  try {
    const { notes } = z.object({ notes: z.string().min(3).max(1000).optional() }).parse(request.body);
    const hospitalTreatment = await prisma.hospitalTreatment.update({
      where: { id: request.params.id },
      data: { approvalStatus: 'REJECTED' },
      include: { hospital: { select: { name: true } }, treatment: { select: { name: true } } }
    });
    return success(response, 'Hospital treatment rejected successfully', hospitalTreatment);
  } catch (error) { return next(error); }
});

// Hospital adds a treatment to their profile (HOSPITAL only) - auto-sets to PENDING if moderation needed
router.post('/hospitals/me/treatments', requireAuth, requireRole('HOSPITAL'), async (request, response, next) => {
  try {
    const hospital = await prisma.hospital.findUnique({ where: { userId: request.user.id } });
    if (!hospital) return failure(response, 'Hospital profile not found', 404);

    const input = z.object({
      treatmentId: z.string().cuid(),
      minEstimatedCost: z.number().min(0).optional(),
      maxEstimatedCost: z.number().min(0).optional(),
      inclusions: z.string().optional(),
      exclusions: z.string().optional()
    }).parse(request.body);

    const existing = await prisma.hospitalTreatment.findUnique({
      where: { hospitalId_treatmentId: { hospitalId: hospital.id, treatmentId: input.treatmentId } }
    });
    if (existing) {
      return failure(response, 'You have already added this treatment', 409);
    }

    const hospitalTreatment = await prisma.hospitalTreatment.create({
      data: {
        hospitalId: hospital.id,
        treatmentId: input.treatmentId,
        minEstimatedCost: input.minEstimatedCost,
        maxEstimatedCost: input.maxEstimatedCost,
        inclusions: input.inclusions,
        exclusions: input.exclusions,
        approvalStatus: 'PENDING' // Requires admin approval before being visible
      },
      include: { treatment: true }
    });
    return success(response, 'Treatment added successfully and submitted for approval', hospitalTreatment, 201);
  } catch (error) { return next(error); }
});



router.post('/admin/hospitals', requireAuth, requireRole('ADMIN'), async (request, response, next) => {

  try {

    const input = adminHospitalCreationSchema.parse(request.body);

    const existingUser = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });

    if (existingUser) {
      console.log(`Email conflict detected: ${input.email} exists with role: ${existingUser.role}, user ID: ${existingUser.id}`);
      const roleText = existingUser.role === 'HOSPITAL'
        ? 'an existing hospital account'
        : existingUser.role === 'PATIENT'
        ? 'a patient account'
        : existingUser.role === 'ADMIN'
        ? 'an admin account'
        : 'an existing account';

      return failure(response, `This email is already registered under ${roleText}. Please use a different email for the hospital.`, 409);
    }



    const useProvidedPassword = Boolean(input.password);

    const temporaryPassword = useProvidedPassword
      ? undefined
      : Math.random().toString(36).slice(-10); // Generate a random 10-character password

    const passwordToHash = useProvidedPassword ? input.password : temporaryPassword;

    const passwordHash = await bcrypt.hash(passwordToHash, 12);

    const slug = `${input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now()}`;



    const user = await prisma.user.create({

      data: {

        email: input.email.toLowerCase(),

        passwordHash,

        role: 'HOSPITAL',

        mustChangePassword: !useProvidedPassword,

        hospital: {

          create: {

            name: input.name,

            slug,

            phone: input.phone,

            city: input.city,

            state: input.state,

            country: input.country,

            address: input.address,

            website: input.website || null,

            hospitalType: input.hospitalType,

            beds: input.beds,

            icuBeds: input.icuBeds,

            description: input.description,

            internationalSupport: input.internationalSupport ?? false,

            languages: input.languages,

            verification: { create: { status: 'VERIFIED', reviewedAt: new Date() } }, // Auto-verify for admin created hospitals

            status: 'VERIFIED',

          },

        },

      },

    });



    const responsePayload = {

      id: user.id,

      name: input.name,

      email: user.email,

      role: user.role,

    };

    if (temporaryPassword) {

      responsePayload.temporaryPassword = temporaryPassword;

    }

    return success(response, 'Hospital created successfully', responsePayload, 201);

  } catch (error) {

    return next(error);

  }

});



router.get('/admin/patients', requireAuth, requireRole('ADMIN'), async (request, response, next) => {

  try {

    const page = Math.max(1, Number(request.query.page || 1))

    const limit = Math.max(1, Math.min(100, Number(request.query.limit || 20)))

    const skip = (page - 1) * limit

    const [total, patients] = await Promise.all([

      prisma.patient.count(),

      prisma.patient.findMany({

        include: { user: { select: { email: true, role: true, createdAt: true } }, _count: { select: { cases: true, reviews: true } } },

        orderBy: { id: 'desc' },

        skip,

        take: limit,

      })

    ])

    return success(response, 'Patients loaded', { patients, total, page, limit, totalPages: Math.ceil(total / limit) })

  } catch (error) { return next(error) }

})



router.get('/admin/cases', requireAuth, requireRole('ADMIN'), async (request, response, next) => {

  try {

    const page = Math.max(1, Number(request.query.page || 1))

    const limit = Math.max(1, Math.min(100, Number(request.query.limit || 20)))

    const skip = (page - 1) * limit

    const status = request.query.status ? String(request.query.status) : undefined

    const where = status ? { status } : {}

    const [total, cases] = await Promise.all([

      prisma.patientCase.count({ where }),

      prisma.patientCase.findMany({

        where,

        include: { patient: true, hospital: true, treatment: true, _count: { select: { reports: true, appointments: true, responses: true } } },

        orderBy: { createdAt: 'desc' },

        skip,

        take: limit,

      })

    ])

    return success(response, 'Patient cases loaded', { cases, total, page, limit, totalPages: Math.ceil(total / limit) })

  } catch (error) { return next(error) }

})



router.get('/admin/appointments', requireAuth, requireRole('ADMIN'), async (request, response, next) => {

  try {

    const page = Math.max(1, Number(request.query.page || 1))

    const limit = Math.max(1, Math.min(100, Number(request.query.limit || 20)))

    const skip = (page - 1) * limit

    const status = request.query.status ? String(request.query.status) : undefined

    const where = status ? { status } : {}

    const [total, appointments] = await Promise.all([

      prisma.appointment.count({ where }),

      prisma.appointment.findMany({

        where,

        include: { patientCase: { include: { patient: true, hospital: true, treatment: true } } },

        orderBy: { createdAt: 'desc' },

        skip,

        take: limit,

      })

    ])

    return success(response, 'Appointments loaded', { appointments, total, page, limit, totalPages: Math.ceil(total / limit) })

  } catch (error) { return next(error) }

})



router.get('/admin/reviews', requireAuth, requireRole('ADMIN'), async (request, response, next) => {

  try {

    const page = Math.max(1, Number(request.query.page || 1))

    const limit = Math.max(1, Math.min(100, Number(request.query.limit || 20)))

    const skip = (page - 1) * limit

    const [total, reviews] = await Promise.all([

      prisma.review.count(),

      prisma.review.findMany({

        include: { patient: true, hospital: true, patientCase: { include: { treatment: true } } },

        orderBy: { createdAt: 'desc' },

        skip,

        take: limit,

      })

    ])

    return success(response, 'Reviews loaded', { reviews, total, page, limit, totalPages: Math.ceil(total / limit) })

  } catch (error) { return next(error) }

})



export default router;