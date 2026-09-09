import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { createHospital } from '../api';
import { ArrowRight } from 'lucide-react';

export function CreateHospitalForm({ onSuccess, onCancel }) {
  const initialForm = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    city: '',
    country: '',
    description: '',
    phone: '',
    state: '',
    address: '',
    hospitalType: '',
    beds: '',
    icuBeds: '',
    website: '',
    languages: '',
    internationalSupport: false,
  };

  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const createHospitalMutation = useMutation({
    mutationFn: createHospital,

    onSuccess: (data) => {
      if (data.temporaryPassword) {
        setMessage(
          `Hospital "${data.name}" created successfully. Please copy the temporary password below and share it securely with the hospital.`
        );
      } else {
        setMessage(
          `Hospital "${data.name}" created successfully with the password you provided.`
        );
      }

      setError('');
      setCopied(false);
      setForm(initialForm);

      if (onSuccess) {
        onSuccess();
      }
    },

    onError: (err) => {
      let errorText =
        err.response?.data?.message ||
        err.message ||
        'Failed to create hospital.';

      const zodDetails = err.response?.data?.error;
      if (zodDetails) {
        const fieldErrors = zodDetails.fieldErrors || {};
        const formErrors = zodDetails.formErrors || [];
        const parts = [];

        for (const [field, messages] of Object.entries(fieldErrors)) {
          if (Array.isArray(messages) && messages.length) {
            parts.push(
              `${field.charAt(0).toUpperCase() + field.slice(1)}: ${messages.join('; ')}`
            );
          }
        }

        if (Array.isArray(formErrors) && formErrors.length) {
          parts.push(...formErrors);
        }

        if (parts.length) {
          errorText = `${errorText} — ${parts.join(' | ')}`;
        }
      }

      setError(errorText);
      setMessage('');
    },
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    setError('');
    setMessage('');
    setCopied(false);

    createHospitalMutation.mutate(form);
  };

  const handleCopyPassword = async () => {
    const temporaryPassword =
      createHospitalMutation.data?.temporaryPassword;

    if (!temporaryPassword) return;

    try {
      await navigator.clipboard.writeText(temporaryPassword);

      setCopied(true);
      setError('');

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      setError('Unable to copy the temporary password.');
    }
  };

  return (
    <section className="dashboard-panel">
      <div className="panel-heading">
        <h2>Create New Hospital Account</h2>
      </div>

      <form
        className="case-form marketplace-form"
        onSubmit={handleSubmit}
      >
        <label>
          Hospital Name
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Hospital Email (Login)
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Password (leave blank to auto-generate)
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            minLength={8}
            placeholder="Minimum 8 characters"
          />
        </label>

        <label>
          Confirm Password
          <input
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={handleChange}
            minLength={8}
            placeholder="Re-type the password above"
          />
        </label>

        <label>
          Phone
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
          />
        </label>

        <label>
          Country
          <input
            name="country"
            value={form.country}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          State
          <input
            name="state"
            value={form.state}
            onChange={handleChange}
          />
        </label>

        <label>
          City
          <input
            name="city"
            value={form.city}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Address
          <textarea
            name="address"
            value={form.address}
            onChange={handleChange}
          />
        </label>

        <label>
          Hospital Type
          <input
            name="hospitalType"
            value={form.hospitalType}
            onChange={handleChange}
          />
        </label>

        <label>
          Number of Beds
          <input
            name="beds"
            type="number"
            min="0"
            value={form.beds}
            onChange={handleChange}
          />
        </label>

        <label>
          ICU Beds
          <input
            name="icuBeds"
            type="number"
            min="0"
            value={form.icuBeds}
            onChange={handleChange}
          />
        </label>

        <label>
          Website
          <input
            name="website"
            type="url"
            value={form.website}
            onChange={handleChange}
            placeholder="https://example.com"
          />
        </label>

        <label>
          Languages Supported (comma-separated)
          <input
            name="languages"
            value={form.languages}
            onChange={handleChange}
            placeholder="English, Hindi, Arabic"
          />
        </label>

        <label className="checkbox-label">
          <input
            type="checkbox"
            name="internationalSupport"
            checked={form.internationalSupport}
            onChange={handleChange}
          />
          International Patient Support
        </label>

        <label>
          Description
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
          />
        </label>

        {message && (
          <div className="form-success">
            <div>{message}</div>

            {createHospitalMutation.data?.temporaryPassword && (
              <div className="temporary-password-actions">
                <div className="temporary-password">
                  <strong>Temporary Password:</strong>

                  <span>
                    {createHospitalMutation.data.temporaryPassword}
                  </span>
                </div>

                <button
                  type="button"
                  className="button button-small button-light"
                  onClick={handleCopyPassword}
                >
                  {copied
                    ? 'Password Copied ✓'
                    : 'Copy Temporary Password'}
                </button>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="form-error">
            {error}
          </div>
        )}

        <div className="form-actions">
          <button
            type="submit"
            className="button button-coral"
            disabled={createHospitalMutation.isPending}
          >
            {createHospitalMutation.isPending
              ? 'Creating...'
              : 'Create Hospital'}

            {!createHospitalMutation.isPending && (
              <ArrowRight size={16} />
            )}
          </button>

          <button
            type="button"
            className="text-button"
            onClick={onCancel}
            disabled={createHospitalMutation.isPending}
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}