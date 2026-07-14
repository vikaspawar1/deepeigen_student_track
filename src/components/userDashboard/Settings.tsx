import ChangePasswordForm from "./UI/ChangePasswordForm"
import {  type SettingsData } from './data/typesprofile';

const Settings = ({ 
  settingsData: _settingsData, 
  onUpdateSettings: _onUpdateSettings, 
  loading: _loading,
}: { 
  settingsData?: SettingsData; 
  onUpdateSettings?: (updatedData: Partial<SettingsData>) => Promise<void>; 
  loading?: boolean,
  profilePicture?: string | null
}) => {
  // const [profilePicture, setProfilePicture] = useState<string | null>(initialProfilePicture || null);

  // useEffect(() => {
  //   // If we don't have a profile picture passed as prop, fetch it
  //   if (!initialProfilePicture) {
  //     const loadProfile = async () => {
  //       try {
  //         const response = await fetchProfileData();
  //         if (response.success && response.data.profile) {
  //           setProfilePicture(response.data.profile.profilePicture);
  //         }
  //       } catch (err) {
  //         console.error("Error fetching profile for settings:", err);
  //       }
  //     };
  //     loadProfile();
  //   } else {
  //     setProfilePicture(initialProfilePicture);
  //   }
  // }, [initialProfilePicture]);

  return (
    <div>
        <ChangePasswordForm />
    </div>
  )
}

export default Settings