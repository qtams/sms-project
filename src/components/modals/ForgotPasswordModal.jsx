import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  FiCheckCircle,
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
  FiSend,
  FiXCircle,
} from "react-icons/fi";
import BaseModal from "./BaseModal";

const HARD_CODED_OTP = "111111";
const REGISTERED_EMAIL = "mr.tamahome.buendia@gmail.com";

const getPasswordChecks = (password) => {
  return [
    {
      id: "uppercase",
      label: "Must have at least 1 capital letter",
      isValid: /[A-Z]/.test(password),
    },
    {
      id: "number",
      label: "Must have at least 1 number",
      isValid: /[0-9]/.test(password),
    },
    {
      id: "length",
      label: "Must have at least 8 characters",
      isValid: password.length >= 8,
    },
  ];
};

const getPasswordStrength = (password) => {
  let score = 0;

  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (!password) {
    return {
      label: "Weak",
      width: "0%",
      barClass: "bg-red-500",
      textClass: "text-red-500",
      borderClass: "border-slate-200 focus:border-[#2838b8] focus:ring-blue-50",
      inputBg: "bg-white",
    };
  }

  if (score <= 2) {
    return {
      label: "Weak",
      width: "35%",
      barClass: "bg-red-500",
      textClass: "text-red-500",
      borderClass: "border-red-500 focus:border-red-500 focus:ring-red-50",
      inputBg: "bg-red-50/40",
    };
  }

  if (score <= 4) {
    return {
      label: "Medium",
      width: "70%",
      barClass: "bg-orange-400",
      textClass: "text-orange-500",
      borderClass:
        "border-orange-400 focus:border-orange-400 focus:ring-orange-50",
      inputBg: "bg-orange-50/40",
    };
  }

  return {
    label: "Strong",
    width: "100%",
    barClass: "bg-emerald-500",
    textClass: "text-emerald-600",
    borderClass:
      "border-emerald-500 focus:border-emerald-500 focus:ring-emerald-50",
    inputBg: "bg-emerald-50/40",
  };
};

const isValidEmail = (value) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
};

const ForgotPasswordModal = ({ isOpen, onClose }) => {
  const otpRefs = useRef([]);

  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState("");
  const [emailMessage, setEmailMessage] = useState("");

  const [otpBoxes, setOtpBoxes] = useState(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpError, setOtpError] = useState(false);
  const [shakeOtp, setShakeOtp] = useState(false);
  const [otpSuccess, setOtpSuccess] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setStep("email");
    setEmail("");
    setEmailStatus("");
    setEmailMessage("");
    setOtpBoxes(["", "", "", "", "", ""]);
    setCountdown(0);
    setIsSending(false);
    setIsVerifying(false);
    setOtpError(false);
    setShakeOtp(false);
    setOtpSuccess(false);
    setNewPassword("");
    setConfirmPassword("");
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || step !== "otp" || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, step, countdown]);

  const otpCode = otpBoxes.join("");

  useEffect(() => {
    if (step !== "otp") return;
    if (otpCode.length !== 6) return;
    if (isVerifying || otpSuccess) return;

    handleVerifyOtp(otpCode);
  }, [otpCode, step, isVerifying, otpSuccess]);

  useEffect(() => {
    if (step === "otp") {
      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 120);
    }
  }, [step]);

  const passwordChecks = useMemo(() => {
    return getPasswordChecks(newPassword);
  }, [newPassword]);

  const invalidPasswordChecks = passwordChecks.filter((item) => !item.isValid);
  const shouldShowPasswordChecks =
    newPassword.length > 0 && invalidPasswordChecks.length > 0;

  const strength = getPasswordStrength(newPassword);
  const isCorePasswordValid = passwordChecks.every((item) => item.isValid);

  const isConfirmPasswordMismatch =
    confirmPassword.length > 0 && newPassword !== confirmPassword;

  const isConfirmPasswordMatch =
    confirmPassword.length > 0 && newPassword === confirmPassword;

  const modalTitle =
    step === "email"
      ? "Forgot Password"
      : step === "otp"
        ? "Verify OTP"
        : "Create New Password";

  const modalDescription =
    step === "email"
      ? "Enter your registered email address to receive a verification code."
      : step === "otp"
        ? "OTP has been sent to your registered email address."
        : "Create a strong new password for your account.";

  const triggerOtpShake = () => {
    setShakeOtp(false);

    setTimeout(() => {
      setShakeOtp(true);
    }, 10);

    setTimeout(() => {
      setShakeOtp(false);
    }, 650);
  };

  const handleSendVerification = (event) => {
    event.preventDefault();

    const cleanEmail = email.trim().toLowerCase();

    setEmailStatus("");
    setEmailMessage("");

    if (!isValidEmail(cleanEmail)) {
      setEmailStatus("error");
      setEmailMessage("Please enter a valid email address.");
      return;
    }

    setIsSending(true);

    setTimeout(() => {
      if (cleanEmail !== REGISTERED_EMAIL.toLowerCase()) {
        setIsSending(false);
        setEmailStatus("error");
        setEmailMessage("Email does not exist.");
        return;
      }

      setEmailStatus("success");
      setEmailMessage("Email verified. Sending code...");

      setTimeout(() => {
        setIsSending(false);
        setStep("otp");
        setCountdown(60);
        setOtpBoxes(["", "", "", "", "", ""]);
        setOtpError(false);
        setShakeOtp(false);
        setOtpSuccess(false);
      }, 850);
    }, 650);
  };

  const handleOtpChange = (index, value) => {
    const digit = String(value || "")
      .replace(/\D/g, "")
      .slice(-1);

    setOtpError(false);
    setShakeOtp(false);
    setOtpSuccess(false);

    setOtpBoxes((current) => {
      const next = [...current];
      next[index] = digit;
      return next;
    });

    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, event) => {
    if (event.key === "Backspace" && !otpBoxes[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (event) => {
    event.preventDefault();

    const pastedCode = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (!pastedCode) return;

    const nextOtp = ["", "", "", "", "", ""];

    pastedCode.split("").forEach((digit, index) => {
      nextOtp[index] = digit;
    });

    setOtpBoxes(nextOtp);

    const nextIndex = Math.min(pastedCode.length, 5);
    otpRefs.current[nextIndex]?.focus();
  };

  const handleVerifyOtp = (code = otpCode) => {
    if (String(code).length !== 6) return;

    setIsVerifying(true);
    setOtpError(false);

    setTimeout(() => {
      if (String(code) === HARD_CODED_OTP) {
        setIsVerifying(false);
        setOtpSuccess(true);

        setTimeout(() => {
          setStep("password");
          setOtpSuccess(false);
        }, 900);

        return;
      }

      setIsVerifying(false);
      setOtpSuccess(false);
      setOtpError(true);
      setOtpBoxes(["", "", "", "", "", ""]);
      triggerOtpShake();

      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 120);
    }, 850);
  };

  const handleResendOtp = () => {
    if (countdown > 0) return;

    setCountdown(60);
    setOtpBoxes(["", "", "", "", "", ""]);
    setOtpError(false);
    setShakeOtp(false);
    setOtpSuccess(false);

    setTimeout(() => {
      otpRefs.current[0]?.focus();
    }, 120);
  };

  const handleSavePassword = (event) => {
    event.preventDefault();

    if (!newPassword || !confirmPassword) {
      toast.error("Please enter and confirm your new password.");
      return;
    }

    if (!isCorePasswordValid) {
      toast.error("Please complete all password requirements.");
      return;
    }

    if (!isConfirmPasswordMatch) {
      toast.error("Confirm password must match.");
      return;
    }

    localStorage.setItem(
      "spry_forgot_password_test",
      JSON.stringify({
        email: email.trim(),
        password: newPassword,
        updatedAt: new Date().toISOString(),
      }),
    );

    onClose?.();

    setTimeout(() => {
      toast.success("Password updated successfully.");
    }, 150);
  };

  const emailInputClass =
    emailStatus === "success"
      ? "border-emerald-400 bg-emerald-50 focus:border-emerald-500 focus:ring-emerald-50"
      : emailStatus === "error"
        ? "border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-50"
        : "border-slate-200 bg-white focus:border-[#2838b8] focus:ring-blue-50";

  return (
    <BaseModal
      isOpen={isOpen}
      title={modalTitle}
      description={modalDescription}
      onClose={onClose}
      maxWidth="max-w-lg"
    >
      <div className="mb-6 grid grid-cols-3 gap-2">
        {[
          { label: "Email", value: "email" },
          { label: "OTP", value: "otp" },
          { label: "Password", value: "password" },
        ].map((item, index) => {
          const isActive = step === item.value;
          const isDone =
            (step === "otp" && index === 0) ||
            (step === "password" && index < 2);

          return (
            <div
              key={item.value}
              className={`h-2 rounded-full transition ${
                isActive || isDone ? "bg-[#2838b8]" : "bg-slate-200"
              }`}
              title={item.label}
            />
          );
        })}
      </div>

      {step === "email" && (
        <form onSubmit={handleSendVerification} className="space-y-5">
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
              <FiMail className="text-[#2838b8]" />
              Registered Email Address
            </label>

            <input
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setEmailStatus("");
                setEmailMessage("");
              }}
              placeholder="Enter registered email"
              className={`h-13 w-full rounded-md border px-4 py-4 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:ring-4 ${emailInputClass}`}
            />

            {emailMessage && (
              <div
                className={`mt-3 flex items-center gap-2 rounded-md px-4 py-3 text-sm font-medium ${
                  emailStatus === "success"
                    ? "forgot-password-email-success border border-emerald-300 bg-emerald-50 text-emerald-700"
                    : "forgot-password-email-error border border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {emailStatus === "success" ? <FiCheckCircle /> : <FiXCircle />}
                {emailMessage}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#2838b8] px-6 py-3 text-sm font-medium text-white shadow-lg shadow-blue-100 transition hover:bg-[#22319e] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSending ? "Checking..." : "Send Verification"}
            {!isSending && <FiSend />}
          </button>
        </form>
      )}

      {step === "otp" && (
        <div className="space-y-6 text-center">
          <p className="text-sm font-medium text-slate-500">
            OTP has been sent to your registered email address.
          </p>

          <div
            className={`flex justify-center gap-2 ${
              shakeOtp ? "forgot-password-otp-shake" : ""
            } ${otpSuccess ? "forgot-password-otp-glow" : ""}`}
          >
            {otpBoxes.map((digit, index) => (
              <input
                key={index}
                ref={(element) => {
                  otpRefs.current[index] = element;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(event) => handleOtpChange(index, event.target.value)}
                onKeyDown={(event) => handleOtpKeyDown(index, event)}
                onPaste={handleOtpPaste}
                disabled={isVerifying || otpSuccess}
                className={`h-12 w-11 rounded-md border-2 text-center text-sm font-medium text-slate-950 outline-none transition sm:h-14 sm:w-12 ${
                  otpSuccess
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : otpError
                      ? "border-red-400 bg-red-50"
                      : isVerifying
                        ? "border-orange-400 bg-orange-50"
                        : "border-lime-400 bg-white focus:border-[#2838b8] focus:ring-4 focus:ring-blue-50"
                }`}
              />
            ))}
          </div>

          <p className="text-sm font-medium text-slate-500">
            OTP will verify automatically after the last digit.
          </p>

          {isVerifying && (
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-orange-600">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-orange-300 border-t-orange-600" />
              Verifying OTP...
            </div>
          )}

          {!otpSuccess && (
            <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-slate-500">
              <span>Did not receive the OTP?</span>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={countdown > 0}
                className="font-medium text-[#2838b8] transition hover:text-cyan-600 disabled:cursor-not-allowed disabled:text-slate-500"
              >
                {countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
              </button>
            </div>
          )}
        </div>
      )}

      {step === "password" && (
        <form onSubmit={handleSavePassword} className="space-y-4">
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
              <FiLock className="text-[#2838b8]" />
              New Password <span className="text-red-500">*</span>
            </label>

            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Enter new password"
                className={`h-14 w-full rounded-md border px-4 pr-12 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:ring-4 ${strength.inputBg} ${strength.borderClass}`}
              />

              <button
                type="button"
                onClick={() => setShowNewPassword((current) => !current)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
              >
                {showNewPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>

            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500">
                Password strength
              </p>

              <p className={`text-xs font-medium ${strength.textClass}`}>
                {strength.label}
              </p>
            </div>

            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all duration-500 ${strength.barClass}`}
                style={{ width: strength.width }}
              />
            </div>
          </div>

          {shouldShowPasswordChecks && (
            <div className="-mt-1 space-y-1">
              {invalidPasswordChecks.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 text-sm font-medium text-red-500"
                >
                  <FiXCircle className="shrink-0 text-red-500" />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          )}

          <div className="pt-1">
            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
              <FiLock className="text-[#2838b8]" />
              Confirm Password <span className="text-red-500">*</span>
            </label>

            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Re-enter new password"
                className={`h-14 w-full rounded-md border bg-white px-4 pr-12 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
                  isConfirmPasswordMatch
                    ? "border-emerald-500 bg-emerald-50/40 focus:border-emerald-500 focus:ring-emerald-50"
                    : isConfirmPasswordMismatch
                      ? "border-red-500 bg-red-50/40 focus:border-red-500 focus:ring-red-50"
                      : "border-slate-200 focus:border-[#2838b8] focus:ring-blue-50"
                }`}
              />

              <button
                type="button"
                onClick={() => setShowConfirmPassword((current) => !current)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
              >
                {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>

            {isConfirmPasswordMismatch && (
              <p className="mt-2 flex items-center gap-2 text-sm font-medium text-red-500">
                <FiXCircle />
                Confirm password must match.
              </p>
            )}
          </div>

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-6 py-3 text-sm font-medium text-white transition hover:bg-[#2838b8]"
          >
            Save New Password
            <FiCheckCircle />
          </button>
        </form>
      )}

      <style>
        {`
          .forgot-password-email-success {
            animation: forgotPasswordEmailSuccess 520ms ease both;
          }

          .forgot-password-email-error {
            animation: forgotPasswordEmailError 420ms ease both;
          }

          .forgot-password-otp-shake {
            animation: forgotPasswordOtpShake 520ms ease-in-out;
          }

          .forgot-password-otp-glow {
            animation: forgotPasswordOtpGlow 900ms ease both;
          }

          @keyframes forgotPasswordEmailSuccess {
            0% {
              opacity: 0;
              transform: translateY(8px) scale(0.98);
            }

            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @keyframes forgotPasswordEmailError {
            0% {
              transform: translateX(0);
            }

            20% {
              transform: translateX(-6px);
            }

            40% {
              transform: translateX(6px);
            }

            60% {
              transform: translateX(-4px);
            }

            80% {
              transform: translateX(4px);
            }

            100% {
              transform: translateX(0);
            }
          }

          @keyframes forgotPasswordOtpShake {
            0% {
              transform: translateX(0);
            }

            15% {
              transform: translateX(-10px);
            }

            30% {
              transform: translateX(10px);
            }

            45% {
              transform: translateX(-8px);
            }

            60% {
              transform: translateX(8px);
            }

            75% {
              transform: translateX(-4px);
            }

            100% {
              transform: translateX(0);
            }
          }

          @keyframes forgotPasswordOtpGlow {
            0% {
              filter: drop-shadow(0 0 0 rgba(16, 185, 129, 0));
              transform: scale(1);
            }

            50% {
              filter: drop-shadow(0 0 16px rgba(16, 185, 129, 0.35));
              transform: scale(1.04);
            }

            100% {
              filter: drop-shadow(0 0 0 rgba(16, 185, 129, 0));
              transform: scale(1);
            }
          }
        `}
      </style>
    </BaseModal>
  );
};

export default ForgotPasswordModal;
