const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    author: { type: String, required: true },
    description: { type: String },
    
    // EPUB specific fields
    epubPath: { type: String }, // Path to stored EPUB file
    coverImage: { type: String }, // Extracted cover image
    
    // Reading progress
    totalChapters: { type: Number, default: 1 },
    currentChapter: { type: Number, default: 1 },
    currentPosition: { type: String, default: '' }, // Position within chapter
    
    // Metadata
    genre: { type: String },
    language: { type: String },
    publisher: { type: String },
    publishDate: { type: Date },
    
    // User interaction
    isFavorite: { type: Boolean, default: false },
    isCompleted: { type: Boolean, default: false },
    dateAdded: { type: Date, default: Date.now },
    lastRead: { type: Date, default: Date.now },
    
    // Reading data
    readingProgress: { type: Number, default: 0 }, // Percentage
    bookmarks: [{ 
        chapter: Number,
        position: String,
        note: String, 
        createdAt: { type: Date, default: Date.now } 
    }],
    
    // Extracted content (for search/preview)
    extractedText: { type: String }, // First few paragraphs
    tableOfContents: [{ 
        title: String, 
        href: String, 
        chapter: Number 
    }]
});

module.exports = mongoose.model('Book', bookSchema);