import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';

const Reader = () => {
  const { bookId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [currentChapter, setCurrentChapter] = useState(1);
  const [chapterContent, setChapterContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [fontSize, setFontSize] = useState(16);
  const [showTOC, setShowTOC] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const response = await axiosInstance.get(`/api/books/${bookId}/read`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const bookData = response.data;
        setBook(bookData);
        setCurrentChapter(bookData.currentChapter || 1);
        setBookmarks(bookData.bookmarks || []);
      } catch (error) {
        alert('Failed to load book.');
        navigate('/library');
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [bookId, user, navigate]);

  useEffect(() => {
    if (book) {
      loadChapter(currentChapter - 1);
    }
  }, [currentChapter, book]);

  const loadChapter = async (chapterIndex) => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/api/books/${bookId}/chapter/${chapterIndex}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setChapterContent(response.data.content);
      updateProgress();
    } catch (error) {
      console.error('Failed to load chapter:', error);
      setChapterContent('<p>Failed to load chapter content.</p>');
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async () => {
    if (!book) return;
    
    const progress = Math.round((currentChapter / book.totalChapters) * 100);
    try {
      await axiosInstance.put(`/api/books/${bookId}`, {
        currentChapter,
        readingProgress: progress,
        bookmarks
      }, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
    } catch (error) {
      console.error('Failed to update reading progress');
    }
  };

  const nextChapter = () => {
    if (currentChapter < book.totalChapters) {
      setCurrentChapter(currentChapter + 1);
    }
  };

  const prevChapter = () => {
    if (currentChapter > 1) {
      setCurrentChapter(currentChapter - 1);
    }
  };

  const goToChapter = (chapterNumber) => {
    setCurrentChapter(chapterNumber);
    setShowTOC(false);
  };

  const addBookmark = () => {
    const note = prompt('Add a note for this bookmark (optional):');
    const newBookmark = {
      chapter: currentChapter,
      position: window.scrollY.toString(),
      note: note || '',
      createdAt: new Date()
    };
    const updatedBookmarks = [...bookmarks, newBookmark];
    setBookmarks(updatedBookmarks);
    updateProgress();
  };

  const goToBookmark = (bookmark) => {
    setCurrentChapter(bookmark.chapter);
    setTimeout(() => {
      window.scrollTo(0, parseInt(bookmark.position) || 0);
    }, 500);
  };

  const toggleFavorite = async () => {
    try {
      await axiosInstance.put(`/api/books/${bookId}/favorite`, {}, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setBook(prev => ({ ...prev, isFavorite: !prev.isFavorite }));
    } catch (error) {
      console.error('Failed to toggle favorite');
    }
  };

  if (loading && !book) {
    return <div className="text-center mt-20">Loading book...</div>;
  }

  if (!book) {
    return <div className="text-center mt-20">Book not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/library')}
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to Library
          </button>
          <h1 className="text-lg font-semibold truncate max-w-xs">{book.title}</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleFavorite}
            className={`text-2xl ${book.isFavorite ? 'text-red-500' : 'text-gray-300'} hover:text-red-500`}
            title={book.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            ♥
          </button>
          
          <button
            onClick={() => setShowTOC(!showTOC)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Chapters
          </button>
          
          <button
            onClick={addBookmark}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Bookmark
          </button>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm">Font:</label>
            <input
              type="range"
              min="12"
              max="24"
              value={fontSize}
              onChange={(e) => setFontSize(e.target.value)}
              className="w-20"
            />
            <span className="text-sm">{fontSize}px</span>
          </div>
        </div>
      </div>

      {/* Table of Contents */}
      {showTOC && (
        <div className="bg-white border-b p-4">
          <h3 className="font-bold mb-4">Table of Contents</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
            {book.tableOfContents && book.tableOfContents.length > 0 ? (
              book.tableOfContents.map((chapter, index) => (
                <button
                  key={index}
                  onClick={() => goToChapter(index + 1)}
                  className={`text-left p-2 rounded hover:bg-blue-100 ${
                    currentChapter === index + 1 ? 'bg-blue-200' : ''
                  }`}
                >
                  <span className="font-medium">Chapter {index + 1}</span>
                  {chapter.title && (
                    <div className="text-sm text-gray-600 truncate">{chapter.title}</div>
                  )}
                </button>
              ))
            ) : (
              // Fallback if no TOC available
              Array.from({ length: book.totalChapters }, (_, index) => (
                <button
                  key={index}
                  onClick={() => goToChapter(index + 1)}
                  className={`text-left p-2 rounded hover:bg-blue-100 ${
                    currentChapter === index + 1 ? 'bg-blue-200' : ''
                  }`}
                >
                  Chapter {index + 1}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Bookmarks */}
      {bookmarks.length > 0 && (
        <div className="bg-yellow-50 p-4 border-b">
          <h3 className="font-bold mb-2">Bookmarks</h3>
          <div className="flex flex-wrap gap-2">
            {bookmarks.map((bookmark, index) => (
              <button
                key={index}
                onClick={() => goToBookmark(bookmark)}
                className="bg-white p-2 rounded shadow text-sm hover:bg-gray-50"
              >
                <div className="font-medium">Chapter {bookmark.chapter}</div>
                {bookmark.note && (
                  <div className="text-gray-600 text-xs truncate max-w-32">{bookmark.note}</div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="bg-white p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Chapter {currentChapter} of {book.totalChapters}</span>
          <span className="text-sm text-gray-600">
            {Math.round((currentChapter / book.totalChapters) * 100)}% Complete
          </span>
        </div>
        <div className="bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${(currentChapter / book.totalChapters) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Reading Area */}
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="text-center py-8">Loading chapter...</div>
          ) : (
            <div 
              className="bg-white p-8 rounded-lg shadow-sm prose max-w-none"
              style={{ 
                fontSize: `${fontSize}px`, 
                lineHeight: '1.7',
                fontFamily: 'Georgia, serif'
              }}
              dangerouslySetInnerHTML={{ __html: chapterContent }}
            />
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white p-4 border-t flex justify-between items-center sticky bottom-0">
        <button
          onClick={prevChapter}
          disabled={currentChapter === 1}
          className="bg-blue-500 text-white px-6 py-2 rounded disabled:bg-gray-300 hover:bg-blue-600"
        >
          Previous Chapter
        </button>
        
        <div className="flex items-center space-x-4">
          <span className="text-sm">Go to chapter:</span>
          <select
            value={currentChapter}
            onChange={(e) => setCurrentChapter(parseInt(e.target.value))}
            className="p-1 border rounded"
          >
            {Array.from({ length: book.totalChapters }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                Chapter {i + 1}
              </option>
            ))}
          </select>
        </div>
        
        <button
          onClick={nextChapter}
          disabled={currentChapter === book.totalChapters}
          className="bg-blue-500 text-white px-6 py-2 rounded disabled:bg-gray-300 hover:bg-blue-600"
        >
          Next Chapter
        </button>
      </div>
    </div>
  );
};

export default Reader;