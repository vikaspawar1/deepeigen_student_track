import { useState, useEffect } from "react";
import "./auth.css";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../../redux/store";
import { setUser } from "../../redux/slices/auth";
import { toast } from "react-toastify";
import api from "../../lib/api";

// Define complete user interface matching backend response
export interface User {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  phone_number?: string;
  profession?: string;
  country?: string;
  is_active: boolean;
  is_staff: boolean;
  is_superadmin: boolean;
  date_joined: string;
  last_login?: string;
  rememberMe?: boolean;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post("/accounts/login/", {
        email,
        password,
      });

      const data = response.data;

      if (!data.success) {
        toast.error(data.message || "Login failed");
        setLoading(false);
        return;
      }

      // Dispatch user and tokens to Redux (which also saves to localStorage)
      dispatch(
        setUser({
          user: {
            id: data.user.id,
            email: data.user.email,
            first_name: data.user.first_name,
            last_name: data.user.last_name,
            username: data.user.username,
            is_active: data.user.is_active,
            is_staff: data.user.is_staff,
            is_superadmin: data.user.is_superadmin,
            date_joined: data.user.date_joined,
            last_login: data.user.last_login,
            rememberMe,
          },
          access: data.access,
          refresh: data.refresh,
        })
      );

      toast.success("Login successful! Welcome back");
      navigate("/user_dashboard");
    } catch (error: any) {
      const msg = error.response?.data?.message || "Server error. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      {/* Left Panel */}
      <div className="flex-[0_0_45%] bg-gradient-to-b from-[#1D1F8E] to-[#3d024f] text-white p-[80px_60px] flex justify-center items-center">
        <div className="slogan">
          <h1 className="text-4xl font-bold tracking-wide">BRILLIANCE</h1>
          <h1 className="text-4xl font-bold tracking-wide mt-2">INITIATED</h1>
        </div>
      </div>

      {/* Right Panel */}
      <div className="register-panel-right">
        <div className="register-sub">
          <h1 className="register-title">Login</h1>
          <p className="register-subtitle">Let's continue the learning</p>

          <form className="register-form" onSubmit={handleSubmit}>
            {/* Email */}
            <div className="form-group">
              <label htmlFor="email">
                Email<span className="required">*</span>
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password */}
            <div className="form-group password-group">
              <label htmlFor="password">
                Password<span className="required">*</span>
              </label>
              <div className="password-input-container">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <i className="ri-eye-fill"></i> : <i className="ri-lock-fill"></i>}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="login__rememberMeForm">
              <label className="login__rememberMe">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <Link to="/forgot_password" className="login__forgotPassword">
                Forgot password ?
              </Link>
            </div>



            {/* Submit */}
            <button type="submit" className="register-button">
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          {/* Google Login */}
          {/* <button className="gooogle">
            <GoogleLoginButton />
          </button> */}

          <p className="login-link-container">
            Don't have an account?{" "}
            <Link to="/register" className="login-link">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
