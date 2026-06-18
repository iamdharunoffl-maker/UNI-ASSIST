import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { HiCog } from 'react-icons/hi2';
import { getConfig, updateConfig } from '../services/masterService';
import useAuth from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import FormField from '../components/FormField';
import SelectField from '../components/SelectField';
import LoadingSpinner from '../components/LoadingSpinner';

export const SettingsPage = () => {
  const { isAdmin } = useAuth();
  const { register, handleSubmit, reset } = useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true);
      try {
        const data = await getConfig();
        reset({
          companyName: data.companyName || '',
          currency: data.currency || 'USD',
          allowLeadDeletion: data.allowLeadDeletion || 'true',
          autoBackupInterval: data.autoBackupInterval || '30'
        });
      } catch (err) {
        toast.error('Failed to load system configurations.');
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, [reset]);

  const onSubmit = async (data) => {
    if (!isAdmin) {
      toast.error('Access denied. Admin privileges required.');
      return;
    }
    setSaving(true);
    try {
      await updateConfig(data);
      toast.success('System configurations updated successfully.');
    } catch (err) {
      toast.error('Failed to update configurations.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl bg-white border border-slate-100 rounded-3xl p-8 shadow-soft flex flex-col gap-6">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
        <div className="p-3 bg-brand-50 rounded-2xl text-brand-600">
          <HiCog className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">System Configurations</h2>
          <p className="text-xs text-slate-500 font-medium font-sans">
            Configure consultancy parameters, currency options, and file backup routines.
          </p>
        </div>
      </div>

      {!isAdmin && (
        <div className="p-4 bg-amber-50 border border-amber-200/60 text-amber-800 text-xs font-semibold rounded-2xl font-sans leading-relaxed">
          IMPORTANT: You are logged in with a read-only account. Adjusting settings requires administrator privileges.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <FormField
          label="Agency / Company Name"
          name="companyName"
          placeholder="e.g. Uni Assist Consultancy"
          disabled={!isAdmin}
          {...register('companyName')}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <SelectField
            label="System Currency"
            name="currency"
            options={['USD', 'GBP', 'EUR', 'AUD', 'CAD', 'INR']}
            disabled={!isAdmin}
            {...register('currency')}
          />
          <SelectField
            label="Auto Backup Interval"
            name="autoBackupInterval"
            options={[
              { value: '15', label: 'Every 15 Minutes' },
              { value: '30', label: 'Every 30 Minutes' },
              { value: '60', label: 'Every 1 Hour' },
              { value: '180', label: 'Every 3 Hours' }
            ]}
            disabled={!isAdmin}
            {...register('autoBackupInterval')}
          />
        </div>

        <SelectField
          label="Allow Inquiries deletion"
          name="allowLeadDeletion"
          options={[
            { value: 'true', label: 'Yes (Permissive)' },
            { value: 'false', label: 'No (Protected)' }
          ]}
          disabled={!isAdmin}
          {...register('allowLeadDeletion')}
        />

        {isAdmin && (
          <div className="flex justify-end pt-4 border-t border-slate-100 mt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-brand-500/10 flex items-center justify-center gap-1.5"
            >
              {saving ? (
                <>
                  <LoadingSpinner size="sm" className="border-white" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Settings</span>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default SettingsPage;
