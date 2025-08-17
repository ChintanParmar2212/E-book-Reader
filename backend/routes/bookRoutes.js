const express = require('express');
const { 
    getBooks, 
    getFavoriteBooks,
    uploadBook, 
    updateBook, 
    toggleFavorite,
    deleteBook, 
    getBookContent,
    getChapterContent
} = require('../controllers/bookController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// Book CRUD routes
router.route('/').get(protect, getBooks);
router.route('/upload').post(protect, upload.single('epub'), uploadBook);
router.route('/favorites').get(protect, getFavoriteBooks);
router.route('/:id').put(protect, updateBook).delete(protect, deleteBook);
router.route('/:id/favorite').put(protect, toggleFavorite);

// Reading routes
router.route('/:id/read').get(protect, getBookContent);
router.route('/:id/chapter/:chapterIndex').get(protect, getChapterContent);

module.exports = router;