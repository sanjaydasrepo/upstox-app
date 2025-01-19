import React from "react";
import { FormEvent, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";
import axiosInstance from "../utils/axiosConfig";

interface SignInError {
  message: string;
  code?: string;
}

export default function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<SignInError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);

  const handleError = (error: string) => {
    let errorMessage = "Failed to sign in";
    let errorCode = "UNKNOWN_ERROR";

    try {
      const parsedError = JSON.parse(error);
      errorMessage = parsedError.message;
      errorCode = parsedError.code;
    } catch {
      if (error === "CredentialsSignin") {
        errorMessage = "Invalid email or password";
        errorCode = "INVALID_CREDENTIALS";
      }
    }

    setError({ message: errorMessage, code: errorCode });
  };

  const handleResendVerification = async () => {
    setIsResendingVerification(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/resend-verification`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        setError({
          message: data.message || "Failed to resend verification email",
        });
      } else {
        setError({
          message: "Verification email sent successfully",
          code: "SUCCESS",
        });
      }
    } catch (err) {
      setError({ message: "Failed to resend verification email" });
    } finally {
      setIsResendingVerification(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const resp = await axiosInstance.post(`/auth/local`, {
        identifier: email,
        password: password,
      });
      if( resp.status === 200 ){
        if( resp.data ) {
          if( resp.data.jwt ) {
            localStorage.setItem('token', resp.data.jwt);
            window.location.href = `/dashboard`;
          }
          console.log("data login ", resp.data );
        }
      }
    } catch (err) {
      console.log("errrr ", err );
      handleError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      <div className="flex w-full flex-col items-center justify-center px-4 md:w-[60%] md:px-14 lg:px-20">
        <div className="w-full md:w-[50%]">
          <h2 className="mb-2 text-3xl font-semibold text-white">Sign in</h2>

          {error && (
            <div
              className={`mb-4 rounded-lg p-3 ${
                error.code === "SUCCESS"
                  ? "bg-green-100/10 text-green-500"
                  : "bg-red/10 text-red"
              }`}
            >
              {error.message}
              {error.code === "NOT_VERIFIED" && (
                <button
                  onClick={handleResendVerification}
                  disabled={isResendingVerification}
                  className="ml-2 text-blue-500 underline hover:text-blue-600"
                >
                  {isResendingVerification
                    ? "Sending..."
                    : "Resend verification email"}
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                className="text-gray-neutral-20 mb-2 block"
                htmlFor="email"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                placeholder="Enter Your Email"
                className="border-gray-neutral-20 placeholder:text-gray-neutral-40 focus:ring-blue-gray-70 w-full rounded-lg border bg-transparent px-4 py-3 text-black focus:outline-none focus:ring-1"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                disabled={isLoading}
                required
              />
            </div>

            <div>
              <label
                className="text-gray-neutral-20 mb-2 block"
                htmlFor="password"
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="Password"
                  className="border-gray-neutral-20 placeholder:text-gray-neutral-40 focus:ring-blue-gray-70 w-full rounded-lg border bg-transparent px-4 py-3 text-black focus:outline-none focus:ring-1"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-neutral-40 absolute right-4 top-1/2 -translate-y-1/2"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <Link
                to="/auth/forgot-password"
                className="text-blue-gray-70 hover:text-blue-gray-50 mt-2 inline-block text-sm"
              >
                Forgot your password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="hover:bg-blue-gray-60 w-full rounded-lg bg-[#457AFC] py-3 text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>

            <p className="text-gray-neutral-20 text-center">
              Don&apos;t have an account?{" "}
              <Link
                to="/auth/signup"
                className="text-blue-gray-70 hover:text-blue-gray-50"
              >
                Sign up
              </Link>
            </p>
          </form>
        </div>
      </div>

      {/* Right Section */}
      <div className="hidden items-center justify-end rounded-2xl bg-[#457AFC] md:my-8 md:mr-8 md:flex md:w-[40%] lg:mr-16">
        <div className="flex flex-1 flex-col items-end">
          <div className="self-start pl-8">
            <h1 className="mb-2 text-4xl font-bold text-white">
              Hello, Friend!
            </h1>
            <p className="text-sm font-light text-white/80">
              To keep connected with us please login with your personal info.
            </p>
          </div>

          <div className="mt-8">
            <img
              src="/images/signin/signin_stacks.png"
              alt="Statistics Preview"
              width={632}
              height={300}
              className="rounded-lg shadow-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
