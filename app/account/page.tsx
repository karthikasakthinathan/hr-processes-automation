"use client";

import { useState } from "react";
import Link from "next/link";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/firebase";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const db = getFirestore();

export default function CreateAccountPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyCode, setCompanyCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!fullName || !email || !password || !companyCode) {
      alert("Please fill all fields");
      return;
    }

    try {
      setLoading(true);

      // Create user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      // Update display name
      await updateProfile(user, {
        displayName: fullName,
      });

      // Save extra data to Firestore
      await setDoc(doc(db, "users", user.uid), {
        fullName,
        email,
        companyCode,
        createdAt: new Date(),
      });

      alert("Account created successfully ✅");
    } catch (error: any) {
      console.error(error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#EDE7F6] to-[#DCCBFA] px-4">
      <div className="w-[900px] h-[520px] bg-white rounded-2xl shadow-xl flex overflow-hidden">

        {/* LEFT – IMAGE */}
        <div className="w-[50%] relative">
          <img
            src="/image.png"
            alt="Signup Art"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>

        {/* RIGHT – FORM */}
        <div className="w-[50%] px-7 py-7 flex flex-col justify-center">

          <h1 className="text-xl font-semibold text-gray-800">
            Create Account
          </h1>

          <input
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full mt-3 px-3 py-2 rounded-lg bg-gray-100 text-sm"
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mt-3 px-3 py-2 rounded-lg bg-gray-100 text-sm"
          />

          <input
            type="password"
            placeholder="Create Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mt-3 px-3 py-2 rounded-lg bg-gray-100 text-sm"
          />

          <input
            type="text"
            placeholder="Company Code"
            value={companyCode}
            onChange={(e) => setCompanyCode(e.target.value)}
            className="w-full mt-3 px-3 py-2 rounded-lg bg-gray-100 text-sm"
          />

          <button
            onClick={handleSignup}
            disabled={loading}
            className="w-full mt-4 py-2 rounded-lg text-white font-medium
            bg-gradient-to-r from-[#7F3FBF] via-[#9B6BD6] to-[#F2A7D8]
            hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? "Creating..." : "Sign Up"}
          </button>

          <p className="text-xs text-center mt-3">
            Already have an account?{" "}
            <Link href="/login" className="text-purple-600 hover:underline">
              Sign in
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}
