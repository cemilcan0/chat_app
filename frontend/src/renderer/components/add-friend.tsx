import React, { useEffect, useState } from 'react';
import plusIcon from '../../../assets/icons/plus.svg';
import searchIcon from '../../../assets/icons/search.svg';
import check from '../../../assets/icons/check.svg';
import cancel from '../../../assets/icons/cancel.svg';
import apiClient from '../utils/apiClient';

const AddFriend: React.FC = () => {
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const [isInputVisible, setIsInputVisible] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');

  const handleAddFriend = async () => {
    if (username.trim() === '') {
      return;
    }

    try {
      const response = await apiClient.post('/chat-app/send-friend-request/', { username });
      console.log('Friend request sent:', response.data);

      setUsername('');
      setIsInputVisible(false);
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  const acceptFriendRequest = async (username: string) => {
    try {
      const response = await apiClient.post('/chat-app/accept-friend-request/', { username });
      console.log('Friend request accepted:', response.data);

      fetchFriendRequests();
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  const declineFriendRequest = async (username: string) => {
    try {
      const response = await apiClient.post('/chat-app/decline-friend-request/', { username });
      console.log('Friend request declined:', response.data);

      fetchFriendRequests();
    } catch (error) {
      console.error('Error declining friend request:', error);
    }
  };

  const fetchFriendRequests = async () => {
    try {
      const response = await apiClient.get('/chat-app/pending-friend-requests/');
      console.log('Pending friend requests fetched:', response.data);

      setFriendRequests(response.data);
    } catch (error) {
      console.error('Error fetching friend requests:', error);
    }
  };

  useEffect(() => {
    fetchFriendRequests();
  }, []);

  return (
    <div>
      <button
        onClick={() => setIsInputVisible(true)}
        className="flex items-center justify-center w-10 h-10 rounded-r-full bg-gray-300 hover:bg-gray-400 text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all duration-200 shadow-sm"
        aria-label="Add Friend"
      >
        <img src={plusIcon} alt="Add Friend" className="w-5 h-5" />
      </button>

      {isInputVisible && (
        <div className='grid place-items-center fixed inset-0 z-40'>
          <div
            onClick={() => setIsInputVisible(false)}
            className="fixed inset-0 bg-black opacity-50 z-30"
          ></div>
          <div
            className="z-40 flex flex-col items-center justify-center"
          >
            <div
              className="relative bg-white shadow-lg rounded-t-3xl flex items-center w-[450px] p-2 border border-gray-300 z-50"
            >
              <img
                src={searchIcon}
                alt="Search"
                className="w-5 h-5 ml-2 text-gray-500"
              />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="flex-grow ml-2 p-2 text-gray-700 focus:outline-none"
              />
              <button
                onClick={handleAddFriend}
                className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
              >
                Add
              </button>
            </div>

            {/* Pending Requests */}
            <div className="bg-white p-2 rounded-b-3xl shadow-lg w-[450px] h-[300px] overflow-y-auto">
              <div className="flex items-center justify-start border-b border-gray-300 pb-2">
                <p className="text-gray-700">Pending Requests</p>
              </div>
              {
                friendRequests.length > 0 ? (
                  friendRequests.map((request, index) => (
                    <div
                      className="flex items-center justify-between mt-2 px-3 py-1"
                      key={index}
                    >
                      <div className='flex items-center gap-5'>
                        <img
                          src={request.photo}
                          alt="User"
                          className="w-12 h-12 rounded-full"
                        />
                        <div>
                          <p className="text-gray-700">{request.name}</p>
                          <p className="text-xs text-gray-500">{request.username}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 items-center">
                        <button
                          className="w-7 h-7 flex items-center justify-center bg-green-500 hover:bg-green-600 text-white rounded-full shadow-md transition duration-300"
                          title="Accept"
                          onClick={() => acceptFriendRequest(request.username)}
                        >
                          <img src={check} alt="Accept" className="w-3 h-3" />
                        </button>
                        <button
                          className="w-7 h-7 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-full shadow-md transition duration-300"
                          title="Reject"
                          onClick={() => declineFriendRequest(request.username)}
                        >
                          <img src={cancel} alt="Reject" className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center mt-5">
                    <p className="text-gray-500">No pending friend requests.</p>
                  </div>
                )
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddFriend;
