"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/firebase";

export default function ForgotPasswordPage() {

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [success, setSuccess] = useState(false);

  const router = useRouter();

  const handleReset = async () => {

    if (!email.trim()) {
      setMsg("Please enter your email");
      return;
    }

    try {
      setLoading(true);
      setMsg("");

      // ⭐ trim important
      await sendPasswordResetEmail(auth, email.trim());

      setSuccess(true);
      setMsg("If an account exists, reset link has been sent. Redirecting to login...");

      setTimeout(() => {
        router.push("/login");
      }, 3000);

    } catch (err: any) {

      setSuccess(false);

      if (err.code === "auth/invalid-email") {
        setMsg("Invalid email format");
      } else if (err.code === "auth/too-many-requests") {
        setMsg("Too many attempts. Try again later");
      } else {
        setMsg("Something went wrong. Please try again");
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#EDE7F6] to-[#DCCBFA] px-4">

      <div className="w-[900px] h-[420px] bg-white rounded-2xl shadow-xl flex overflow-hidden">

        {/* LEFT */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleReset();
          }}
          className="w-[40%] p-10 flex flex-col justify-center"
        >
          <h1 className="text-2xl font-semibold text-gray-800">
            Forgot Password
          </h1>

          <p className="text-sm text-gray-500 mt-2">
            Enter your email to reset your password.
          </p>

          <div className="mt-6">
            <label className="text-sm text-gray-600">Email</label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-2 px-4 py-3 rounded-lg bg-gray-100 outline-none
              focus:ring-2 focus:ring-purple-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className={`mt-6 py-3 rounded-lg text-white font-medium transition
            ${success
                ? "bg-green-500"
                : "bg-gradient-to-r from-[#7F3FBF] to-[#9B6BD6] hover:opacity-90"}
            ${loading ? "opacity-60 cursor-not-allowed" : ""}
            `}
          >
            {loading
              ? "Sending..."
              : success
                ? "Email Sent ✓"
                : "Send Reset Link"}
          </button>

          {msg && (
            <p className={`text-sm mt-4 text-center font-medium
              ${success ? "text-green-600" : "text-red-500"}`}>
              {msg}
            </p>
          )}

          <Link
            href="/login"
            className="text-sm text-gray-400 mt-6 hover:text-purple-600"
          >
            Back to login
          </Link>

        </form>

        {/* RIGHT */}
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