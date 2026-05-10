import React, { useState, useEffect, useCallback } from 'react';
import { expertAPI } from '../utils/api';
import ExpertCard from '../components/ExpertCard';
import './ExpertsList.css';

const CATEGORIES = ['All', 'Technology', 'Business', 'Design', 'Marketing', 'Finance', 'Health', 'Legal', 'Education'];

const SkeletonCard = () => (
  <div className="skeleton-card">
    <div className="sk sk-avatar" />
    <div className="sk sk-line w60" />
    <div className="sk sk-line w40" />
    <div className="sk sk-line w100" />
    <div className="sk sk-line w80" />
    <div className="sk sk-footer" />
  </div>
);

const ExpertsList = () => {
  const [experts, setExperts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [category, setCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('rating');

  const fetchExperts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page: currentPage, limit: 8, sortBy, order: 'desc' };
      if (category !== 'All') params.category = category;
      if (search) params.search = search;

      const res = await expertAPI.getAll(params);
      setExperts(res.data);
      setPagination(res.pagination);
    } catch (err) {
      setError(err.message || 'Failed to load experts. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, category, search, sortBy]);

  useEffect(() => { fetchExperts(); }, [fetchExperts]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleCategoryChange = (cat) => {
    setCategory(cat);
    setCurrentPage(1);
  };

  return (
    <div className="experts-page">
      {/* Hero */}
      <div className="experts-hero">
        <div className="container">
          <div className="hero-badge">🚀 Real-Time Booking</div>
          <h1 className="hero-title">
            Connect with<br />
            <span className="gradient-text">World-Class Experts</span>
          </h1>
          <p className="hero-subtitle">
            Book 1-on-1 sessions with vetted professionals. Slots update live—never miss an opening.
          </p>

          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="Search by name, skill, or keyword..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <button className="search-clear" onClick={() => { setSearchInput(''); setSearch(''); }}>✕</button>
            )}
          </div>
        </div>
      </div>

      <div className="container experts-body">
        {/* Filters */}
        <div className="filters-bar">
          <div className="categories-scroll">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`cat-btn ${category === cat ? 'active' : ''}`}
                onClick={() => handleCategoryChange(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="sort-wrap">
            <label className="sort-label">Sort:</label>
            <select
              className="sort-select"
              value={sortBy}
              onChange={e => { setSortBy(e.target.value); setCurrentPage(1); }}
            >
              <option value="rating">Top Rated</option>
              <option value="experience">Most Experienced</option>
              <option value="hourlyRate">Price: Low to High</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>
        </div>

        {/* Results info */}
        {!loading && !error && pagination && (
          <div className="results-info">
            Showing <strong>{experts.length}</strong> of <strong>{pagination.totalItems}</strong> experts
            {search && <span> for "<em>{search}</em>"</span>}
            {category !== 'All' && <span> in <em>{category}</em></span>}
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <h3>Something went wrong</h3>
            <p>{error}</p>
            <button className="retry-btn" onClick={fetchExperts}>Try Again</button>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="experts-grid">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && experts.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3>No experts found</h3>
            <p>Try adjusting your search or filters</p>
            <button className="retry-btn" onClick={() => { setSearch(''); setSearchInput(''); setCategory('All'); }}>
              Clear Filters
            </button>
          </div>
        )}

        {/* Experts grid */}
        {!loading && !error && experts.length > 0 && (
          <div className="experts-grid">
            {experts.map(expert => (
              <ExpertCard key={expert._id} expert={expert} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && pagination && pagination.totalPages > 1 && (
          <div className="pagination">
            <button
              className="page-btn"
              disabled={!pagination.hasPrevPage}
              onClick={() => setCurrentPage(p => p - 1)}
            >← Prev</button>

            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                className={`page-btn page-num ${currentPage === page ? 'active' : ''}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}

            <button
              className="page-btn"
              disabled={!pagination.hasNextPage}
              onClick={() => setCurrentPage(p => p + 1)}
            >Next →</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpertsList;
