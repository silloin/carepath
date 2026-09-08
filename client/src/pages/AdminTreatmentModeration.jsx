import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Check, Eye, X } from 'lucide-react'
import { approveHospitalTreatment, getAdminHospitalTreatments, rejectHospitalTreatment } from '../api'
import { DataState } from '../components/DataState'

export function AdminTreatmentModeration() {
  const [filters, setFilters] = useState({ status: '', hospitalId: '', treatmentId: '' })
  const [actionSuccess, setActionSuccess] = useState('')
  const query = useQuery({ queryKey: ['admin-treatment-moderation', filters], queryFn: () => getAdminHospitalTreatments(filters) })
  const update = (event) => setFilters({ ...filters, [event.target.name]: event.target.value })
  const approve = async (id) => {
    try {
      await approveHospitalTreatment(id)
      setActionSuccess('Hospital treatment approved successfully.')
      query.refetch()
    } catch (err) {
      console.error(err)
    }
  }
  const reject = async (id) => {
    if (!window.confirm('Reject this hospital-treatment submission?')) return;
    try {
      await rejectHospitalTreatment(id)
      setActionSuccess('Hospital treatment rejected successfully.')
      query.refetch()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <section className="dashboard-panel moderation-panel">
      <div className="panel-heading">
        <div>
          <span className="kicker">Admin control</span>
          <h2>Hospital treatment moderation</h2>
        </div>
        <span className="status-pill">{query.data?.length || 0} submissions</span>
      </div>
      {actionSuccess && <div className="form-success" style={{ marginBottom: '1rem' }}>{actionSuccess}</div>}
      <div className="moderation-filters">
        <label>
          Status
          <select name="status" value={filters.status} onChange={update}>
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </label>
        <label>
          Hospital ID
          <input name="hospitalId" value={filters.hospitalId} onChange={update} placeholder="Optional ID" />
        </label>
        <label>
          Treatment ID
          <input name="treatmentId" value={filters.treatmentId} onChange={update} placeholder="Optional ID" />
        </label>
      </div>
      <DataState loading={query.isLoading} error={query.error} empty="No hospital-treatment submissions match these filters.">
        <div className="moderation-list">
          {query.data?.map((item) => (
            <article className="moderation-row" key={item.id}>
              <div className="moderation-main">
                <div>
                  <strong>Hospital: {item.hospital?.name || item.hospitalId}</strong>
                  <span>{item.hospital?.city || 'Location unavailable'} · Status: {item.hospital?.status || 'N/A'}</span>
                </div>
                <div>
                  <strong>Treatment: {item.treatment?.name || item.treatmentId}</strong>
                  <span>Cost range: {item.currency || 'INR'} {item.minEstimatedCost != null ? Number(item.minEstimatedCost).toLocaleString('en-IN') : '—'} – {item.maxEstimatedCost != null ? Number(item.maxEstimatedCost).toLocaleString('en-IN') : '—'}</span>
                </div>
                <div>
                  <span className={`status-pill moderation-${item.approvalStatus?.toLowerCase()}`}>Approval: {item.approvalStatus}</span>
                  <span>Availability: {item.availability?.replaceAll('_', ' ')}</span>
                </div>
                <div className="moderation-dates">
                  <span>Created: {new Date(item.createdAt).toLocaleDateString()}</span>
                  <span>Updated: {new Date(item.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="moderation-actions">
                <button className="button button-light button-small" type="button" title="View submission details">
                  <Eye size={14} /> View
                </button>
                {item.approvalStatus !== 'APPROVED' && (
                  <button className="button button-dark button-small" type="button" onClick={() => approve(item.id)}>
                    <Check size={14} /> Approve
                  </button>
                )}
                {item.approvalStatus !== 'REJECTED' && (
                  <button className="button button-reject button-small" type="button" onClick={() => reject(item.id)}>
                    <X size={14} /> Reject
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      </DataState>
    </section>
  )
}

