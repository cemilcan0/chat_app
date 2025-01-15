import React, { useEffect, useState } from 'react';
import plusIcon from '../../../assets/icons/plus.svg';
import check from '../../../assets/icons/check.svg';
import cancel from '../../../assets/icons/cancel.svg';
import closeIcon from '../../../assets/icons/cancel.svg';
import useChatStore from '../store/chatStore';
import apiClient from '../utils/apiClient';

interface AddFriendProps {
  onPendingRequestCountChange?: (count: number) => void; // Callback prop
}

const AddFriend: React.FC<AddFriendProps> = ({ onPendingRequestCountChange }) => {
  const { friendRequests, fetchFriendRequests, acceptFriendRequest, declineFriendRequest } = useChatStore();

  const [isInputVisible, setIsInputVisible] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [localFriendRequests, setLocalFriendRequests] = useState(friendRequests);

  const handleAddFriend = async () => {
    if (username.trim() === '') {
      setErrorMessage('Please enter a username.');
      return;
    }

    try {
      await apiClient.post('/chat-app/send-friend-request/', { username });
      setUsername('');
      setErrorMessage('');
      setSuccessMessage('Friend request sent successfully!');

      setLocalFriendRequests((prev) =>
        prev.filter((request) => request.username !== username)
      );

      fetchFriendRequests();

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      console.error('Error sending friend request:', error);

      if (error.response && error.response.status === 404) {
        setErrorMessage('User not found. Please check the username.');
      } else {
        setErrorMessage('An error occurred while sending the friend request.');
      }
    }
  };

  useEffect(() => {
    fetchFriendRequests();
  }, [fetchFriendRequests]);

  useEffect(() => {
    // Notify parent component of pending request count change
    if (onPendingRequestCountChange) {
      onPendingRequestCountChange(friendRequests.length);
    }
  }, [friendRequests, onPendingRequestCountChange]);

  return (
    <div className="relative">
      {/* Plus Icon Button */}
      <button
        onClick={() => setIsInputVisible(!isInputVisible)}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-[#6b4ca5] hover:bg-[#76589A] text-white transition duration-200 shadow-md"
        aria-label="Add Friend"
      >
        <img src={plusIcon} alt="Add Friend" className="w-5 h-5" />
      </button>

      {isInputVisible && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setIsInputVisible(false)} // Arkaplana tıklanırsa popup kapanır
        >
          <div
            className="relative bg-[#433259] w-[90%] max-w-[400px] rounded-lg shadow-lg p-4"
            onClick={(e) => e.stopPropagation()} // Popup içindeki tıklamaları durdurur
          >
            {/* Close Button */}
            <button
              onClick={() => setIsInputVisible(false)}
              className="absolute -top-10 right-0 text-white"
              aria-label="Close"
            >
              <img src={closeIcon} alt="Close" className="w-4 h-4" />
            </button>

            {/* Search Input */}
            <div className="flex items-center mb-4 p-2 rounded-full shadow-md bg-black bg-opacity-20">
              <div className="relative flex-grow">
                {/* Search Icon */}
                <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M11 19a8 8 0 100-16 8 8 0 000 16zm10-2l-3.5-3.5"
                    />
                  </svg>
                </span>
                {/* Input */}
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full pl-10 py-2 text-sm bg-transparent text-white focus:outline-none placeholder-gray-400"
                />
              </div>

              <div className="relative">
                <button
                  onClick={handleAddFriend}
                  className="ml-2 bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 transition duration-200"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Success Message */}
            {successMessage && (
              <p className="text-green-400 text-xs text-center mb-2">{successMessage}</p>
            )}

            {/* Error Message */}
            {errorMessage && (
              <p className="text-red-400 text-xs text-center mb-2">{errorMessage}</p>
            )}

            {/* Pending Requests */}
            <div className="bg-[#57416d] rounded p-2 max-h-[200px] overflow-y-auto">
              <p className="text-gray-200 mb-2 text-sm font-semibold">Pending Requests</p>
              {friendRequests.length > 0 ? (
                friendRequests.map((request, index) => (
                  <div
                    className="flex items-center justify-between bg-[#6b4ca5] p-2 mb-2 rounded shadow-sm"
                    key={index}
                  >
                    <div className="flex items-center">
                      <img
                        src={request.photo || 'https://via.placeholder.com/40'}
                        alt="User"
                        className="w-8 h-8 rounded-full"
                      />
                      <div className="ml-3">
                        <p className="text-sm text-white">{request.name}</p>
                        <p className="text-xs text-gray-300">{request.username}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => acceptFriendRequest(request.username)}
                        className="bg-green-500 p-1 rounded-full hover:bg-green-600"
                        title="Accept"
                      >
                        <img src={check} alt="Accept" className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => declineFriendRequest(request.username)}
                        className="bg-red-500 p-1 rounded-full hover:bg-red-600"
                        title="Reject"
                      >
                        <img src={cancel} alt="Reject" className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-sm text-center">No pending friend requests.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddFriend;
