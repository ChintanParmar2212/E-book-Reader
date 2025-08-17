import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosConfig';

const BookList = ({ books, setBooks, setEditingBook, showFavoritesOnly = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const toggleFavorite = async (bookId) => {
    try {
      const response = await axiosInstance.put(`/api/books/${bookId}/favorite`, {}, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      
      // Update the book in the list
      setBooks(books.map(book => 
        book._id === bookId 
          ? { ...book, isFavorite: response.data.isFavorite }
          : book
      ));
    } catch (error) {
      console.error('Error toggling favorite:', error);
      alert('Failed to update favorite status');
    }
  };

  const handleDelete = async (bookId) => {
    if (window.confirm('Are you sure you want to delete this book? This will also delete the EPUB file.')) {
      try {
        await axiosInstance.delete(`/api/books/${bookId}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setBooks(books.filter((book) => book._id !== bookId));
      } catch (error) {
        console.error('Error deleting book:', error);
        alert('Failed to delete book.');
      }
    }
  };

  const handleReadBook = (bookId) => {
    navigate(`/read/${bookId}`);
  };

  const displayBooks = showFavoritesOnly 
    ? books.filter(book => book.isFavorite)
    : books;

  if (displayBooks.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl text-gray-500 mb-4">
          {showFavoritesOnly ? 'No favorite books yet' : 'Your library is empty'}
        </h2>
        <p className="text-gray-400">
          {showFavoritesOnly 
            ? 'Mark some books as favorites to see them here!'
            : 'Upload your first EPUB book to get started!'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {displayBooks.map((book) => (
        <div key={book._id} className="bg-white p-6 rounded-lg shadow-md relative">
          {/* Favorite Button */}
          <button
            onClick={() => toggleFavorite(book._id)}
            className={`absolute top-4 right-4 text-2xl transition-colors ${
              book.isFavorite 
                ? 'text-red-500 hover:text-red-600' 
                : 'text-gray-300 hover:text-red-500'
            }`}
            title={book.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            ♥
          </button>

          {/* Cover Image */}
          {book.coverImage && (
            <img 
              src={`http://localhost:5001${book.coverImage}`}
              alt={book.title}
              className="w-full h-48 object-cover rounded mb-4"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          )}
          
          <h2 className="font-bold text-xl mb-2 pr-8">{book.title}</h2>
          <p className="text-gray-600 mb-2">by {book.author}</p>
          
          {book.genre && (
            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mb-2">
              {book.genre}
            </span>
          )}
          
          {book.extractedText && (
            <p className="text-sm text-gray-500 mb-4 line-clamp-3">{book.extractedText}...</p>
          )}
          
          {/* Reading Progress */}
          <div className="mb-4">
            <div className="bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full" 
                style={{ width: `${book.readingProgress || 0}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {book.readingProgress || 0}% complete • Chapter {book.currentChapter || 1} of {book.totalChapters || 1}
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleReadBook(book._id)}
              className="flex-1 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              {book.readingProgress > 0 ? 'Continue Reading' : 'Start Reading'}
            </button>
            <button
              onClick={() => handleDelete(book._id)}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BookList;