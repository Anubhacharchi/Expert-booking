const Expert = require('../models/Expert');
const { validationResult } = require('express-validator');

// GET /experts — with pagination, search, filter
exports.getExperts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 8,
      category,
      search,
      sortBy = 'rating',
      order = 'desc'
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(20, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const filter = { isActive: true };

    if (category && category !== 'All') {
      filter.category = category;
    }

    if (search && search.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { bio: { $regex: search.trim(), $options: 'i' } },
        { skills: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const sortOptions = {};
    const allowedSortFields = ['rating', 'experience', 'hourlyRate', 'name'];
    sortOptions[allowedSortFields.includes(sortBy) ? sortBy : 'rating'] = sortOrder;

    const [experts, total] = await Promise.all([
      Expert.find(filter)
        .select('-availability') // Don't send slots in listing
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Expert.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: experts,
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
    console.error('getExperts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch experts',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// GET /experts/:id
exports.getExpertById = async (req, res) => {
  try {
    const expert = await Expert.findById(req.params.id).lean();

    if (!expert) {
      return res.status(404).json({
        success: false,
        message: 'Expert not found'
      });
    }

    // Filter out past dates from availability
    const today = new Date().toISOString().split('T')[0];
    expert.availability = (expert.availability || []).filter(a => a.date >= today);

    res.json({ success: true, data: expert });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid expert ID' });
    }
    console.error('getExpertById error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expert details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// GET /experts/categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Expert.distinct('category', { isActive: true });
    res.json({ success: true, data: ['All', ...categories.sort()] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
};
