import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import SelectField from '../components/SelectField';
import LoadingSpinner from '../components/LoadingSpinner';
import { getCountries, getUniversities, getCourses } from '../services/masterService';
import { isActive } from '../utils/status';
import { createStudent, updateStudent } from '../services/studentService';
import { STUDENT_STATUS } from '../config/constants';
import { useToast } from '../context/ToastContext';

export const StudentFormModal = ({ isOpen, onClose, student, onSave }) => {
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm();
  const [submitting, setSubmitting] = useState(false);
  
  // Masters state
  const [countries, setCountries] = useState([]);
  const [allUniversities, setAllUniversities] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  
  // Cascaded filtered dropdown lists
  const [filteredUnis, setFilteredUnis] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  
  const toast = useToast();
  
  // Watch fields for cascading
  const selectedCountry = watch('country');
  const selectedUniversity = watch('university');

  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const [countriesData, unisData, coursesData] = await Promise.all([
          getCountries(),
          getUniversities(),
          getCourses()
        ]);
        
        setCountries(countriesData.filter(isActive));
        setAllUniversities(unisData.filter(isActive));
        setAllCourses(coursesData.filter(isActive));
      } catch (err) {
        console.error('Error fetching masters data:', err);
      }
    };
    
    if (isOpen) {
      fetchMasters();
    }
  }, [isOpen]);

  // Handle Country selection change
  useEffect(() => {
    if (selectedCountry) {
      const filtered = allUniversities.filter(u => u.country === selectedCountry);
      setFilteredUnis(filtered);
    } else {
      setFilteredUnis([]);
    }
  }, [selectedCountry, allUniversities]);

  // Handle University selection change
  useEffect(() => {
    if (selectedUniversity) {
      const filtered = allCourses.filter(c => ((c.university || '')
        .toString()
        .trim()
        .toLowerCase()) === ((selectedUniversity || '')
          .toString()
          .trim()
          .toLowerCase()));
      setFilteredCourses(filtered);
    } else {
      setFilteredCourses([]);
    }
  }, [selectedUniversity, allCourses]);

  // Reset form data when opening modal
  useEffect(() => {
    if (isOpen) {
      if (student) {
        reset({
          name: student.name || '',
          email: student.email || '',
          phone: student.phone || '',
          country: student.country || '',
          university: student.university || '',
          course: student.course || '',
          intake: student.intake || '',
          status: student.status || 'Applied'
        });
      } else {
        reset({
          name: '',
          email: '',
          phone: '',
          country: '',
          university: '',
          course: '',
          intake: '',
          status: 'Applied'
        });
      }
    }
  }, [isOpen, student, reset]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      if (student) {
        const updated = await updateStudent(student.id, data);
        toast.success('Student record updated successfully.');
        onSave(updated);
      } else {
        const created = await createStudent(data);
        toast.success('Student record created successfully.');
        onSave(created);
      }
      onClose();
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to save student details.';
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const statusOptions = Object.values(STUDENT_STATUS);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={student ? 'Edit Student Admission File' : 'Add New Enrolled Student'}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField
          label="Full Name"
          name="name"
          placeholder="e.g. Alice Smith"
          {...register('name', { required: 'Full name is required' })}
          error={errors.name}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label="Email Address"
            name="email"
            type="email"
            placeholder="e.g. alice@example.com"
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
            placeholder="e.g. +1 555-0188"
            {...register('phone')}
            error={errors.phone}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SelectField
            label="Country Destination"
            name="country"
            options={countries.map(c => c.name)}
            emptyOptionText="Select Country"
            {...register('country', { required: 'Country is required' })}
            error={errors.country}
          />
          <SelectField
            label="University"
            name="university"
            options={filteredUnis.map(u => u.name)}
            emptyOptionText={selectedCountry ? 'Select University' : 'Choose Country First'}
            disabled={!selectedCountry}
            {...register('university')}
            error={errors.university}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SelectField
            label="Course Program"
            name="course"
            options={filteredCourses.map(c => c.name)}
            emptyOptionText={selectedUniversity ? 'Select Course' : 'Choose University First'}
            disabled={!selectedUniversity}
            {...register('course')}
            error={errors.course}
          />
          <FormField
            label="Intake Term"
            name="intake"
            placeholder="e.g. Fall 2026, Spring 2027"
            {...register('intake')}
            error={errors.intake}
          />
        </div>

        <SelectField
          label="Admissions Status"
          name="status"
          options={statusOptions}
          {...register('status')}
          error={errors.status}
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
              <span>Save Student</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default StudentFormModal;
