const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const bookingController = require('../controllers/bookingController');

// POST /api/bookings
router.post(
  '/',
  [
    body('expertId')
      .notEmpty().withMessage('Expert ID is required')
      .isMongoId().withMessage('Invalid expert ID'),
    body('userName')
      .notEmpty().withMessage('Name is required')
      .trim()
      .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    body('userEmail')
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('userPhone')
      .notEmpty().withMessage('Phone number is required')
      .matches(/^[\d\s\+\-\(\)]{7,15}$/).withMessage('Please provide a valid phone number'),
    body('date')
      .notEmpty().withMessage('Date is required')
      .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Date must be in YYYY-MM-DD format')
      .custom((value) => {
        const today = new Date().toISOString().split('T')[0];
        if (value < today) throw new Error('Cannot book a slot in the past');
        return true;
      }),
    body('timeSlot')
      .notEmpty().withMessage('Time slot is required')
      .matches(/^\d{2}:\d{2}$/).withMessage('Time slot must be in HH:MM format'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters')
  ],
  bookingController.createBooking
);

// PATCH /api/bookings/:id/status
router.patch(
  '/:id/status',
  [
    param('id').isMongoId().withMessage('Invalid booking ID'),
    body('status')
      .notEmpty().withMessage('Status is required')
      .isIn(['Pending', 'Confirmed', 'Completed', 'Cancelled'])
      .withMessage('Invalid status value')
  ],
  bookingController.updateBookingStatus
);

// GET /api/bookings?email=
router.get(
  '/',
  [
    query('email')
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Invalid email format')
  ],
  bookingController.getBookingsByEmail
);

module.exports = router;
