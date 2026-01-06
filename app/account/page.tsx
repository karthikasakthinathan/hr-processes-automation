import Link from "next/link";

export default function CreateAccountPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#EDE7F6] to-[#DCCBFA] px-4">
      <div className="w-[900px] h-[520px] bg-white rounded-2xl shadow-xl flex overflow-hidden">

        {/* LEFT – IMAGE (50%) */}
        <div className="w-[50%] relative">
          <img
            src="/image.png"
            alt="Signup Art"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>

        {/* RIGHT – FORM (50%) */}
        <div className="w-[50%] px-7 py-7 flex flex-col justify-center">

          <h1 className="text-xl font-semibold text-gray-800">
            Create Account
          </h1>
          <p className="text-[13px] text-gray-500 mt-1 mb-3">
            Sign up to create your account
          </p>

          {/* Full Name */}
          <div className="mb-2.5">
            <label className="text-[11px] text-gray-600">Full Name</label>
            <input
              type="text"
              placeholder="Full Name"
              className="w-full mt-1 px-3 py-[7px] rounded-lg bg-gray-100 text-[13px]
              outline-none focus:ring-1 focus:ring-purple-400"
            />
          </div>

          {/* Email */}
          <div className="mb-2.5">
            <label className="text-[11px] text-gray-600">Email</label>
            <input
              type="email"
              placeholder="Email"
              className="w-full mt-1 px-3 py-[7px] rounded-lg bg-gray-100 text-[13px]
              outline-none focus:ring-1 focus:ring-purple-400"
            />
          </div>

          {/* Password */}
          <div className="mb-2.5">
            <label className="text-[11px] text-gray-600">Create Password</label>
            <div className="relative">
              <input
                type="password"
                placeholder="Create Password"
                className="w-full mt-1 px-3 py-[7px] rounded-lg bg-gray-100 text-[13px]
                outline-none focus:ring-1 focus:ring-purple-400"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs cursor-pointer">
                👁
              </span>
            </div>
          </div>

          {/* Role */}
          <div className="mb-2.5">
            <label className="text-[11px] text-gray-600">Role</label>
            <select
              className="w-full mt-1 px-3 py-[7px] rounded-lg bg-gray-100 text-[13px]
              outline-none focus:ring-1 focus:ring-purple-400"
            >
              <option>Select Role</option>
              <option>Employee</option>
            </select>
          </div>

          {/* Company Code */}
          <div className="mb-3">
            <label className="text-[11px] text-gray-600">
              Company Code / Organization ID
            </label>
            <input
              type="text"
              placeholder="Company Code"
              className="w-full mt-1 px-3 py-[7px] rounded-lg bg-gray-100 text-[13px]
              outline-none focus:ring-1 focus:ring-purple-400"
            />
          </div>

          {/* Sign Up Button */}
          <button
            className="w-full py-2 rounded-lg text-[13px] text-white font-medium
            bg-gradient-to-r from-[#7F3FBF] via-[#9B6BD6] to-[#F2A7D8]
            hover:opacity-90 transition"
          >
            Sign Up
          </button>

          {/* Footer */}
          <p className="text-[11px] text-gray-500 text-center mt-2.5">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-purple-600 hover:underline cursor-pointer"
            >
              Sign in
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}
