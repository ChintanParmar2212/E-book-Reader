import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';

const BookForm = ({ books, setBooks, onClose }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ 
    title: '', 
    author: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.name.toLowerCase().endsWith('.epub')) {
        setSelectedFile(file);
        // Auto-fill title from filename
        const fileName = file.name.replace('.epub', '').replace(/[-_]/g, ' ');
        setFormData(prev => ({ ...prev, title: fileName }));
      } else {
        alert('Please select an EPUB file');
        e.target.value = '';
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      alert('Please select an EPUB file');
      return;
    }

    setUploading(true);
    
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('epub', selectedFile);
      uploadFormData.append('title', formData.title);
      uploadFormData.append('author', formData.author);

      const response = await axiosInstance.post('/api/books/upload', uploadFormData, {
        headers: { 
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'multipart/form-data'
        },
      });

      setBooks([...books, response.data]);
      setFormData({ title: '', author: '' });
      setSelectedFile(null);
      if (onClose) onClose();
      alert('Book uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      alert(error.response?.data?.message || 'Failed to upload book');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white p-6 shadow-md rounded mb-6">
      <h1 className="text-2xl font-bold mb-4">Upload New Book</h1>
      
      <form onSubmit={handleSubmit}>
        {/* File Upload */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select EPUB File *
          </label>
          <input
            type="file"
            accept=".epub"
            onChange={handleFileChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            required
          />
          {selectedFile && (
            <p className="text-sm text-green-600 mt-1">
              Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        {/* Title */}
        <input
          type="text"
          placeholder="Book Title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full mb-4 p-2 border rounded focus:ring-2 focus:ring-blue-500"
          required
        />
        
        {/* Author */}
        <input
          type="text"
          placeholder="Author"
          value={formData.author}
          onChange={(e) => setFormData({ ...formData, author: e.target.value })}
          className="w-full mb-4 p-2 border rounded focus:ring-2 focus:ring-blue-500"
          required
        />
        
        <div className="flex gap-2">
          <button 
            type="submit" 
            disabled={uploading}
            className="flex-1 bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {uploading ? 'Uploading...' : 'Upload Book'}
          </button>
          <button 
            type="button" 
            onClick={onClose} 
            className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default BookForm;