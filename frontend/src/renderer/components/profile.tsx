import React, { useState } from 'react';
import LogoutButton from './logout-button';
import settings from '../../../assets/icons/settings.svg';
import apiClient from '../utils/apiClient';

type Props = {};

const Profile: React.FC<Props> = () => {
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState(
    `https://testapi.berat-dogan.com${storedUser.photo}` || 'https://via.placeholder.com/50'
  );
  const [formData, setFormData] = useState({
    name: storedUser.name || '',
    username: storedUser.username || '',
    status: storedUser.status || '',
    photo: null as File | null,
  });

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
      setFormData((prev) => ({ ...prev, photo: file }));
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const updateData = new FormData();

    updateData.append('first_name', formData.name);
    updateData.append('username', formData.username);
    updateData.append('status', formData.status);
    if (formData.photo) {
      updateData.append('photo', formData.photo);
    }

    try {
      const response = await apiClient.put('/chat-app/edit-profile/', updateData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      console.log('Profile updated:', response.data);
      setIsModalOpen(false);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleModalToggle = () => {
    setIsModalOpen(!isModalOpen);
  };

  return (
    <div>
      <div className="flex justify-between rounded-lg p-4 shadow-md mb-4 bg-black bg-opacity-20">
        <div className="flex items-center">
          <img
            src={`https://testapi.berat-dogan.com${storedUser.photo}` || 'https://via.placeholder.com/50'}
            alt="User Avatar"
            className="w-12 h-12 rounded-full mr-4 object-cover"
          />
          <div>
            <h3 className="text-lg font-bold text-white">{storedUser.name || 'Unknown User'}</h3>
            <p className="text-sm text-gray-500">{storedUser.username}</p>
            <p className="text-sm text-gray-500">{storedUser.status}</p>


          </div>
        </div>
        <div className="flex items-center space-x-4">
          <img src={settings} alt="Settings" className="w-6 h-6 cursor-pointer" onClick={handleModalToggle} />
          <LogoutButton />
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow-lg w-96">
            <h2 className="text-lg font-bold mb-4">Edit Profile</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4 flex items-center space-x-4">
                <img src={previewPhoto} alt="User Avatar" className="w-16 h-16 rounded-full object-cover" />
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">Upload Photo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <input
                  type="text"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  className="bg-gray-300 text-gray-700 py-2 px-4 rounded mr-2"
                  onClick={handleModalToggle}
                >
                  Cancel
                </button>
                <button type="submit" className="bg-blue-500 text-white py-2 px-4 rounded">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;