const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  expert: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expert',
    required: [true, 'Expert is required'],
    index: true
  },
  userName: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  userEmail: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    index: true
  },
  userPhone: {
    type: String,
    required: [true, 'Phone is required'],
    trim: true,
    match: [/^[\d\s\+\-\(\)]{7,15}$/, 'Please provide a valid phone number']
  },
  date: {
    type: String, // "YYYY-MM-DD"
    required: [true, 'Date is required'],
    index: true
  },
  timeSlot: {
    type: String, // "HH:MM"
    required: [true, 'Time slot is required']
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters'],
    default: ''
  },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'],
    default: 'Pending',
    index: true
  },
  sessionDuration: {
    type: Number,
    default: 60 // minutes
  },
  totalAmount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound unique index to prevent double booking
bookingSchema.index(
  { expert: 1, date: 1, timeSlot: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $nin: ['Cancelled'] } }
  }
);

bookingSchema.index({ userEmail: 1, createdAt: -1 });

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;
