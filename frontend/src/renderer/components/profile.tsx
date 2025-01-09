import React from 'react'
import LogoutButton from './logout-button';

type Props = {}

const Profile: React.FC<Props> = () => {
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <div>
      <div className="mb-4 p-4 bg-white rounded shadow flex justify-between items-center">
        <div className="flex items-center">
          <img
            src={`https://testapi.berat-dogan.com${storedUser.photo}` || "https://via.placeholder.com/50"}
            alt="User Avatar"
            className="w-12 h-12 rounded-full mr-4"
          />
          <div>
            <h3 className="text-lg font-bold">{storedUser.name || "Unknown User"}</h3>
            <p className="text-sm text-gray-500">{storedUser.username}</p>
          </div>
        </div>
        <LogoutButton />
      </div>
    </div>
  )
}

export default Profile