import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { expertAPI, bookingAPI } from '../utils/api';
import { useSocket } from '../context/SocketContext';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import './BookingForm.css';

const BookingForm = () => {
  const { expertId } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();

  const [expert, setExpert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const [form, setForm] = useState({
    userName: '',
    userEmail: '',
    userPhone: '',
    date: '',
    timeSlot: '',
    notes: ''
  });

  useEffect(() => {
    const fetchExpert = async () => {
      try {
        const res = await expertAPI.getById(expertId);
        setExpert(res.data);
      } catch (err) {
        toast.error('Failed to load expert');
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    fetchExpert();
  }, [expertId, navigate]);

  // Real-time slot updates while on booking form
  useEffect(() => {
    if (!socket || !expertId) return;
    socket.emit('join-expert-room', expertId);

    const handleSlotBooked = ({ expertId: eid, date, timeSlot }) => {
      if (eid !== expertId) return;
      setExpert(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          availability: prev.availability.map(day =>
            day.date !== date ? day : {
              ...day,
              slots: day.slots.map(s =>
                s.time === timeSlot ? { ...s, isBooked: true } : s
              )
            }
          )
        };
      });
      if (form.date === date && form.timeSlot === timeSlot) {
        setForm(f => ({ ...f, timeSlot: '' }));
        toast.error('That slot was just booked! Please pick another.', { icon: '⚡' });
      }
    };

    const handleSlotFreed = ({ expertId: eid, date, timeSlot }) => {
      if (eid !== expertId) return;
      setExpert(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          availability: prev.availability.map(day =>
            day.date !== date ? day : {
              ...day,
              slots: day.slots.map(s =>
                s.time === timeSlot ? { ...s, isBooked: false } : s
              )
            }
          )
        };
      });
    };

    socket.on('slot-booked', handleSlotBooked);
    socket.on('slot-freed', handleSlotFreed);

    return () => {
      socket.emit('leave-expert-room', expertId);
      socket.off('slot-booked', handleSlotBooked);
      socket.off('slot-freed', handleSlotFreed);
    };
  }, [socket, expertId, form.date, form.timeSlot]);

  const validate = () => {
    const errs = {};
    if (!form.userName.trim() || form.userName.trim().length < 2) errs.userName = 'Name must be at least 2 characters';
    if (!form.userEmail.trim() || !/^\S+@\S+\.\S+$/.test(form.userEmail)) errs.userEmail = 'Please enter a valid email';
    if (!form.userPhone.trim() || !/^[\d\s\+\-\(\)]{7,15}$/.test(form.userPhone)) errs.userPhone = 'Please enter a valid phone number';
    if (!form.date) errs.date = 'Please select a date';
    if (!form.timeSlot) errs.timeSlot = 'Please select a time slot';
    if (form.notes.length > 500) errs.notes = 'Notes cannot exceed 500 characters';
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setFieldErrors(errs => ({ ...errs, [name]: undefined }));
    if (name === 'date') setForm(f => ({ ...f, date: value, timeSlot: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      const res = await bookingAPI.create({ expertId, ...form });
      setSuccess(res.data);
      toast.success('Booking confirmed! 🎉');
    } catch (err) {
      if (err.errors) {
        const serverErrs = {};
        err.errors.forEach(e => { serverErrs[e.field] = e.message; });
        setFieldErrors(serverErrs);
      } else {
        toast.error(err.message || 'Booking failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="booking-loading">
      <div className="spinner" />
      <p>Loading booking form...</p>
    </div>
  );

  if (success) return (
    <div className="booking-page">
      <div className="container">
        <div className="success-card">
          <div className="success-animation">
            <div className="success-circle">
              <span className="success-check">✓</span>
            </div>
          </div>
          <h2 className="success-title">Booking Confirmed!</h2>
          <p className="success-sub">Your session has been successfully booked.</p>

          <div className="success-details">
            <div className="success-detail-row">
              <span className="sd-label">Expert</span>
              <span className="sd-val">{success.expert?.name || expert?.name}</span>
            </div>
            <div className="success-detail-row">
              <span className="sd-label">Date</span>
              <span className="sd-val">{format(parseISO(success.date), 'EEEE, MMMM d, yyyy')}</span>
            </div>
            <div className="success-detail-row">
              <span className="sd-label">Time</span>
              <span className="sd-val">{success.timeSlot}</span>
            </div>
            <div className="success-detail-row">
              <span className="sd-label">Status</span>
              <span className="status-badge pending">{success.status}</span>
            </div>
            <div className="success-detail-row">
              <span className="sd-label">Amount</span>
              <span className="sd-val">${success.totalAmount}</span>
            </div>
          </div>

          <p className="success-note">A confirmation will be sent to <strong>{success.userEmail}</strong></p>

          <div className="success-actions">
            <button
              className="btn-primary"
              onClick={() => navigate(`/my-bookings?email=${success.userEmail}`)}
            >
              View My Bookings
            </button>
            <button className="btn-secondary" onClick={() => navigate('/')}>
              Browse More Experts
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const selectedDayData = expert?.availability?.find(a => a.date === form.date);
  const availableSlots = selectedDayData?.slots || [];

  return (
    <div className="booking-page">
      <div className="container">
        <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>

        <div className="booking-grid">
          {/* Expert Summary */}
          <div className="booking-sidebar">
            <div className="booking-expert-card">
              <h3 className="sidebar-title">Booking Session With</h3>
              {expert?.profileImage && (
                <img src={expert.profileImage} alt={expert.name} className="sidebar-avatar" />
              )}
              <div className="sidebar-name">{expert?.name}</div>
              <div className="sidebar-category">{expert?.category}</div>
              <div className="sidebar-rate">
                <span className="sidebar-rate-amount">${expert?.hourlyRate}</span>
                <span className="sidebar-rate-label">/ session (60 min)</span>
              </div>

              {form.date && form.timeSlot && (
                <div className="booking-preview">
                  <div className="preview-item">
                    <span>📅</span>
                    <span>{format(parseISO(form.date), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="preview-item">
                    <span>🕐</span>
                    <span>{form.timeSlot}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Form */}
          <div className="booking-form-wrap">
            <div className="form-card">
              <h1 className="form-title">Complete Booking</h1>
              <p className="form-subtitle">Fill in your details to confirm the session</p>

              <form onSubmit={handleSubmit} noValidate>
                <div className="form-section-title">Your Information</div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Full Name <span className="required">*</span></label>
                    <input
                      type="text"
                      name="userName"
                      value={form.userName}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className={`form-input ${fieldErrors.userName ? 'error' : ''}`}
                    />
                    {fieldErrors.userName && <span className="field-error">{fieldErrors.userName}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address <span className="required">*</span></label>
                    <input
                      type="email"
                      name="userEmail"
                      value={form.userEmail}
                      onChange={handleChange}
                      placeholder="john@example.com"
                      className={`form-input ${fieldErrors.userEmail ? 'error' : ''}`}
                    />
                    {fieldErrors.userEmail && <span className="field-error">{fieldErrors.userEmail}</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number <span className="required">*</span></label>
                  <input
                    type="tel"
                    name="userPhone"
                    value={form.userPhone}
                    onChange={handleChange}
                    placeholder="+91 9876543210"
                    className={`form-input ${fieldErrors.userPhone ? 'error' : ''}`}
                  />
                  {fieldErrors.userPhone && <span className="field-error">{fieldErrors.userPhone}</span>}
                </div>

                <div className="form-section-title">Session Schedule</div>

                <div className="form-group">
                  <label className="form-label">Select Date <span className="required">*</span></label>
                  <select
                    name="date"
                    value={form.date}
                    onChange={handleChange}
                    className={`form-input ${fieldErrors.date ? 'error' : ''}`}
                  >
                    <option value="">-- Choose an available date --</option>
                    {expert?.availability?.map(day => {
                      const freeSlots = day.slots.filter(s => !s.isBooked).length;
                      return (
                        <option key={day.date} value={day.date} disabled={freeSlots === 0}>
                          {format(parseISO(day.date), 'EEEE, MMMM d')} — {freeSlots} slot{freeSlots !== 1 ? 's' : ''} free
                        </option>
                      );
                    })}
                  </select>
                  {fieldErrors.date && <span className="field-error">{fieldErrors.date}</span>}
                </div>

                {form.date && (
                  <div className="form-group">
                    <label className="form-label">Select Time Slot <span className="required">*</span></label>
                    <div className="slot-picker">
                      {availableSlots.length === 0 ? (
                        <p className="no-slots-msg">No slots available for this date</p>
                      ) : (
                        availableSlots.map(slot => (
                          <button
                            key={slot.time}
                            type="button"
                            disabled={slot.isBooked}
                            className={`slot-option ${form.timeSlot === slot.time ? 'selected' : ''} ${slot.isBooked ? 'booked' : 'free'}`}
                            onClick={() => {
                              if (!slot.isBooked) {
                                setForm(f => ({ ...f, timeSlot: slot.time }));
                                setFieldErrors(e => ({ ...e, timeSlot: undefined }));
                              }
                            }}
                          >
                            {slot.time}
                            {slot.isBooked && <span className="slot-taken-label">Taken</span>}
                          </button>
                        ))
                      )}
                    </div>
                    {fieldErrors.timeSlot && <span className="field-error">{fieldErrors.timeSlot}</span>}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">
                    Notes <span className="optional">(optional)</span>
                  </label>
                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    placeholder="What would you like to discuss in the session?"
                    rows={4}
                    className={`form-input form-textarea ${fieldErrors.notes ? 'error' : ''}`}
                  />
                  <div className="char-count">{form.notes.length}/500</div>
                  {fieldErrors.notes && <span className="field-error">{fieldErrors.notes}</span>}
                </div>

                <button type="submit" className="submit-btn" disabled={submitting}>
                  {submitting ? (
                    <>
                      <span className="btn-spinner" />
                      Confirming Booking...
                    </>
                  ) : (
                    <>Confirm Booking — ${expert?.hourlyRate}</>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingForm;
