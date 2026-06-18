import React, { useState, useEffect } from 'react';
import { HiUserPlus, HiArrowDownTray, HiPencilSquare, HiTrash } from 'react-icons/hi2';
import { getLeads, deleteLead, exportLeads } from '../services/leadService';
import { getCountries } from '../services/masterService';
import { isActive } from '../utils/status';
import useTable from '../hooks/useTable';
import { useToast } from '../context/ToastContext';
import SearchBar from '../components/SearchBar';
import FilterPanel from '../components/FilterPanel';
import DataTable from '../components/DataTable';
import ConfirmDialog from '../components/ConfirmDialog';
import LeadFormModal from './LeadFormModal';
import { LEAD_STATUS, LEAD_SOURCES } from '../config/constants';

export const LeadsPage = () => {
  const {
    data: leads,
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
  } = useTable(getLeads);

  const [countries, setCountries] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [exporting, setExporting] = useState(false);
  
  const toast = useToast();

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const data = await getCountries();
        setCountries(data.filter(isActive).map(c => c.name));
      } catch (err) {
        console.error('Error fetching countries:', err);
      }
    };
    fetchCountries();
  }, []);

  const handleCreate = () => {
    setSelectedLead(null);
    setIsFormOpen(true);
  };

  const handleEdit = (lead) => {
    setSelectedLead(lead);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await deleteLead(deleteId);
      toast.success('Lead deleted successfully.');
      fetchItems();
    } catch (err) {
      toast.error('Failed to delete lead.');
    } finally {
      setDeleteId(null);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportLeads();
      toast.success('Leads spreadsheet downloaded successfully.');
    } catch (err) {
      toast.error('Failed to export leads.');
    } finally {
      setExporting(false);
    }
  };

  const isAnyFilterActive = !!(search || filters.status || filters.source || filters.countryInterest);

  const columns = [
    { key: 'id', label: 'ID', sortable: true, className: 'w-24 font-semibold text-slate-800' },
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
    { key: 'countryInterest', label: 'Country Interest', sortable: true, render: (row) => row.countryInterest || 'Any' },
    { key: 'source', label: 'Source', sortable: true },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (row) => {
        const statusColors = {
          'Pending': 'text-blue-700 bg-blue-50 ring-1 ring-blue-600/10',
          'Follow-up': 'text-amber-700 bg-amber-50 ring-1 ring-amber-600/10',
          'Closed': 'text-slate-600 bg-slate-50 ring-1 ring-slate-600/10',
          'Confirmed': 'text-emerald-700 bg-emerald-50 ring-1 ring-emerald-600/10',
        };
        return (
          <span className={`text-xxs font-bold px-2 py-0.5 rounded-lg inline-block ${statusColors[row.status] || 'text-slate-600 bg-slate-50'}`}>
            {row.status}
          </span>
        );
      }
    },
    {
      key: 'createdAt',
      label: 'Created At',
      sortable: true,
      render: (row) => (
        <span className="text-xs text-slate-400 font-sans">
          {row.createdAt ? row.createdAt.slice(0, 10) : '-'}
        </span>
      )
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
            title="Edit Lead"
          >
            <HiPencilSquare className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteClick(row.id)}
            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors focus:outline-none"
            title="Delete Lead"
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
          placeholder="Search leads name, email, phone..." 
        />
        
        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={handleExport}
            disabled={exporting || leads.length === 0}
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
            <span>Add Lead</span>
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
            {Object.values(LEAD_STATUS).map(st => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xxs font-bold uppercase tracking-wider text-slate-400 font-sans">Source</label>
          <select
            value={filters.source || ''}
            onChange={(e) => handleFilterChange({ source: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">All Sources</option>
            {Object.values(LEAD_SOURCES).map(src => (
              <option key={src} value={src}>{src}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xxs font-bold uppercase tracking-wider text-slate-400 font-sans">Country Interest</label>
          <select
            value={filters.countryInterest || ''}
            onChange={(e) => handleFilterChange({ countryInterest: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">All Countries</option>
            {countries.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </FilterPanel>

      {/* Leads Grid Data Table */}
      <DataTable
        columns={columns}
        data={leads}
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
        emptyStateTitle="No lead inquiries found"
        emptyStateDescription="Get started by creating your first lead inquiry or adjusting the active filters."
        emptyStateAction={
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-xs font-semibold text-white rounded-xl transition-colors focus:outline-none"
          >
            <HiUserPlus className="w-4 h-4" />
            <span>Create First Lead</span>
          </button>
        }
      />

      {/* Form Modal */}
      <LeadFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        lead={selectedLead}
        onSave={fetchItems}
      />

      {/* Confirm Deletion */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Lead Inquire"
        message="Are you sure you want to delete this lead? This operation cannot be undone and the record will be removed from the database."
      />
    </div>
  );
};

export default LeadsPage;
