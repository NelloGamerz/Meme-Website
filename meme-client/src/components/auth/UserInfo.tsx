import React from 'react'
import { useAuthContext } from '../../hooks/useAuthContext'
import { getCurrentAuthUser } from '../../utils/authHelpers'

export const UserInfo: React.FC = () => {
  const { isAuthenticated, authUser, username,isLoading } = useAuthContext()

  if (isLoading) {
    return <div>Loading user info...</div>
  }

  if (!isAuthenticated || !authUser) {
    return <div>Not authenticated</div>
  }

  return (
    <div className="user-info">
      <h3>Current User Information</h3>
      <p><strong>Username:</strong> {username}</p>
      <p><strong>Full User Object:</strong> {JSON.stringify(authUser, null, 2)}</p>
    </div>
  )
}

export const ExampleUsage: React.FC = () => {
  const { username,isAuthenticated } = useAuthContext()
  const handleSomeAction = () => {
    if (isAuthenticated && username) {
    }
  }

  const handleActionFromHelper = () => {
    const currentUser = getCurrentAuthUser()
    if (currentUser?.isAuthenticated && currentUser.username) {
    }
  }

  return (
    <div>
      <button onClick={handleSomeAction}>
        Perform Action (React Context)
      </button>
      <button onClick={handleActionFromHelper}>
        Perform Action (Helper Function)
      </button>
    </div>
  )
}