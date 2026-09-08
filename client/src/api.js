import axios from 'axios'



export const api = axios.create({ baseURL: '/api', withCredentials: true })



export async function getTreatments(search = '') {

  try {

    // Add cache buster to prevent any HTTP caching

    const params = search ? { search, _t: Date.now() } : { _t: Date.now() };

    const { data } = await api.get('/public/treatments', { params });

    return data.data;

  } catch (error) {

    console.error('Error fetching treatments:', error);

    throw error;

  }

}



export async function getHospitals(params = {}) {

  const { data } = await api.get('/public/hospitals', { params: { ...params, status: 'VERIFIED' } })

  return data.data

}



export async function getTreatment(slug) {

  const { data } = await api.get(`/public/treatments/${slug}`)

  return data.data

}



export async function registerPatient(payload) { return (await api.post('/auth/register', payload)).data.data }

export async function registerHospital(payload) { return (await api.post('/hospitals/register', payload)).data.data }

export async function login(payload) { return (await api.post('/auth/login', payload)).data.data }

export async function getMe() { return (await api.get('/auth/me')).data.data }

export async function createCase(payload) { return (await api.post('/patient/cases', payload)).data.data }

export async function getCases() { return (await api.get('/patient/cases')).data.data }

export async function getCase(id) { return (await api.get(`/patient/cases/${id}`)).data.data }

export async function uploadReport(caseId, file, category) { const body = new FormData(); body.append('report', file); body.append('category', category); return (await api.post(`/patient/cases/${caseId}/reports`, body)).data.data }

export async function requestAppointment(caseId, payload) { return (await api.post(`/patient/cases/${caseId}/appointments`, payload)).data.data }

export async function getNotifications() { return (await api.get('/patient/notifications')).data.data }

export async function getHospitalCases() { return (await api.get('/hospital/cases')).data.data }

export async function updateCaseStatus(id, status) { return (await api.patch(`/hospital/cases/${id}/status`, { status })).data.data }

export async function sendHospitalResponse(id, payload) { return (await api.post(`/hospital/cases/${id}/response`, payload)).data.data }

export async function confirmAppointment(id, status) { return (await api.patch(`/hospital/appointments/${id}`, { status })).data.data }

export async function submitReview(id, payload) { return (await api.post(`/patient/cases/${id}/review`, payload)).data.data }

export async function getHospital(slug) { return (await api.get(`/public/hospitals/${slug}`)).data.data }

export async function getCostEstimate(treatmentId, hospitalId) { return (await api.get('/public/cost-estimate', { params: { treatmentId, hospitalId } })).data.data }

export async function getHospitalProfile() { return (await api.get('/hospitals/me')).data.data }

export async function getHospitalTreatments() { return (await api.get('/hospitals/me/treatments')).data.data }

export async function getSpecialties() { return (await api.get('/specialties')).data.data }

export async function getCatalog() { return (await api.get('/treatments')).data.data }

export async function addHospitalTreatment(payload) { return (await api.post('/hospitals/me/treatments', payload)).data.data }

export async function updateHospitalTreatment(id, payload) { return (await api.put(`/hospitals/me/treatments/${id}`, payload)).data.data }

export async function updateHospitalTreatmentStatus(id, availability) { return (await api.patch(`/hospitals/me/treatments/${id}/status`, { availability })).data.data }

export async function getAdminHospitals() { return (await api.get('/admin/hospitals')).data.data }

export async function createHospital(payload) { return (await api.post('/admin/hospitals', payload)).data.data }

export async function verifyHospital(id, action, payload = {}) { return (await api.patch(`/admin/hospitals/${id}/${action}`, payload)).data.data }

export async function resetHospitalPassword(id) {

  return (await api.patch(`/admin/hospitals/${id}/password`)).data.data;

}export async function deleteHospital(id) {

  return (await api.delete(`/admin/hospitals/${id}`)).data;

}

export async function updateHospital(id, payload) { return (await api.put(`/admin/hospitals/${id}`, payload)).data.data }

export async function createSpecialty(name) { return (await api.post('/specialties', { name })).data.data }

export async function createTreatment(payload) { return (await api.post('/treatments', payload)).data.data }

export async function getAdminHospitalTreatments(params = {}) { return (await api.get('/admin/hospital-treatments', { params })).data.data }

export async function approveHospitalTreatment(id) { return (await api.patch(`/admin/hospital-treatments/${id}/approve`)).data.data }

export async function rejectHospitalTreatment(id) { return (await api.patch(`/admin/hospital-treatments/${id}/reject`)).data.data }

export async function getAdminPatients(params = {}) { return (await api.get('/admin/patients', { params })).data.data }

export async function getAdminCases(params = {}) { return (await api.get('/admin/cases', { params })).data.data }

export async function getAdminAppointments(params = {}) { return (await api.get('/admin/appointments', { params })).data.data }

export async function getAdminReviews(params = {}) { return (await api.get('/admin/reviews', { params })).data.data }