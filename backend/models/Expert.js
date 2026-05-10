const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
  time: { type: String, required: true }, // e.g. "09:00", "10:00"
  isBooked: { type: Boolean, default: false },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null }
});

const availabilitySchema = new mongoose.Schema({
  date: { type: String, required: true }, // e.g. "2025-06-15"
  slots: [timeSlotSchema]
});

const expertSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Expert name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Technology', 'Business', 'Design', 'Marketing', 'Finance', 'Health', 'Legal', 'Education'],
    index: true
  },
  bio: {
    type: String,
    required: [true, 'Bio is required'],
    maxlength: [1000, 'Bio cannot exceed 1000 characters']
  },
  experience: {
    type: Number,
    required: [true, 'Experience is required'],
    min: [0, 'Experience cannot be negative'],
    max: [50, 'Experience cannot exceed 50 years']
  },
  rating: {
    type: Number,
    default: 4.0,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  totalReviews: { type: Number, default: 0 },
  hourlyRate: { type: Number, required: true },
  profileImage: { type: String, default: '' },
  skills: [{ type: String, trim: true }],
  languages: [{ type: String, trim: true }],
  timezone: { type: String, default: 'UTC' },
  availability: [availabilitySchema],
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Text index for search
expertSchema.index({ name: 'text', bio: 'text', skills: 'text' });
expertSchema.index({ category: 1, rating: -1 });

const Expert = mongoose.model('Expert', expertSchema);
module.exports = Expert;
