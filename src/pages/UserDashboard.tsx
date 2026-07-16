import LoggedIn from "../components/userDashboard/LoggedIn"
import ChatWidget from "../components/userDashboard/chatbot/ChatWidget"

const UserDashboard = () => {
  return (
    <div>
        <LoggedIn />
        <ChatWidget />
    </div>
  )
}

export default UserDashboard