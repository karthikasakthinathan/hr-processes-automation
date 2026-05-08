"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  FiUsers,
  FiUserPlus,
  FiClock,
  FiDollarSign,
  FiHelpCircle,
  FiLogOut,
} from "react-icons/fi";

const modules = [
  { name: "Recruitment", icon: <FiUsers className="w-8 h-8" />, href: "/dashboard/recruitment" },
  { name: "Onboarding", icon: <FiUserPlus className="w-8 h-8" />, href: "/dashboard/onboarding" },
  { name: "Attendance & Leave", icon: <FiClock className="w-8 h-8" />, href: "/dashboard/attendance" },
  { name: "Payroll", icon: <FiDollarSign className="w-8 h-8" />, href: "/dashboard/payroll" },
  { name: "HR Tickets", icon: <FiHelpCircle className="w-8 h-8" />, href: "/dashboard/hr-tickets" },
  { name: "Exit Management", icon: <FiLogOut className="w-8 h-8" />, href: "/dashboard/exit-management" },
];

export default function DashboardPage() {
  const [displayedText, setDisplayedText] = useState("");
  const fullText = "Welcome to HR Process Automation";

  useEffect(() => {
    let index = 0;
    let current = "";

    const timer = setInterval(() => {
      if (index < fullText.length) {
        current += fullText[index];
        setDisplayedText(current);
        index++;
      } else {
        clearInterval(timer);
      }
    }, 50);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-6
      bg-gradient-to-br from-[#fdfbff] via-[#f3ecff] to-[#fceefc]">

      {/* 💜 MAIN GRADIENT CARD */}
      <div className="w-full max-w-5xl rounded-3xl 
        bg-gradient-to-br from-[#7F3FBF] via-[#A764D9] to-[#F472B6]
        shadow-[0_20px_60px_rgba(167,100,217,0.4)]
        p-10 md:p-14 flex flex-col items-center">

        {/* HEADER */}
        <div className="h-24 mb-10 flex items-center justify-center text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white">
            {displayedText}
            <span className="animate-pulse ml-1">|</span>
          </h1>
        </div>

        {/* ❄️ GLASS MODULE CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
          {modules.map((mod) => (
            <Link key={mod.name} href={mod.href}>
              <div className="group flex flex-col items-center justify-center 
                p-8 h-52 rounded-2xl 
                bg-white/20 backdrop-blur-lg 
                border border-white/30 
                shadow-lg
                hover:bg-white/30
                hover:-translate-y-2 hover:scale-105
                transition-all duration-300 cursor-pointer">

                {/* ICON */}
                <div className="w-16 h-16 rounded-full 
                  bg-white/30 text-white
                  flex items-center justify-center mb-5 
                  group-hover:scale-110 transition">
                  {mod.icon}
                </div>

                {/* TITLE */}
                <h2 className="text-xl font-semibold text-white text-center">
                  {mod.name}
                </h2>

              </div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}