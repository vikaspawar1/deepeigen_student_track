import LoggedIn from "../components/userDashboard/LoggedIn"
import ChatWidget from "../chatbot/ChatWidget"

const UserDashboard = () => {
  return (
    <div>
        <LoggedIn />
        <ChatWidget />
    </div>
  )
}

export default UserDashboard