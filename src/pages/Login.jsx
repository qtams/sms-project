import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { FiArrowRight, FiEye, FiEyeOff, FiLock, FiUser } from "react-icons/fi";

import spryLogo from "../assets/Sprylogo.webp";
import ForgotPasswordModal from "../components/modals/ForgotPasswordModal";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();

  const { user, isAuthLoading, login } = useAuth();

  const savedUsername = useMemo(() => {
    return localStorage.getItem("spry_remembered_username") || "";
  }, []);

  const [formData, setFormData] = useState({
    username: savedUsername,
    password: "",
    rememberMe: Boolean(savedUsername),
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

  if (!isAuthLoading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  /* =========================================================
     HANDLE INPUT CHANGE
  ========================================================= */

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setMessage({
      type: "",
      text: "",
    });

    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  /* =========================================================
     LOGIN
  ========================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    const username = formData.username.trim();
    const password = formData.password;

    if (!username || !password) {
      setMessage({
        type: "error",
        text: "Please enter username and password.",
      });

      return;
    }

    setIsLoading(true);

    setMessage({
      type: "",
      text: "",
    });

    try {
      await login({
        username,
        password,
        remember: formData.rememberMe,
      });

      if (formData.rememberMe) {
        localStorage.setItem("spry_remembered_username", username);
      } else {
        localStorage.removeItem("spry_remembered_username");
      }

      navigate("/dashboard", {
        replace: true,
      });
    } catch (error) {
      const validationMessage = error.response?.data?.errors?.username?.[0];

      setMessage({
        type: "error",

        text:
          validationMessage ||
          error.response?.data?.message ||
          "Unable to connect to the server.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#eef4ff] text-slate-950">
      {/* BACKGROUND */}

      <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-blue-200/60 blur-3xl" />

      <div className="pointer-events-none absolute -bottom-24 -right-20 h-80 w-80 rounded-full bg-cyan-200/80 blur-3xl" />

      <div className="pointer-events-none absolute right-10 top-10 hidden h-52 w-52 rounded-full bg-white/50 blur-3xl md:block" />

      {/* =====================================================
          LOGIN
      ===================================================== */}

      <main className="relative z-10 flex min-h-screen items-center justify-center px-5 py-8">
        <div className="w-full max-w-[390px] lg:max-w-[480px] lg:rounded-md lg:bg-white/85 lg:p-10 lg:shadow-2xl lg:shadow-slate-200/80 lg:backdrop-blur">
          {/* LOGO */}

          <div className="mb-9 flex justify-center">
            <img
              src={spryLogo}
              alt="SPRYtech"
              className="h-auto w-[180px] object-contain drop-shadow-sm"
            />
          </div>

          {/* HEADER */}

          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
              Login to your Account
            </h1>

            <p className="mt-2 text-sm font-semibold text-slate-500">
              Welcome back. Please enter your details.
            </p>
          </div>

          {/* MESSAGE */}

          {message.text && (
            <div
              className={`mb-5 rounded-md border px-4 py-3 text-sm font-medium ${
                message.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* =================================================
              FORM
          ================================================= */}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* USERNAME */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Username
              </label>

              <div className="relative">
                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter username"
                  autoComplete="username"
                  className="
                    h-12
                    w-full
                    rounded-md
                    border
                    border-slate-200
                    bg-white/90
                    pl-11
                    pr-4
                    text-sm
                    font-normal
                    text-slate-800
                    shadow-sm
                    outline-none
                    transition
                    placeholder:font-normal
                    placeholder:text-slate-400
                    focus:border-[#2838b8]
                    focus:bg-white
                    focus:ring-4
                    focus:ring-blue-50
                  "
                />
              </div>
            </div>

            {/* PASSWORD */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Password
              </label>

              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  className="
                    h-12
                    w-full
                    rounded-md
                    border
                    border-slate-200
                    bg-white/90
                    pl-11
                    pr-12
                    text-sm
                    font-normal
                    text-slate-800
                    shadow-sm
                    outline-none
                    transition
                    placeholder:font-normal
                    placeholder:text-slate-400
                    focus:border-[#2838b8]
                    focus:bg-white
                    focus:ring-4
                    focus:ring-blue-50
                  "
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 transition hover:text-slate-800"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            {/* OPTIONS */}

            <div className="flex items-center justify-between gap-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-600">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-[#2838b8]"
                />
                Remember me
              </label>

              <button
                type="button"
                onClick={() => setIsForgotPasswordOpen(true)}
                className="cursor-pointer text-sm font-semibold text-[#2838b8] transition hover:text-cyan-600"
              >
                Forgot password?
              </button>
            </div>

            {/* SUBMIT */}

            <button
              type="submit"
              disabled={isLoading}
              className="
                flex
                h-12
                w-full
                cursor-pointer
                items-center
                justify-center
                gap-2
                rounded-md
                bg-[#2838b8]
                text-sm
                font-semibold
                text-white
                shadow-lg
                shadow-blue-200/70
                transition
                hover:-translate-y-0.5
                hover:bg-[#22319e]
                hover:shadow-xl
                disabled:cursor-not-allowed
                disabled:opacity-70
              "
            >
              {isLoading ? "Signing in..." : "Sign in"}

              {!isLoading && <FiArrowRight />}
            </button>
          </form>

          {/* FOOTER */}

          <p className="mt-10 text-center text-xs font-semibold text-slate-400">
            © {new Date().getFullYear()} SPRYtech. All rights reserved.
          </p>
        </div>
      </main>

      {/* =====================================================
          FORGOT PASSWORD
      ===================================================== */}

      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
      />
    </div>
  );
};

export default Login;
