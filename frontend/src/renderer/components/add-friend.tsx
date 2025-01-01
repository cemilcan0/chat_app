import React, { useState } from 'react';
import useChatStore from '../store/chatStore';
import plusIcon from '../../../assets/icons/plus.svg';
import searchIcon from '../../../assets/icons/search.svg';
import check from '../../../assets/icons/check.svg';
import cancel from '../../../assets/icons/cancel.svg';

type Props = {};

const AddFriend: React.FC<Props> = () => {
  const { addFriend, friendRequests, acceptFriendRequest, declineFriendRequest } = useChatStore();
  const [isInputVisible, setIsInputVisible] = useState(false);
  const [username, setUsername] = useState('');

  const handleAddFriend = () => {
    if (username.trim() === '') {
      return;
    }
    addFriend(username);
    setUsername('');
    setIsInputVisible(false);
  };

  return (
    <div>
      <button
        onClick={() => setIsInputVisible(true)}
        className="flex items-center justify-center w-8 h-8"
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
