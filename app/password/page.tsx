"use client";

import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#EDE7F6] to-[#DCCBFA] px-4">
      <div className="w-[900px] h-[420px] bg-white rounded-2xl shadow-xl flex overflow-hidden">

        {/* LEFT – FORM (40%) */}
        <div className="w-[40%] p-10 flex flex-col justify-center">
          <h1 className="text-2xl font-semibold text-gray-800">
            Forgot Password
          </h1>

          <p className="text-sm text-gray-500 mt-2">
            Enter your email to reset your password.
          </p>

          {/* Email */}
          <div className="mt-6">
            <label className="text-sm text-gray-600">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full mt-2 px-4 py-3 rounded-lg bg-gray-100 outline-none
              focus:ring-2 focus:ring-purple-400"
            />
          </div>

          {/* Button */}
          <button
            className="mt-6 py-3 rounded-lg text-white font-medium
            bg-gradient-to-r from-[#7F3FBF] to-[#9B6BD6]
            hover:opacity-90 transition"
          >
            Send Reset Link
          </button>

          {/* Create account */}
          <Link
            href="/login"
            className="text-sm text-gray-400 mt-6 hover:text-purple-600"
          >
            Back to login
          </Link>
        </div>

        {/* RIGHT – IMAGE (60%) */}
        <div className="w-[60%] bg-[#F6F2FF] flex items-center justify-center">
          <img
            src="/password.png"
            alt="Forgot Password"
            className="w-[300px]"
          />
        </div>

      </div>
    </div>
  );
}
