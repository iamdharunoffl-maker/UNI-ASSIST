import React, { useState, useEffect } from 'react';
import { HiUserPlus, HiArrowDownTray, HiPencilSquare, HiTrash } from 'react-icons/hi2';
import { getStudents, deleteStudent, exportStudents } from '../services/studentService';
import { getCountries, getUniversities } from '../services/masterService';
import { isActive } from '../utils/status';
import useTable from '../hooks/useTable';
import { useToast } from '../context/ToastContext';
import SearchBar from '../components/SearchBar';
import FilterPanel from '../components/FilterPanel';
import DataTable from '../components/DataTable';
import ConfirmDialog from '../components/ConfirmDialog';
import StudentFormModal from './StudentFormModal';
import { STUDENT_STATUS } from '../config/constants';

export const StudentsPage = () => {
  const {
    data: students,
    loading,
    total,
    page,
    limit,
    totalPages,
    search,
    sortBy,
    sortOrder,
    filters,
    fetchItems,
    handlePageChange,
    handleLimitChange,
    handleSort,
    handleFilterChange,
    handleSearchChange,
    resetFilters
  } = useTable(getStudents);

  const [countries, setCountries] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [exporting, setExporting] = useState(false);
  
  const toast = useToast();

  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const [countriesData, unisData] = await Promise.all([
          getCountries(),
          getUniversities()
        ]);
        setCountries(countriesData.filter(isActive).map(c => c.name));
        setUniversities(unisData.filter(isActive).map(u => u.name));
      } catch (err) {
        console.error('Error fetching masters filter lists:', err);
      }
    };
    fetchMasters();
  }, []);

  const handleCreate = () => {
    setSelectedStudent(null);
    setIsFormOpen(true);
  };

  const handleEdit = (student) => {
    setSelectedStudent(student);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await deleteStudent(deleteId);
      toast.success('Student file deleted successfully.');
      fetchItems();
    } catch (err) {
      toast.error('Failed to delete student.');
    } finally {
      setDeleteId(null);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportStudents();
      toast.success('Students spreadsheet downloaded successfully.');
    } catch (err) {
      toast.error('Failed to export students data.');
    } finally {
      setExporting(false);
    }
  };

  const isAnyFilterActive = !!(search || filters.status || filters.country || filters.university || filters.intake);

  const columns = [
    { key: 'id', label: 'Student ID', sortable: true, className: 'w-28 font-semibold text-slate-800' },
    { key: 'name', label: 'Name', sortable: true, className: 'capitalize font-semibold text-slate-800' },
    {
      key: 'contact',
      label: 'Contact Info',
      render: (row) => (
        <div className="flex flex-col gap-0.5 text-xs text-slate-500 font-sans">
          <span>{row.email || '-'}</span>
          <span>{row.phone || '-'}</span>
        </div>
      )
    },
    { key: 'country', label: 'Country', sortable: true },
    {
      key: 'education',
      label: 'University & Course',
      render: (row) => (
        <div className="flex flex-col gap-0.5 text-xs text-slate-700">
          <span className="font-semibold">{row.university || '-'}</span>
          <span className="text-slate-500 font-sans">{row.course || '-'}</span>
        </div>
      )
    },
    { key: 'intake', label: 'Intake', sortable: true, render: (row) => row.intake || '-' },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (row) => {
        const statusColors = {
          'Applied': 'text-blue-700 bg-blue-50 ring-1 ring-blue-600/10',
          'Admitted': 'text-purple-700 bg-purple-50 ring-1 ring-purple-600/10',
          'Visa Approved': 'text-emerald-700 bg-emerald-50 ring-1 ring-emerald-600/10',
          'Visa Rejected': 'text-rose-700 bg-rose-50 ring-1 ring-rose-600/10',
          'Enrolled': 'text-teal-700 bg-teal-50 ring-1 ring-teal-600/10',
        };
        return (
          <span className={`text-xxs font-bold px-2 py-0.5 rounded-lg inline-block ${statusColors[row.status] || 'text-slate-600 bg-slate-50'}`}>
            {row.status}
          </span>
        );
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      className: 'w-24 text-right',
      render: (row) => (
        <div className="flex justify-end gap-1.5">
          <button
            onClick={() => handleEdit(row)}
            className="p-1 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors focus:outline-none"
            title="Edit Student"
          >
            <HiPencilSquare className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteClick(row.id)}
            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors focus:outline-none"
            title="Delete Student"
          >
            <HiTrash className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Top Actions Panel */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <SearchBar 
          value={search} 
          onChange={handleSearchChange} 
          placeholder="Search student ID, name, course, university..." 
        />
        
        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={handleExport}
            disabled={exporting || students.length === 0}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 text-sm font-semibold text-slate-700 bg-white rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-all focus:outline-none"
          >
            <HiArrowDownTray className="w-4.5 h-4.5 text-slate-400" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={handleCreate}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-sm font-semibold text-white rounded-xl shadow-md shadow-brand-500/10 transition-all focus:outline-none"
          >
            <HiUserPlus className="w-4.5 h-4.5" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      <FilterPanel onReset={resetFilters} isAnyFilterActive={isAnyFilterActive}>
        <div className="flex flex-col gap-1">
          <label className="text-xxs font-bold uppercase tracking-wider text-slate-400 font-sans">Status</label>
          <select
            value={filters.status || ''}
            onChange={(e) => handleFilterChange({ status: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">All Statuses</option>
            {Object.values(STUDENT_STATUS).map(st => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xxs font-bold uppercase tracking-wider text-slate-400 font-sans">Destination Country</label>
          <select
            value={filters.country || ''}
            onChange={(e) => handleFilterChange({ country: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">All Countries</option>
            {countries.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xxs font-bold uppercase tracking-wider text-slate-400 font-sans">University</label>
          <select
            value={filters.university || ''}
            onChange={(e) => handleFilterChange({ university: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">All Universities</option>
            {universities.map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xxs font-bold uppercase tracking-wider text-slate-400 font-sans">Intake Term</label>
          <input
            type="text"
            value={filters.intake || ''}
            placeholder="e.g. Fall 2026"
            onChange={(e) => handleFilterChange({ intake: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500 placeholder-slate-400"
          />
        </div>
      </FilterPanel>

      {/* Students Data Table */}
      <DataTable
        columns={columns}
        data={students}
        loading={loading}
        total={total}
        page={page}
        limit={limit}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        emptyStateTitle="No student files found"
        emptyStateDescription="Student profiles are created by converting a lead inquirer to 'Confirmed' status or adding them manually."
        emptyStateAction={
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-xs font-semibold text-white rounded-xl transition-colors focus:outline-none"
          >
            <HiUserPlus className="w-4 h-4" />
            <span>Add Student File</span>
          </button>
        }
      />

      {/* Form Modal */}
      <StudentFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        student={selectedStudent}
        onSave={fetchItems}
      />

      {/* Confirm Deletion */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Student File"
        message="Are you sure you want to delete this student file? This operation cannot be undone and will erase all admission tracking data for this student."
      />
    </div>
  );
};

export default StudentsPage;
