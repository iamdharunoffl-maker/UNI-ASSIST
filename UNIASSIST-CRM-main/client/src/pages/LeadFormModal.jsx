import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import SelectField from '../components/SelectField';
import LoadingSpinner from '../components/LoadingSpinner';
import { getCountries } from '../services/masterService';
import { createLead, updateLead } from '../services/leadService';
import { LEAD_STATUS, LEAD_SOURCES } from '../config/constants';
import { useToast } from '../context/ToastContext';

export const LeadFormModal = ({ isOpen, onClose, lead, onSave }) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [countries, setCountries] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    // Fetch countries for dropdown
    const fetchCountries = async () => {
      try {
        const data = await getCountries();
        setCountries(data.filter(c => c.status === 'Active').map(c => c.name));
      } catch (err) {
        console.error('Error fetching countries:', err);
      }
    };

    if (isOpen) {
      fetchCountries();
      // Populate fields if editing
      if (lead) {
        reset({
          name: lead.name || '',
          email: lead.email || '',
          phone: lead.phone || '',
          countryInterest: lead.countryInterest || '',
          source: lead.source || 'Other',
          status: lead.status || 'Pending',
          notes: lead.notes || ''
        });
      } else {
        reset({
          name: '',
          email: '',
          phone: '',
          countryInterest: '',
          source: 'Other',
          status: 'Pending',
          notes: ''
        });
      }
    }
  }, [isOpen, lead, reset]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      if (lead) {
        // Update
        const updated = await updateLead(lead.id, data);
        toast.success('Lead updated successfully.');
        onSave(updated);
      } else {
        // Create
        const created = await createLead(data);
        toast.success('Lead created successfully.');
        onSave(created);
      }
      onClose();
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to save lead info.';
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const statusOptions = Object.values(LEAD_STATUS);
  const sourceOptions = Object.values(LEAD_SOURCES);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={lead ? 'Edit Lead Inquiries' : 'Add New Inquiry Lead'}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField
          label="Full Name"
          name="name"
          placeholder="e.g. John Doe"
          {...register('name', { required: 'Full name is required' })}
          error={errors.name}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label="Email Address"
            name="email"
            type="email"
            placeholder="e.g. john@example.com"
            {...register('email', {
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address'
              }
            })}
            error={errors.email}
          />
          <FormField
            label="Phone Number"
            name="phone"
            placeholder="e.g. +1 555-0199"
            {...register('phone')}
            error={errors.phone}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SelectField
            label="Country Interest"
            name="countryInterest"
            options={countries}
            emptyOptionText="Any Country"
            {...register('countryInterest')}
            error={errors.countryInterest}
          />
          <SelectField
            label="Lead Source"
            name="source"
            options={sourceOptions}
            {...register('source')}
            error={errors.source}
          />
          <SelectField
            label="Status"
            name="status"
            options={statusOptions}
            {...register('status')}
            error={errors.status}
          />
        </div>

        <FormField
          label="Inquiry Notes / Details"
          name="notes"
          type="textarea"
          placeholder="Enter details of applicant background or discussions..."
          {...register('notes')}
          error={errors.notes}
        />

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-sm font-medium text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-brand-500/10 flex items-center justify-center gap-1.5"
          >
            {submitting ? (
              <>
                <LoadingSpinner size="sm" className="border-white" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Lead</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// Exporting constants wrapper to easily load enums from constants
export default LeadFormModal;
