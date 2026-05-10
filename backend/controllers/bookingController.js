const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Expert = require('../models/Expert');
const { validationResult } = require('express-validator');

// POST /bookings — Create a new booking (with race condition prevention)
exports.createBooking = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
    });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { expertId, userName, userEmail, userPhone, date, timeSlot, notes } = req.body;

    // 1. Verify expert exists
    const expert = await Expert.findById(expertId).session(session);
    if (!expert) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Expert not found' });
    }

    // 2. Verify the slot exists in expert's availability
    const availDay = expert.availability.find(a => a.date === date);
    if (!availDay) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'No availability on this date' });
    }

    const slot = availDay.slots.find(s => s.time === timeSlot);
    if (!slot) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Time slot not found' });
    }

    // 3. Check slot is not already booked (atomic check inside transaction)
    if (slot.isBooked) {
      await session.abortTransaction();
      return res.status(409).json({
        success: false,
        message: 'This time slot was just booked by someone else. Please choose another slot.'
      });
    }

    // 4. Mark slot as booked atomically using findOneAndUpdate with conditions
    const updatedExpert = await Expert.findOneAndUpdate(
      {
        _id: expertId,
        'availability.date': date,
        'availability.slots': {
          $elemMatch: { time: timeSlot, isBooked: false }
        }
      },
      {
        $set: {
          'availability.$[day].slots.$[slot].isBooked': true
        }
      },
      {
        arrayFilters: [
          { 'day.date': date },
          { 'slot.time': timeSlot, 'slot.isBooked': false }
        ],
        new: true,
        session
      }
    );

    if (!updatedExpert) {
      await session.abortTransaction();
      return res.status(409).json({
        success: false,
        message: 'Slot just got booked by another user. Please select a different slot.'
      });
    }

    // 5. Create the booking
    const totalAmount = expert.hourlyRate;
    const booking = new Booking({
      expert: expertId,
      userName,
      userEmail,
      userPhone,
      date,
      timeSlot,
      notes: notes || '',
      status: 'Pending',
      totalAmount
    });

    await booking.save({ session });

    // 6. Link bookingId to slot
    await Expert.updateOne(
      { _id: expertId, 'availability.date': date },
      {
        $set: {
          'availability.$[day].slots.$[slot].bookingId': booking._id
        }
      },
      {
        arrayFilters: [
          { 'day.date': date },
          { 'slot.time': timeSlot }
        ],
        session
      }
    );

    await session.commitTransaction();

    // Populate expert info for response
    await booking.populate('expert', 'name category profileImage hourlyRate');

    // Emit real-time event via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to(`expert-${expertId}`).emit('slot-booked', {
        expertId,
        date,
        timeSlot,
        bookingId: booking._id
      });
    }

    res.status(201).json({
      success: true,
      message: 'Booking confirmed successfully!',
      data: booking
    });

  } catch (error) {
    await session.abortTransaction();

    // Handle MongoDB duplicate key error (fallback for race conditions)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'This slot was just booked by someone else. Please choose another slot.'
      });
    }

    console.error('createBooking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create booking. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    session.endSession();
  }
};

// PATCH /bookings/:id/status
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    const booking = await Booking.findById(req.params.id).populate('expert', 'name');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const previousStatus = booking.status;
    booking.status = status;
    await booking.save();

    // If cancelled, free up the slot
    if (status === 'Cancelled' && previousStatus !== 'Cancelled') {
      await Expert.updateOne(
        { _id: booking.expert._id, 'availability.date': booking.date },
        {
          $set: {
            'availability.$[day].slots.$[slot].isBooked': false,
            'availability.$[day].slots.$[slot].bookingId': null
          }
        },
        {
          arrayFilters: [
            { 'day.date': booking.date },
            { 'slot.time': booking.timeSlot }
          ]
        }
      );

      // Emit slot freed event
      const io = req.app.get('io');
      if (io) {
        io.to(`expert-${booking.expert._id}`).emit('slot-freed', {
          expertId: booking.expert._id,
          date: booking.date,
          timeSlot: booking.timeSlot
        });
      }
    }

    res.json({
      success: true,
      message: `Booking status updated to ${status}`,
      data: booking
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid booking ID' });
    }
    console.error('updateBookingStatus error:', error);
    res.status(500).json({ success: false, message: 'Failed to update booking status' });
  }
};

// GET /bookings?email=
exports.getBookingsByEmail = async (req, res) => {
  try {
    const { email, status, page = 1, limit = 10 } = req.query;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email parameter is required' });
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(20, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const filter = { userEmail: email.toLowerCase().trim() };
    if (status && ['Pending', 'Confirmed', 'Completed', 'Cancelled'].includes(status)) {
      filter.status = status;
    }

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate('expert', 'name category profileImage rating hourlyRate')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Booking.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: bookings,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPrevPage: pageNum > 1
      }
    });
  } catch (error) {
    console.error('getBookingsByEmail error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
  }
};
