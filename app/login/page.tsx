"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
const [password, setPassword] = useState("");

const handleLogin = async () => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = "/dashboard";
  } catch (error) {
    alert("Invalid Email or Password");
  }
};
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#EDE7F6] to-[#DCCBFA] px-4">
      <div className="w-[900px] h-[520px] bg-white rounded-2xl shadow-xl flex overflow-hidden">

        {/* LEFT SIDE – 40% TEXT */}
        <div className="w-[40%] p-10">
          <p className="text-sm text-gray-500 cursor-pointer mb-8">
            ← Back
          </p>

          <h1 className="text-3xl font-semibold text-gray-800">
            Welcome Back
          </h1>
          <p className="text-gray-500 mt-2">
            Sign in to continue to your account
          </p>

          {/* Email */}
          <div className="mt-7">
            <label className="text-sm text-gray-600">Email</label>
            <input
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  placeholder="Enter your email"
  className="w-full mt-2 px-4 py-3 rounded-xl bg-gray-100 outline-none focus:ring-2 focus:ring-purple-400"
/>
          </div>

          {/* Password */}
          <div className="mt-4">
            <label className="text-sm text-gray-600">Password</label>
            <div className="relative">
              <input
  type="password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  placeholder="Enter your password"
  className="w-full mt-2 px-4 py-3 rounded-xl bg-gray-100 outline-none focus:ring-2 focus:ring-purple-400"
     />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer">
                👁
              </span>
            </div>
          </div>

          {/* ✅ SIGN IN → DASHBOARD */}
          
            <button
               onClick={handleLogin}
              className="w-full mt-7 py-3 rounded-xl text-white font-medium
              bg-gradient-to-r from-[#7F3FBF] via-[#9B6BD6] to-[#F2A7D8]
              hover:opacity-90 transition"
            >
              Sign In
            </button>
          

          {/* Links */}
          <div className="flex justify-between text-sm text-gray-500 mt-5">
            <Link
              href="/password"
              className="hover:text-purple-600"
            >
              Forgot password?
            </Link>

            <Link
              href="/account"
              className="hover:text-purple-600 font-medium"
            >
              Create account
            </Link>
          </div>
        </div>

        {/* RIGHT SIDE – 60% IMAGE */}
        <div className="w-[60%] relative">
          <img
            src="/image.png"
            alt="Login Art"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>

      </div>
    </div>
  );
}
