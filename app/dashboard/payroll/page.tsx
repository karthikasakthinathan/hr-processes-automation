"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  FiGrid,
  FiUsers,
  FiUserPlus,
  FiCalendar,
  FiDollarSign,
  FiHelpCircle,
  FiLogOut,
  FiDownload,
} from "react-icons/fi";
import { TbMoodAngry } from "react-icons/tb";

/* ===== SIDEBAR ITEM ===== */
function MenuItem({
  icon,
  label,
  href,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
}) {
  return (
    <Link href={href}>
      <div
        className={`flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer transition
        ${active ? "bg-white/20 text-white" : "text-white/80 hover:bg-white/10"}`}
      >
        {icon}
        <span>{label}</span>
      </div>
    </Link>
  );
}

export default function PayrollPage() {
   // --- STATES ---
  const [payroll, setPayroll] = useState< any[]>([]);
  const [month, setMonth] = useState("");
  const [recentStatus, setRecentStatus] = useState< any[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  

  // --- FETCH DATA ON LOAD ---
  useEffect(() => {
    loadPayrollData();
    loadRecentStatus();
  }, []);

  const loadPayrollData = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8000/payroll/records", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.data) {
        setPayroll(result.data);
      }
    } catch (error) {
      console.error("API Error:", error);
    }
  };

  const loadRecentStatus = async () => {
  try {
    const token = localStorage.getItem("token"); // Token yedukkurom
    
    // URL-a backend-la ezhudhuna "/payroll/recent-payslips" ku maathunga
    const res = await fetch("http://localhost:8000/payroll/recent-payslips", {
  headers: { 
    Authorization: `Bearer ${token}` 
  },
});

    const result = await res.json();
    console.log("RECENT RESPONSE =", result);

    if (result.data) {
      setRecentStatus(result.data);
    }
  } catch (err) {
    console.error("Error fetching status:", err);
  }
};


  // --- DOWNLOAD PDF LOGIC ---
const handleDownload = async () => {
    if (!month) {
      alert("Please enter a month (e.g., April 2024)");
      return;
    }
    
    setIsDownloading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:8000/payroll/download-all-payslips?month=${month}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("File not found");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `All_Payslips_${month}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Error: Record not found in database for this month.");
    } finally {
      setIsDownloading(false);
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EDE7F6] to-[#DCCBFA] flex items-center justify-center p-6">

      {/* ===== GLASS CONTAINER ===== */}
      <div className="w-[1250px] h-[700px] bg-white/30 backdrop-blur-xl rounded-3xl shadow-2xl flex overflow-hidden">

        {/* ===== SIDEBAR ===== */}
        <aside className="w-[260px] bg-gradient-to-b from-[#7F3FBF] to-[#6F63D9] text-white flex flex-col">
          <div className="px-6 py-6 text-lg font-semibold">Dashboard</div>

          <nav className="flex-1 px-4 space-y-2 text-sm">
            <MenuItem icon={<FiGrid />} label="Dashboard" href="/dashboard" />
            <MenuItem icon={<FiUsers />} label="Recruitment" href="/dashboard/recruitment" />
            <MenuItem icon={<FiUserPlus />} label="Onboarding" href="/dashboard/onboarding" />
            <MenuItem
              icon={<FiCalendar />}
              label="Attendance & Leave"
              href="/dashboard/attendance"
            />
            <MenuItem
              icon={<FiDollarSign />}
              label="Payroll"
              href="/dashboard/payroll"
              active
            />
            <MenuItem icon={<FiHelpCircle />} label="HR Tickets" href="/dashboard/hr-tickets" />
            <MenuItem
              icon={<FiLogOut />}
              label="Exit Management"
              href="/dashboard/exit-management"
            />
          </nav>

          {/* ===== USER CARD ===== */}
          <div className="m-4 p-3 rounded-xl bg-white/10 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/30" />
            <div className="text-xs">
              <p className="font-medium">Rahul Dewy</p>
              <p className="opacity-70">HR Manager</p>
            </div>
          </div>
        </aside>

        {/* ===== RIGHT SIDE ===== */}
        <main className="flex-1 p-8 bg-gradient-to-br from-[#EEE6FB] to-[#EADAF7] overflow-y-auto">

          {/* HEADER */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-xl font-semibold text-gray-700">Payroll</h1>

            <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-2 shadow-sm">
              <img src="/avatar.png" className="w-9 h-9 rounded-full" />
              <div>
                <p className="text-sm font-medium">Rahul Dewy</p>
                <p className="text-xs text-gray-400">HR Manager</p>
              </div>
            </div>
          </div>

          {/* ===== SALARY SUMMARY ===== */}

<section className="bg-white/80 rounded-2xl shadow-md p-6 mb-6">
  <div className="flex justify-between items-center mb-4">
    <div>
    <h2 className="text-sm font-semibold text-gray-600">
      Salary Summary
    </h2>
    <p className="text-xs text-gray-400 font-medium">View and download your monthly payslips</p>
    </div>
    

    
          <button 
              onClick={ handleDownload}
              disabled={isDownloading}
              className="px-8 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#7F3FBF] to-[#6F63D9] shadow-lg hover:shadow-purple-200 transition-all active:scale-95 disabled:opacity-50"
             >
              
              {isDownloading ? "Generating..." : "Download Payslip "}
            </button>
          
    </div>
    

  <div className="flex items-center gap-3 mb-2 px-6">
    <input
      value={month}
      onChange={(e) => setMonth(e.target.value)}
      placeholder="Type Month Name (e.g., April 2024)"
      className="w-full max-w-3xl px-2 py-2 rounded-lg bg-gray-100 text-sm outline-none"
    />
    <FiDownload />
  </div>



  <div className="rounded-xl overflow-hidden">
    {/* TABLE HEAD */}
    <div className="grid grid-cols-5 bg-[#F2ECFB] text-sm text-gray-600 px-4 py-2">
      <div>Month/Year</div>
      <div>Gross Pay</div>
      <div>Deductions</div>
      <div>Joining Date</div>
      <div>Net Pay</div>
    </div>

    {/* TABLE BODY */}
    {payroll.length > 0 ? (
      payroll.map((p: any, i: number) => (
        <div
          key={i}
          className="grid grid-cols-5 px-4 py-3 text-sm text-gray-700 bg-white"
        >
          <div>{p.month || "-"}</div>
          <div>₹{(p.basic_salary || 0).toLocaleString()}</div>
          <div>₹{(p.deductions || 0).toLocaleString()}</div>
          <div>{p.joining_date || "-"}</div>
          <div className="font-semibold text-purple-700">
            ₹{(p.net_salary || 0).toLocaleString()}
          </div>
          
        </div>
      ))
    ) : (
      <div className="p-6 text-center text-gray-400 text-sm">
        No salary records found
      </div>
    )}
  </div>
</section>

          {/* ===== RECENT PAYSLIPS ===== */}
          <section className="bg-white/80 rounded-2xl shadow-md p-6">
  <div className="flex justify-between items-center mb-4">
    <h2 className="text-sm font-semibold text-gray-600">
      Recent Payslips
    </h2>
    
    <input
      placeholder="Search"
      className="px-4 py-2 rounded-lg bg-gray-100 text-sm outline-none"
    />
  </div>

  <div className="rounded-xl overflow-hidden">

  {/* HEADER */}
  <div className="grid grid-cols-4 bg-[#F2ECFB] text-sm text-gray-600 px-4 py-2">
    <div>Employee ID</div>
    <div>Month</div>
    <div>Net Salary</div>
    <div>Status</div>
  </div>

  {/* BODY */}
  {recentStatus.length > 0 ? (
    recentStatus.map((row: any, i: number) => (
      <div
        key={i}
        className="grid grid-cols-4 px-4 py-3 text-sm bg-white items-center "
      >
        <div className="font-medium text-gray-800">
          {row.employee_id || "-"}
        </div>

        <div className="text-gray-600">
          {row.month || "-"}
        </div>

        <div className="text-purple-700 font-semibold">
          ₹{row.net_salary ?? 0}
        </div>

        <div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              row.status === "Paid"
                ? "bg-green-100 text-green-600"
                : "bg-red-100 text-red-600"
            }`}
          >
            {row.status || "Pending"}
          </span>
        </div>
      </div>
    ))
  ) : (
    <div className="p-6 text-center text-gray-400 text-sm">
      No recent payslips
    </div>
  )}

</div>
</section>
</main>
 </div>
    </div>
  );
}