const Book = require('../models/Book');
const EPubService = require('../services/epubService');
const fs = require('fs-extra');
const path = require('path');

// Get all books for a user
const getBooks = async (req, res) => {
    try {
        const books = await Book.find({ userId: req.user.id }).sort({ lastRead: -1 });
        res.json(books);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get favorite books
const getFavoriteBooks = async (req, res) => {
    try {
        const books = await Book.find({ 
            userId: req.user.id, 
            isFavorite: true 
        }).sort({ lastRead: -1 });
        res.json(books);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Upload and add EPUB book
const uploadBook = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No EPUB file uploaded' });
        }

        const filePath = req.file.path;
        
        // Parse EPUB file
        const epubData = await EPubService.parseEpub(filePath);
        
        // Create book record
        const book = await Book.create({
            userId: req.user.id,
            title: epubData.metadata.title,
            author: epubData.metadata.author,
            description: epubData.metadata.description,
            epubPath: filePath,
            coverImage: epubData.metadata.coverImage,
            genre: epubData.metadata.genre,
            language: epubData.metadata.language,
            publisher: epubData.metadata.publisher,
            publishDate: epubData.metadata.publishDate,
            totalChapters: epubData.totalChapters,
            tableOfContents: epubData.metadata.tableOfContents,
            extractedText: epubData.metadata.extractedText
        });

        res.status(201).json(book);
    } catch (error) {
        // Clean up uploaded file if parsing fails
        if (req.file && req.file.path) {
            fs.remove(req.file.path).catch(console.error);
        }
        console.error('Upload error:', error);
        res.status(500).json({ message: 'Failed to process EPUB file: ' + error.message });
    }
};

// Update book (reading progress, favorites, etc.)
const updateBook = async (req, res) => {
    const { currentChapter, currentPosition, isFavorite, isCompleted, readingProgress, bookmarks } = req.body;
    try {
        const book = await Book.findById(req.params.id);
        if (!book) return res.status(404).json({ message: 'Book not found' });
        
        if (currentChapter !== undefined) book.currentChapter = currentChapter;
        if (currentPosition !== undefined) book.currentPosition = currentPosition;
        if (isFavorite !== undefined) book.isFavorite = isFavorite;
        if (isCompleted !== undefined) book.isCompleted = isCompleted;
        if (readingProgress !== undefined) book.readingProgress = readingProgress;
        if (bookmarks !== undefined) book.bookmarks = bookmarks;
        
        book.lastRead = new Date();
        
        const updatedBook = await book.save();
        res.json(updatedBook);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Toggle favorite status
const toggleFavorite = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) return res.status(404).json({ message: 'Book not found' });
        
        book.isFavorite = !book.isFavorite;
        await book.save();
        
        res.json({ 
            message: book.isFavorite ? 'Added to favorites' : 'Removed from favorites',
            isFavorite: book.isFavorite 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete a book
const deleteBook = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) return res.status(404).json({ message: 'Book not found' });
        
        // Delete EPUB file
        if (book.epubPath) {
            fs.remove(book.epubPath).catch(console.error);
        }
        
        await book.deleteOne();
        res.json({ message: 'Book deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get book content for reading
const getBookContent = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) return res.status(404).json({ message: 'Book not found' });
        
        res.json({
            _id: book._id,
            title: book.title,
            author: book.author,
            currentChapter: book.currentChapter,
            currentPosition: book.currentPosition,
            totalChapters: book.totalChapters,
            tableOfContents: book.tableOfContents,
            bookmarks: book.bookmarks,
            epubPath: book.epubPath
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get specific chapter content
const getChapterContent = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) return res.status(404).json({ message: 'Book not found' });
        
        const chapterIndex = parseInt(req.params.chapterIndex) || 0;
        
        const chapterContent = await EPubService.getChapterContent(book.epubPath, chapterIndex);
        
        res.json(chapterContent);
    } catch (error) {
        console.error('Chapter content error:', error);
        res.status(500).json({ message: 'Failed to load chapter content' });
    }
};

module.exports = { 
    getBooks, 
    getFavoriteBooks,
    uploadBook, 
    updateBook, 
    toggleFavorite,
    deleteBook, 
    getBookContent,
    getChapterContent
};