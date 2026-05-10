const express = require('express');
const router = express.Router();
const { param, query } = require('express-validator');
const expertController = require('../controllers/expertController');

// GET /api/experts/categories
router.get('/categories', expertController.getCategories);

// GET /api/experts
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 20 }).withMessage('Limit must be between 1 and 20'),
    query('category').optional().trim().escape(),
    query('search').optional().trim()
  ],
  expertController.getExperts
);

// GET /api/experts/:id
router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid expert ID')],
  expertController.getExpertById
);

module.exports = router;
