import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getAdminHospitals, resetHospitalPassword, deleteHospital, updateHospital } from '../api'
import { DataState } from '../components/DataState'
import { CreateHospitalForm } from './CreateHospitalForm'
import { EditHospitalForm } from './EditHospitalForm'

export function AdminHospitals() {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingHospital, setEditingHospital] = useState(null)
  const [tempPassword, setTempPassword] = useState(null)
  const hospitalsQuery = useQuery({ queryKey: ['admin-hospitals'], queryFn: getAdminHospitals })

    const resetPasswordMutation = useMutation({
    mutationFn: resetHospitalPassword,
    onSuccess: (data) => {
      alert(`Password for ${data.name} reset successfully. New temporary password: ${data.temporaryPassword}. Please copy it now.`);
      // Optionally add a copy button to the alert or a modal
    },
    onError: (err) => {
      console.error('Failed to reset password:', err);
      // Optionally display an error message to the user
    },
  });

    const deleteHospitalMutation = useMutation({
    mutationFn: deleteHospital,
    onSuccess: () => {
      queryClient.invalidateQueries(['hospitals']);
      // Optionally add a success message
    },
    onError: (err) => {
      console.error('Failed to delete hospital:', err);
      // Optionally display an error message to the user
    },
  });

  if (showCreateForm) {
    return <CreateHospitalForm onSuccess={() => { hospitalsQuery.refetch(); setShowCreateForm(false); }} onCancel={() => setShowCreateForm(false)} />
  }

  if (editingHospital) {
    return <EditHospitalForm hospital={editingHospital} onSuccess={() => { hospitalsQuery.refetch(); setEditingHospital(null); }} onCancel={() => setEditingHospital(null)} />
  }

  return (
    <section className="dashboard-panel">
      <div className="panel-heading">
        <div>
          <span className="kicker">Hospital Management</span>
          <h2>All Hospitals</h2>
        </div>
        <span className="status-pill">{hospitalsQuery.data?.length || 0} hospitals</span>
        <button className="button button-small" onClick={() => setShowCreateForm(true)}>Create Hospital</button>
      </div>
      {tempPassword && (
        <div className="form-success" style={{ marginBottom: '1rem' }}>
          Temporary password for hospital ID {tempPassword.hospitalId}: <strong>{tempPassword.password}</strong>
          <button className="text-button" onClick={() => navigator.clipboard.writeText(tempPassword.password)}>Copy</button>
        </div>
      )}
      <DataState loading={hospitalsQuery.isLoading} error={hospitalsQuery.error} empty="No hospitals found.">
        <div className="moderation-list">
          {hospitalsQuery.data?.map((hospital) => (
            <article className="moderation-row" key={hospital.id}>
              <div className="moderation-main">
                <div>
                  <strong>{hospital.name}</strong>
                  <span>{hospital.city}, {hospital.country} · {hospital.user.email}</span>
                </div>
                <div>
                  <span className="status-pill">{hospital.status.replaceAll('_', ' ')}</span>
                  <span>Joined {new Date(hospital.user.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="moderation-actions">
                {/* Action buttons will go here */}
                <button className="button button-small">Edit</button>
                          <button
            className="button button-small button-secondary"
            onClick={() => resetPasswordMutation.mutate(hospital.id)}
            disabled={resetPasswordMutation.isPending}
          >
            Reset Password
          </button>
            <button
              className="button button-small button-danger"
              onClick={() => {
              if (window.confirm(`Are you sure you want to delete ${hospital.name}? This action cannot be undone.`)) {
                deleteHospitalMutation.mutate(hospital.id);
              }
            }}
            disabled={deleteHospitalMutation.isPending}
          >
            Delete
          </button>
              </div>
            </article>
          ))}
        </div>
      </DataState>
    </section>
  )
}