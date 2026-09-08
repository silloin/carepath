import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { updateHospital } from '../api'
import { ArrowRight } from 'lucide-react'

export function EditHospitalForm({ hospital, onSuccess, onCancel }) {
  const [form, setForm] = useState({
    name: hospital.name || '',
    email: hospital.user.email || '',
    city: hospital.city || '',
    country: hospital.country || '',
    description: hospital.description || '',
    status: hospital.status || 'PENDING_VERIFICATION',
  })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setForm({
      name: hospital.name || '',
      email: hospital.user.email || '',
      city: hospital.city || '',
      country: hospital.country || '',
      description: hospital.description || '',
      status: hospital.status || 'PENDING_VERIFICATION',
    });
  }, [hospital]);

  const updateHospitalMutation = useMutation({
    mutationFn: (payload) => updateHospital(hospital.id, payload),
    onSuccess: (data) => {
      setMessage(`Hospital "${data.name}" updated successfully.`);
      onSuccess(); // Refresh the hospital list
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Failed to update hospital.');
    },
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    updateHospitalMutation.mutate(form);
  };

  return (
    <section className="dashboard-panel">
      <div className="panel-heading">
        <h2>Edit Hospital Account</h2>
      </div>
      <form className="case-form marketplace-form" onSubmit={handleSubmit}>
        <label>
          Hospital Name
          <input name="name" value={form.name} onChange={handleChange} required />
        </label>
        <label>
          Hospital Email (Login)
          <input name="email" type="email" value={form.email} onChange={handleChange} required />
        </label>
        <label>
          City
          <input name="city" value={form.city} onChange={handleChange} required />
        </label>
        <label>
          Country
          <input name="country" value={form.country} onChange={handleChange} required />
        </label>
        <label>
          Description
          <textarea name="description" value={form.description} onChange={handleChange} />
        </label>
        <label>
          Status
          <select name="status" value={form.status} onChange={handleChange}>
            <option value="PENDING_VERIFICATION">Pending Verification</option>
            <option value="VERIFIED">Verified</option>
            <option value="REJECTED">Rejected</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </label>
        {message && <div className="form-success">{message}</div>}
        {error && <div className="form-error">{error}</div>}
        <div className="form-actions">
          <button type="submit" className="button button-coral" disabled={updateHospitalMutation.isPending}>
            {updateHospitalMutation.isPending ? 'Updating...' : 'Update Hospital'} <ArrowRight size={16} />
          </button>
          <button type="button" className="text-button" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}