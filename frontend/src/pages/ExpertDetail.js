import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { expertAPI } from '../utils/api';
import { useSocket } from '../context/SocketContext';
import { format, parseISO } from 'date-fns';
import './ExpertDetail.css';

const ExpertDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();

  const [expert, setExpert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [liveUpdated, setLiveUpdated] = useState(false);

  const fetchExpert = useCallback(async () => {
    try {
      setError(null);
      const res = await expertAPI.getById(id);
      setExpert(res.data);
      if (res.data.availability?.length > 0) {
        setSelectedDate(res.data.availability[0].date);
      }
    } catch (err) {
      setError(err.message || 'Failed to load expert details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchExpert(); }, [fetchExpert]);

  // Real-time Socket.io updates
  useEffect(() => {
    if (!socket || !id) return;

    socket.emit('join-expert-room', id);

    const handleSlotBooked = ({ expertId, date, timeSlot }) => {
      if (expertId !== id) return;
      setExpert(prev => {
        if (!prev) return prev;
        const updated = { ...prev };
        updated.availability = updated.availability.map(day => {
          if (day.date !== date) return day;
          return {
            ...day,
            slots: day.slots.map(s =>
              s.time === timeSlot ? { ...s, isBooked: true } : s
            )
          };
        });
        return updated;
      });
      setLiveUpdated(true);
      setTimeout(() => setLiveUpdated(false), 3000);
    };

    const handleSlotFreed = ({ expertId, date, timeSlot }) => {
      if (expertId !== id) return;
      setExpert(prev => {
        if (!prev) return prev;
        const updated = { ...prev };
        updated.availability = updated.availability.map(day => {
          if (day.date !== date) return day;
          return {
            ...day,
            slots: day.slots.map(s =>
              s.time === timeSlot ? { ...s, isBooked: false } : s
            )
          };
        });
        return updated;
      });
    };

    socket.on('slot-booked', handleSlotBooked);
    socket.on('slot-freed', handleSlotFreed);

    return () => {
      socket.emit('leave-expert-room', id);
      socket.off('slot-booked', handleSlotBooked);
      socket.off('slot-freed', handleSlotFreed);
    };
  }, [socket, id]);

  if (loading) return (
    <div className="detail-loading">
      <div className="spinner" />
      <p>Loading expert profile...</p>
    </div>
  );

  if (error) return (
    <div className="detail-error">
      <div className="error-icon">⚠️</div>
      <h3>Failed to load</h3>
      <p>{error}</p>
      <button onClick={fetchExpert} className="btn-primary">Retry</button>
      <button onClick={() => navigate(-1)} className="btn-secondary">Go Back</button>
    </div>
  );

  if (!expert) return null;

  const selectedDayData = expert.availability?.find(a => a.date === selectedDate);
  const availableSlots = selectedDayData?.slots || [];

  const formatDate = (dateStr) => {
    try { return format(parseISO(dateStr), 'EEE, MMM d'); }
    catch { return dateStr; }
  };

  return (
    <div className="detail-page">
      <div className="container">
        <button className="back-btn" onClick={() => navigate(-1)}>← Back to Experts</button>

        {liveUpdated && (
          <div className="live-toast">🔴 Slots updated in real-time</div>
        )}

        {/* Expert Header */}
        <div className="detail-header">
          <div className="detail-avatar-wrap">
            {expert.profileImage ? (
              <img src={expert.profileImage} alt={expert.name} className="detail-avatar" />
            ) : (
              <div className="detail-avatar-fallback">{expert.name.charAt(0)}</div>
            )}
          </div>

          <div className="detail-info">
            <div className="detail-category">{expert.category}</div>
            <h1 className="detail-name">{expert.name}</h1>

            <div className="detail-stats">
              <div className="stat">
                <span className="stat-icon">⭐</span>
                <span className="stat-val">{expert.rating.toFixed(1)}</span>
                <span className="stat-label">({expert.totalReviews} reviews)</span>
              </div>
              <div className="stat">
                <span className="stat-icon">🏆</span>
                <span className="stat-val">{expert.experience} years</span>
                <span className="stat-label">experience</span>
              </div>
              <div className="stat">
                <span className="stat-icon">💰</span>
                <span className="stat-val">${expert.hourlyRate}</span>
                <span className="stat-label">per session</span>
              </div>
            </div>

            {expert.languages?.length > 0 && (
              <div className="detail-langs">
                <span className="detail-label">Languages:</span>
                {expert.languages.map(lang => (
                  <span key={lang} className="lang-tag">{lang}</span>
                ))}
              </div>
            )}

            {expert.skills?.length > 0 && (
              <div className="detail-skills">
                {expert.skills.map(skill => (
                  <span key={skill} className="skill-pill">{skill}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="detail-grid">
          {/* Bio */}
          <div className="detail-bio-card">
            <h2 className="section-title">About</h2>
            <p className="bio-text">{expert.bio}</p>
          </div>

          {/* Availability */}
          <div className="availability-card">
            <div className="avail-header">
              <h2 className="section-title">Available Sessions</h2>
              <span className="live-badge">🔴 LIVE</span>
            </div>
            <p className="avail-subtitle">Slots update in real-time as others book</p>

            {expert.availability?.length === 0 ? (
              <div className="no-slots">No available dates found</div>
            ) : (
              <>
                {/* Date tabs */}
                <div className="date-tabs">
                  {expert.availability.map(day => (
                    <button
                      key={day.date}
                      className={`date-tab ${selectedDate === day.date ? 'active' : ''}`}
                      onClick={() => setSelectedDate(day.date)}
                    >
                      <span className="date-tab-day">{format(parseISO(day.date), 'EEE')}</span>
                      <span className="date-tab-date">{format(parseISO(day.date), 'MMM d')}</span>
                      <span className="date-tab-available">
                        {day.slots.filter(s => !s.isBooked).length} free
                      </span>
                    </button>
                  ))}
                </div>

                {/* Time slots */}
                <div className="slots-section">
                  <div className="slots-date-header">{selectedDate ? formatDate(selectedDate) : ''}</div>
                  <div className="slots-grid">
                    {availableSlots.length === 0 ? (
                      <p className="no-slots">No slots for this day</p>
                    ) : (
                      availableSlots.map(slot => (
                        <div
                          key={slot.time}
                          className={`slot-chip ${slot.isBooked ? 'booked' : 'available'}`}
                        >
                          <span className="slot-time">{slot.time}</span>
                          <span className="slot-status">
                            {slot.isBooked ? '✗ Booked' : '✓ Free'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}

            <button
              className="book-session-btn"
              onClick={() => navigate(`/book/${expert._id}`)}
              disabled={!expert.availability?.some(d => d.slots.some(s => !s.isBooked))}
            >
              Book a Session →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpertDetail;
