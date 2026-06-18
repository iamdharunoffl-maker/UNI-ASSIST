import React from 'react';
import { HiChevronLeft, HiChevronRight, HiChevronUpDown, HiChevronUp, HiChevronDown } from 'react-icons/hi2';
import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';

export const DataTable = ({
  columns = [],
  data = [],
  loading = false,
  // Pagination
  total = 0,
  page = 1,
  limit = 10,
  totalPages = 1,
  onPageChange,
  onLimitChange,
  // Sorting
  sortBy,
  sortOrder,
  onSort,
  // Empty state actions
  emptyStateTitle,
  emptyStateDescription,
  emptyStateAction,
}) => {
  const renderSortIcon = (columnKey) => {
    if (!onSort) return null;
    if (sortBy !== columnKey) {
      return <HiChevronUpDown className="w-4 h-4 ml-1 text-slate-400 group-hover:text-slate-600 transition-colors" />;
    }
    return sortOrder === 'asc' 
      ? <HiChevronUp className="w-4 h-4 ml-1 text-brand-600" />
      : <HiChevronDown className="w-4 h-4 ml-1 text-brand-600" />;
  };

  return (
    <div className="w-full bg-white border border-slate-100 rounded-3xl shadow-soft overflow-hidden flex flex-col">
      {/* Table Container */}
      <div className="overflow-x-auto min-h-[300px] relative">
        {loading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center z-10 animate-fade-in">
            <LoadingSpinner size="lg" />
          </div>
        )}

        <table className="w-full border-collapse text-left text-sm text-slate-600">
          <thead className="bg-slate-50/70 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 sticky top-0 backdrop-blur-md z-5">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-6 py-4 font-semibold select-none ${col.sortable && onSort ? 'cursor-pointer group hover:text-slate-800 transition-colors' : ''} ${col.className || ''}`}
                  onClick={() => col.sortable && onSort && onSort(col.key)}
                >
                  <div className="flex items-center">
                    <span>{col.label}</span>
                    {col.sortable && renderSortIcon(col.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-sans">
            {!loading && data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12">
                  <EmptyState 
                    title={emptyStateTitle} 
                    description={emptyStateDescription} 
                    actionButton={emptyStateAction}
                  />
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr 
                  key={row.id || rowIndex} 
                  className="hover:bg-slate-50/80 transition-colors duration-150"
                >
                  {columns.map((col) => (
                    <td 
                      key={col.key} 
                      className={`px-6 py-3.5 align-middle ${col.className || ''}`}
                    >
                      {col.render ? col.render(row) : (row[col.key] ?? '-')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {data.length > 0 && (
        <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 font-sans text-slate-500">
          {/* Limit selector */}
          <div className="flex items-center gap-2 text-sm">
            <span>Show</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange && onLimitChange(Number(e.target.value))}
              className="bg-white border border-slate-200 text-slate-700 py-1.5 px-3 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all shadow-xs"
            >
              {[5, 10, 25, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span>records</span>
          </div>

          {/* Counts */}
          <div className="text-sm">
            Showing <span className="font-semibold text-slate-800">{(page - 1) * limit + 1}</span> to{' '}
            <span className="font-semibold text-slate-800">
              {Math.min(page * limit, total)}
            </span>{' '}
            of <span className="font-semibold text-slate-800">{total}</span> entries
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange && onPageChange(page - 1)}
              disabled={page === 1 || loading}
              className="p-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-50 disabled:hover:bg-white disabled:cursor-not-allowed transition-all shadow-xs"
            >
              <HiChevronLeft className="w-4 h-4" />
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .map((p, idx, arr) => {
                const prev = arr[idx - 1];
                const showEllipsis = prev && p - prev > 1;

                return (
                  <React.Fragment key={p}>
                    {showEllipsis && <span className="px-2 text-slate-400">...</span>}
                    <button
                      onClick={() => onPageChange && onPageChange(p)}
                      disabled={loading}
                      className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                        page === p
                          ? 'bg-brand-600 text-white shadow-md shadow-brand-500/10'
                          : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                );
              })}

            <button
              onClick={() => onPageChange && onPageChange(page + 1)}
              disabled={page === totalPages || loading}
              className="p-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-50 disabled:hover:bg-white disabled:cursor-not-allowed transition-all shadow-xs"
            >
              <HiChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
