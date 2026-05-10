import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { bookingAPI } from '../utils/api';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import './MyBookings.css';

const STATUS_CONFIG = {
  Pending: { label: 'Pending', color: '#f5c842', bg: 'rgba(245,200,66,0.1)', border: 'rgba(245,200,66,0.3)', icon: '⏳' },
  Confirmed: { label: 'Confirmed', color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)', icon: '✅' },
  Completed: { label: 'Completed', color: '#6c63ff', bg: 'rgba(108,99,255,0.1)', border: 'rgba(108,99,255,0.3)', icon: '🎓' },
  Cancelled: { label: 'Cancelled', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', icon: '✕' }
};

const BookingCard = ({ booking, onStatusUpdate }) => {
  const [updating, setUpdating] = useState(false);
  const cfg = STATUS_CONFIG[booking.status] || STATUS_CONFIG.Pending;

  const handleCancel = async () => {
    if (!window.confirm('Cancel this booking?')) return;
    setUpdating(true);
    try {
      await bookingAPI.updateStatus(booking._id, 'Cancelled');
      onStatusUpdate(booking._id, 'Cancelled');
      toast.success('Booking cancelled');
    } catch (err) {
      toast.error(err.message || 'Failed to cancel');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="booking-card">
      <div className="booking-card-header">
        <div className="booking-expert-info">
          {booking.expert?.profileImage ? (
            <img src={booking.expert.profileImage} alt={booking.expert?.name} className="bc-avatar" />
          ) : (
            <div className="bc-avatar-fallback">{booking.expert?.name?.charAt(0)}</div>
          )}
          <div>
            <div className="bc-expert-name">{booking.expert?.name || 'Expert'}</div>
            <div className="bc-category">{booking.expert?.category}</div>
          </div>
        </div>
        <div
          className="bc-status"
          style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
        >
          <span>{cfg.icon}</span> {cfg.label}
        </div>
      </div>

      <div className="booking-card-body">
        <div className="bc-detail">
          <span className="bc-icon">📅</span>
          <span>{format(parseISO(booking.date), 'EEEE, MMMM d, yyyy')}</span>
        </div>
        <div className="bc-detail">
          <span className="bc-icon">🕐</span>
          <span>{booking.timeSlot} (60 min session)</span>
        </div>
        <div className="bc-detail">
          <span className="bc-icon">👤</span>
          <span>{booking.userName}</span>
        </div>
        {booking.notes && (
          <div className="bc-detail">
            <span className="bc-icon">📝</span>
            <span className="bc-notes">{booking.notes}</span>
          </div>
        )}
        <div className="bc-detail">
          <span className="bc-icon">💰</span>
          <span>${booking.totalAmount}</span>
        </div>
      </div>

      <div className="booking-card-footer">
        <div className="bc-meta">
          Booked {format(parseISO(booking.createdAt), 'MMM d, yyyy')}
        </div>
        {booking.status === 'Pending' && (
          <button
            className="cancel-btn"
            onClick={handleCancel}
            disabled={updating}
          >
            {updating ? 'Cancelling...' : 'Cancel Booking'}
          </button>
        )}
      </div>
    </div>
  );
};

const MyBookings = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [emailInput, setEmailInput] = useState('');
  const [email, setEmail] = useState('');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [searched, setSearched] = useState(false);

  // Pre-fill email from URL params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const emailParam = params.get('email');
    if (emailParam) {
      setEmailInput(emailParam);
      setEmail(emailParam);
      setSearched(true);
    }
  }, [location.search]);

  const fetchBookings = async (emailToUse, statusFilter, pageNum) => {
    if (!emailToUse) return;
    setLoading(true);
    setError(null);
    try {
      const params = { page: pageNum, limit: 10 };
      if (statusFilter !== 'All') params.status = statusFilter;
      const res = await bookingAPI.getByEmail(emailToUse, params);
      setBookings(res.data);
      setPagination(res.pagination);
    } catch (err) {
      setError(err.message || 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (email && searched) {
      fetchBookings(email, activeFilter, page);
    }
  }, [email, activeFilter, page, searched]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!emailInput.trim() || !/^\S+@\S+\.\S+$/.test(emailInput)) {
      toast.error('Please enter a valid email address');
      return;
    }
    setEmail(emailInput);
    setPage(1);
    setActiveFilter('All');
    setSearched(true);
    navigate(`/my-bookings?email=${emailInput}`, { replace: true });
  };

  const handleStatusUpdate = (bookingId, newStatus) => {
    setBookings(prev => prev.map(b =>
      b._id === bookingId ? { ...b, status: newStatus } : b
    ));
  };

  const filters = ['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled'];

  return (
    <div className="my-bookings-page">
      <div className="container">
        <div className="mb-hero">
          <h1 className="mb-title">My Bookings</h1>
          <p className="mb-subtitle">Enter your email to view all your booked sessions</p>
        </div>

        {/* Email search */}
        <form onSubmit={handleSearch} className="email-search-form">
          <div className="email-search-wrap">
            <span className="email-icon">📧</span>
            <input
              type="email"
              value={emailInput}
              onChange={e => setEmailInput(e.target.value)}
              placeholder="Enter your email address..."
              className="email-search-input"
            />
          </div>
          <button type="submit" className="email-search-btn">Find Bookings</button>
        </form>

        {/* Filters */}
        {searched && bookings.length > 0 && (
          <div className="status-filters">
            {filters.map(f => (
              <button
                key={f}
                className={`status-filter ${activeFilter === f ? 'active' : ''}`}
                onClick={() => { setActiveFilter(f); setPage(1); }}
              >
                {STATUS_CONFIG[f] && <span>{STATUS_CONFIG[f].icon}</span>}
                {f}
              </button>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="mb-loading">
            <div className="spinner" />
            <p>Fetching your bookings...</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="mb-error">
            <div>⚠️</div>
            <p>{error}</p>
            <button onClick={() => fetchBookings(email, activeFilter, page)} className="retry-btn">
              Retry
            </button>
          </div>
        )}

        {/* No results */}
        {searched && !loading && !error && bookings.length === 0 && (
          <div className="mb-empty">
            <div className="mb-empty-icon">📭</div>
            <h3>No bookings found</h3>
            <p>
              {activeFilter !== 'All'
                ? `No ${activeFilter.toLowerCase()} bookings for ${email}`
                : `No bookings found for ${email}`}
            </p>
            {activeFilter !== 'All' && (
              <button onClick={() => setActiveFilter('All')} className="retry-btn">
                Show All Bookings
              </button>
            )}
            <button onClick={() => navigate('/')} className="retry-btn">
              Browse Experts
            </button>
          </div>
        )}

        {/* Bookings list */}
        {!loading && !error && bookings.length > 0 && (
          <>
            <div className="mb-results-info">
              <span>{pagination?.totalItems} booking{pagination?.totalItems !== 1 ? 's' : ''} for <strong>{email}</strong></span>
            </div>

            <div className="bookings-list">
              {bookings.map(booking => (
                <BookingCard
                  key={booking._id}
                  booking={booking}
                  onStatusUpdate={handleStatusUpdate}
                />
              ))}
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="pagination">
                <button className="page-btn" disabled={!pagination.hasPrevPage} onClick={() => setPage(p => p - 1)}>← Prev</button>
                <span className="page-info">{page} / {pagination.totalPages}</span>
                <button className="page-btn" disabled={!pagination.hasNextPage} onClick={() => setPage(p => p + 1)}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MyBookings;
