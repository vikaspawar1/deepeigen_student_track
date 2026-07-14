import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { AppDispatch } from "../../redux/store";
import { setUser } from "../../redux/slices/auth";
import api from "../../lib/api";


interface GoogleUser {
    email: string;
    name: string;
    picture: string;
    // add more fields if needed
}

const GoogleLoginButton: React.FC = () => {

    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();

    return (
        <GoogleLogin
            onSuccess={(credentialResponse) => {
                const token = credentialResponse.credential;
                if (!token) return;

                const user: GoogleUser = jwtDecode(token);
                console.log("Google User:", user);

                //  Using api client instead of csrfFetch
                api.post('/accounts/google-login/', {
                    token: token,
                })
                    .then((res) => {
                        const data = res.data;
                        console.log("Backend Response:", data);
                        dispatch(setUser({
                            user: data.user,
                            access: data.access,
                            refresh: data.refresh
                        }));
                        navigate("/user_dashboard");
                    })
                    .catch((err) => console.error("Error:", err));


            }}
            onError={() => {
                console.log("Google Login Failed");
            }}
        />
    );
};

export default GoogleLoginButton;
