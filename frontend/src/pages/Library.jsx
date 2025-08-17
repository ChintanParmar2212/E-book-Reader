import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosConfig';
import BookForm from '../components/BookForm';
import BookList from '../components/BookList';
import { useAuth } from '../context/AuthContext';

const Library = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'favorites'

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchBooks = async () => {
      try {
        const response = await axiosInstance.get('/api/books', {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setBooks(response.data);
      } catch (error) {
        console.error('Error fetching books:', error);
        alert('Failed to fetch books.');
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, [user, navigate]);

  if (loading) {
    return <div className="text-center mt-20">Loading your library...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Library</h1>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
          }}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          {showAddForm ? 'Cancel' : 'Upload Book'}
        </button>
      </div>

      {/* Upload Form */}
      {showAddForm && (
        <BookForm
          books={books}
          setBooks={setBooks}
          onClose={() => setShowAddForm(false)}
        />
      )}

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('all')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All Books ({books.length})
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'favorites'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Favorites ({books.filter(book => book.isFavorite).length})
            </button>
          </nav>
        </div>
      </div>

      {/* Book List */}
      <BookList 
        books={books} 
        setBooks={setBooks} 
        showFavoritesOnly={activeTab === 'favorites'}
      />
    </div>
  );
};

export default Library;