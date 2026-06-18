import { useState, useEffect, useCallback } from 'react';
import useDebounce from './useDebounce';

export const useTable = (fetchDataFn, initialFilters = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);

  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filters, setFilters] = useState(initialFilters);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        search: debouncedSearch,
        sortBy,
        sortOrder,
        ...filters
      };
      const response = await fetchDataFn(params);
      setData(response.data || []);
      setTotal(response.total || 0);
      setTotalPages(response.totalPages || 0);
    } catch (error) {
      console.error('Error fetching table data:', error);
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [fetchDataFn, page, limit, debouncedSearch, sortBy, sortOrder, filters]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setPage(1); // Reset to first page
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1);
  };

  const handleSearchChange = (value) => {
    setSearch(value);
    setPage(1);
  };

  const resetFilters = () => {
    setFilters(initialFilters);
    setSearch('');
    setPage(1);
  };

  return {
    data,
    loading,
    total,
    page,
    limit,
    totalPages,
    search,
    sortBy,
    sortOrder,
    filters,
    setData,
    fetchItems,
    handlePageChange,
    handleLimitChange,
    handleSort,
    handleFilterChange,
    handleSearchChange,
    resetFilters
  };
};

export default useTable;
