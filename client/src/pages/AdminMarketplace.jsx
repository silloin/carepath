import { useState } from 'react'

import { useQuery } from '@tanstack/react-query'

import { ArrowRight, BadgeCheck, Star, Plus } from 'lucide-react'

import { createSpecialty, createTreatment, getAdminAppointments, getAdminCases, getAdminHospitals, getAdminPatients, getAdminReviews, getCatalog, getSpecialties, verifyHospital } from '../api'

import { DataState } from '../components/DataState'

import { AdminTreatmentModeration } from './AdminTreatmentModeration'
import { CreateHospitalForm } from './CreateHospitalForm'
import { DashboardShell } from '../App'

export function AdminMarketplace() {
  const [visibleCount, setVisibleCount] = useState(10)
  const [showCreateHospital, setShowCreateHospital] = useState(false)

  const hospitals = useQuery({ queryKey: ['admin-hospitals'], queryFn: getAdminHospitals })

  const catalog = useQuery({ queryKey: ['admin-catalog'], queryFn: getCatalog })

  const specialties = useQuery({ queryKey: ['specialties'], queryFn: getSpecialties })

  const [specialty, setSpecialty] = useState('')

  const [treatment, setTreatment] = useState({ name: '', slug: '', specialtyId: '', description: '' })

  const [message, setMessage] = useState('')

  const create = async (event) => { event.preventDefault(); await createTreatment(treatment); setTreatment({ name: '', slug: '', specialtyId: '', description: '' }); setMessage('Treatment added to the central catalog.'); catalog.refetch() }
  
  const loadMore = () => {
    setVisibleCount(prev => prev + 10)
  }
  
  const visibleHospitals = hospitals.data?.slice(0, visibleCount) || []
  const hasMore = (hospitals.data?.length || 0) > visibleCount

  if (showCreateHospital) {
    return <CreateHospitalForm onSuccess={() => { hospitals.refetch(); setShowCreateHospital(false) }} onCancel={() => setShowCreateHospital(false)} />
  }

  // Wrap in DashboardShell to get admin navigation sidebar
  return (
    <DashboardShell 
      role="ADMIN" 
      title="Admin Overview" 
      description="Manage your healthcare platform, verify hospitals, moderate treatments, and oversee all platform activity."
    >
      <div className="dashboard-main marketplace-page">
        <span className="kicker">Admin marketplace</span>
        <h1>Verify the network.</h1>
        <div className="dashboard-grid">
          <section className="dashboard-panel">
            <div className="panel-heading">
              <div>
                <span className="kicker">Hospital verification</span>
                <h2>Registration queue</h2>
              </div>
              <span className="status-pill">{hospitals.data?.length || 0} hospitals</span>
              <button className="button button-dark button-small" onClick={() => setShowCreateHospital(true)}>
                <Plus size={14} /> Create Hospital
              </button>
            </div>
            <DataState loading={hospitals.isLoading} error={hospitals.error} empty="No hospital registrations waiting for review.">
              {visibleHospitals.map((hospital) => (
                <article className="marketplace-treatment" key={hospital.id}>
                  <div>
                    <h3>{hospital.name}</h3>
                    <p>{hospital.city}, {hospital.country} · {hospital.user.email}</p>
                    <span className="status-pill">{hospital.status.replaceAll('_', ' ')}</span>
                  </div>
                  <div className="verification-actions">
                    <button className="button button-dark button-small" onClick={async () => { await verifyHospital(hospital.id, 'verify'); hospitals.refetch() }}>
                      <BadgeCheck size={14} /> Approve
                    </button>
                    <button className="text-button" onClick={async () => { await verifyHospital(hospital.id, 'request-changes', { notes: 'Please complete the hospital profile before approval.' }); hospitals.refetch() }}>
                      Request changes
                    </button>
                    <button className="text-button danger-button" onClick={async () => { await verifyHospital(hospital.id, 'suspend'); hospitals.refetch() }}>
                      Suspend
                    </button>
                  </div>
                </article>
              ))}
            </DataState>
            {hasMore && <button className="button button-light button-small" onClick={loadMore} style={{ marginTop: '1rem' }}>Load more hospitals ({hospitals.data?.length - visibleCount} remaining)</button>}
          </section>
          <section className="dashboard-panel">
            <span className="kicker">Central catalog</span>
            <h2>Specialties and treatments</h2>
            <form className="inline-create" onSubmit={async (event) => { event.preventDefault(); await createSpecialty(specialty); setSpecialty(''); specialties.refetch() }}>
              <input value={specialty} onChange={(event) => setSpecialty(event.target.value)} placeholder="New specialty" required />
              <button className="button button-light">Add specialty</button>
            </form>
            <form className="case-form marketplace-form" onSubmit={create}>
              <div className="form-grid">
                <input value={treatment.name} onChange={(event) => setTreatment({ ...treatment, name: event.target.value })} placeholder="Treatment name" required />
                <input value={treatment.slug} onChange={(event) => setTreatment({ ...treatment, slug: event.target.value })} placeholder="treatment-slug" required />
              </div>
              <select value={treatment.specialtyId} onChange={(event) => setTreatment({ ...treatment, specialtyId: event.target.value })} required>
                <option value="">Select specialty</option>
                {specialties.data?.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
              </select>
              <textarea value={treatment.description} onChange={(event) => setTreatment({ ...treatment, description: event.target.value })} placeholder="Treatment overview" />
              <button className="button button-coral">Create treatment <ArrowRight size={16} /></button>
              {message && <div className="form-success">{message}</div>}
            </form>
            <DataState loading={catalog.isLoading} error={catalog.error} empty="No treatments in the central catalog.">
              <div className="catalog-list">
                {catalog.data?.map((item) => <div key={item.id}><strong>{item.name}</strong><span>{item.specialty.name}</span></div>)}
              </div>
            </DataState>
          </section>
        </div>
        <AdminTreatmentModeration />
      </div>
    </DashboardShell>
  )

}



export function AdminPatients() {

  const query = useQuery({ queryKey: ['admin-patients'], queryFn: () => getAdminPatients() })

  return (

    <section className="dashboard-panel">

      <div className="panel-heading">

        <div>

          <span className="kicker">Platform Directory</span>

          <h2>Registered Patients</h2>

        </div>

        <span className="status-pill">{query.data?.total || 0} patients</span>

      </div>

      <DataState loading={query.isLoading} error={query.error} empty="No registered patients found.">

        <div className="moderation-list">

          {query.data?.patients?.map((patient) => (

            <article className="moderation-row" key={patient.id}>

              <div className="moderation-main">

                <div>

                  <strong>{patient.firstName} {patient.lastName}</strong>

                  <span>{patient.user?.email} · {patient.country || 'Country unspecified'}</span>

                </div>

                <div>

                  <span>Cases: {patient._count?.cases || 0} · Reviews: {patient._count?.reviews || 0}</span>

                  <span>Joined {new Date(patient.user?.createdAt).toLocaleDateString()}</span>

                </div>

              </div>

            </article>

          ))}

        </div>

      </DataState>

    </section>

  )

}



export function AdminCases() {

  const [status, setStatus] = useState('')

  const query = useQuery({ queryKey: ['admin-cases', status], queryFn: () => getAdminCases(status ? { status } : {}) })

  return (

    <section className="dashboard-panel">

      <div className="panel-heading">

        <div>

          <span className="kicker">Case Management</span>

          <h2>Patient Cases</h2>

        </div>

        <span className="status-pill">{query.data?.total || 0} cases</span>

      </div>

      <div className="moderation-filters" style={{ marginBottom: '1rem' }}>

        <label>

          Filter status

          <select value={status} onChange={(e) => setStatus(e.target.value)}>

            <option value="">All case statuses</option>

            <option value="SUBMITTED">Submitted</option>

            <option value="UNDER_REVIEW">Under Review</option>

            <option value="RESPONDED">Responded</option>

            <option value="COMPLETED">Completed</option>

            <option value="CANCELLED">Cancelled</option>

          </select>

        </label>

      </div>

      <DataState loading={query.isLoading} error={query.error} empty="No patient cases found matching filters.">

        <div className="moderation-list">

          {query.data?.cases?.map((item) => (

            <article className="moderation-row" key={item.id}>

              <div className="moderation-main">

                <div>

                  <strong>{item.treatment?.name}</strong>

                  <span>Patient: {item.patient?.firstName} {item.patient?.lastName} · Hospital: {item.hospital?.name}</span>

                </div>

                <div>

                  <span className="status-pill">{item.status.replaceAll('_', ' ')}</span>

                  <span>Reports: {item._count?.reports || 0} · Appointments: {item._count?.appointments || 0}</span>

                </div>

                <div className="moderation-dates">

                  <span>Created {new Date(item.createdAt).toLocaleDateString()}</span>

                </div>

              </div>

            </article>

          ))}

        </div>

      </DataState>

    </section>

  )

}



export function AdminAppointments() {

  const [status, setStatus] = useState('')

  const query = useQuery({ queryKey: ['admin-appointments', status], queryFn: () => getAdminAppointments(status ? { status } : {}) })

  return (

    <section className="dashboard-panel">

      <div className="panel-heading">

        <div>

          <span className="kicker">Schedule Overview</span>

          <h2>Appointments</h2>

        </div>

        <span className="status-pill">{query.data?.total || 0} appointments</span>

      </div>

      <div className="moderation-filters" style={{ marginBottom: '1rem' }}>

        <label>

          Filter status

          <select value={status} onChange={(e) => setStatus(e.target.value)}>

            <option value="">All statuses</option>

            <option value="REQUESTED">Requested</option>

            <option value="CONFIRMED">Confirmed</option>

            <option value="CANCELLED">Cancelled</option>

            <option value="COMPLETED">Completed</option>

          </select>

        </label>

      </div>

      <DataState loading={query.isLoading} error={query.error} empty="No appointments found.">

        <div className="moderation-list">

          {query.data?.appointments?.map((item) => (

            <article className="moderation-row" key={item.id}>

              <div className="moderation-main">

                <div>

                  <strong>{item.type.replaceAll('_', ' ')}</strong>

                  <span>Patient: {item.patientCase?.patient?.firstName} {item.patientCase?.patient?.lastName} · Hospital: {item.patientCase?.hospital?.name}</span>

                </div>

                <div>

                  <span className="status-pill">{item.status}</span>

                  <span>Preferred: {new Date(item.preferredAt).toLocaleString()}</span>

                </div>

                <div className="moderation-dates">

                  <span>Created {new Date(item.createdAt).toLocaleDateString()}</span>

                </div>

              </div>

            </article>

          ))}

        </div>

      </DataState>

    </section>

  )

}



export function AdminReviews() {

  const query = useQuery({ queryKey: ['admin-reviews'], queryFn: () => getAdminReviews() })

  return (
    <DashboardShell 
      role="ADMIN" 
      title="Platform reviews" 
      description="Review and manage patient feedback on hospitals and treatments."
    >
      <div className="dashboard-main">
        <section className="dashboard-panel">

          <div className="panel-heading">

            <div>

              <span className="kicker">Patient Feedback</span>

              <h2>Hospital Reviews</h2>

            </div>

            <span className="status-pill">{query.data?.total || 0} reviews</span>

          </div>

          <DataState loading={query.isLoading} error={query.error} empty="No patient reviews published yet.">

            <div className="moderation-list">

              {query.data?.reviews?.map((review) => (

                <article className="moderation-row" key={review.id}>

                  <div className="moderation-main">

                    <div>

                      <strong>{review.hospital?.name} — {review.patientCase?.treatment?.name}</strong>

                      <span>By: {review.patient?.firstName} {review.patient?.lastName}</span>

                    </div>

                    <div>

                      <span className="status-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>

                        <Star size={12} fill="currentColor" /> {review.overallRating} / 5

                      </span>

                      <span>Hospital: {review.hospitalRating}★ · Comm: {review.communicationRating}★ · Treatment: {review.treatmentExperience}★</span>

                    </div>

                    {review.writtenReview && <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#444' }}>"{review.writtenReview}"</p>}

                    <div className="moderation-dates">

                      <span>Submitted {new Date(review.createdAt).toLocaleDateString()}</span>

                    </div>

                  </div>

                </article>

              ))}

            </div>

          </DataState>
        </section>
      </div>
    </DashboardShell>
  )
}

export function AdminTreatments() {
  const treatments = useQuery({ queryKey: ['admin-treatments'], queryFn: getCatalog })

  return (
    <DashboardShell 
      role="ADMIN" 
      title="Treatment catalog" 
      description="Manage and moderate all treatments available on the platform."
    >
      <div className="dashboard-main">
        <section className="dashboard-panel">
          <div className="panel-heading">
            <div>
              <span className="kicker">Platform Catalog</span>
              <h2>All platform treatments</h2>
            </div>
            <span className="status-pill">{treatments.data?.length || 0} treatments</span>
          </div>
          <DataState loading={treatments.isLoading} error={treatments.error} empty="No treatments in the catalog yet.">
            <div className="moderation-list">
              {treatments.data?.map(treatment => (
                <article className="moderation-row" key={treatment.id}>
                  <div className="moderation-main">
                    <div>
                      <strong>{treatment.name}</strong>
                      <p>{treatment.specialty.name}</p>
                    </div>
                    <ArrowRight size={18} />
                  </div>
                </article>
              ))}
            </div>
          </DataState>
        </section>
      </div>
    </DashboardShell>
  )
}