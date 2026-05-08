"use client";

import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import {
  FiGrid,
  FiUsers,
  FiUserPlus,
  FiCalendar,
  FiDollarSign,
  FiHelpCircle,
  FiLogOut,
  FiPaperclip,
} from "react-icons/fi";

type Ticket = {
  id: number;
  emp_id: string;
  issue: string;
  category: string;
  status: string;
};

function MenuItem({ icon, label, href, active = false }: any) {
  return (
    <Link href={href}>
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition
        ${active ? "bg-white/25 text-white" : "text-white/80 hover:bg-white/10"}`}
      >
        {icon}
        <span className="text-[13px]">{label}</span>
      </div>
    </Link>
  );
}

export default function HrTicketsPage() {

  const [mounted, setMounted] = useState(false);

  const [empId, setEmpId] = useState("");
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);

  useEffect(() => {
    setMounted(true);

    // ✅ FIX: Auto-fill employee ID from localStorage (set during login)
    const storedId = localStorage.getItem("employee_id");
    if (storedId) setEmpId(storedId);
  }, []);

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        "http://127.0.0.1:8000/tickets/recent",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = await res.json();
      setTickets(data.data || []);
    } catch (err) {
      console.log("Fetch ticket error", err);
    }
  };

  useEffect(() => {
    if (mounted) fetchTickets();
  }, [mounted]);

  const submitTicket = async () => {
    try {
      const token = localStorage.getItem("token");

      const formData = new FormData();
      // ✅ FIX: employee_id is no longer sent from frontend
      // the backend reads it securely from the Firebase token
      formData.append("subject", subject);
      formData.append("category", category);
      formData.append("description", description);

      if (file) {
        formData.append("file", file);
      }

      const res = await fetch(
        "http://127.0.0.1:8000/tickets/create",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );

      if (res.ok) {
        alert("Ticket Uploaded Successfully ✅");

        setSubject("");
        setCategory("");
        setDescription("");
        setFile(null);

        fetchTickets();
      } else {
        alert("Ticket Upload Failed ❌");
      }
    } catch (err) {
      console.log("Submit error", err);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === "Open") return "text-red-500";
    if (status === "Closed") return "text-green-500";
    return "text-gray-500";
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f4f1fb] to-[#e7ddfa] flex items-center justify-center p-6">

      <div className="w-[1250px] h-[700px] bg-white/30 backdrop-blur-xl rounded-3xl shadow-2xl flex overflow-hidden">

        {/* ================= SIDEBAR ================= */}
        <aside className="w-[260px] bg-gradient-to-b from-[#7F3FBF] to-[#6F63D9] text-white flex flex-col">
          <div className="px-6 py-6 text-lg font-semibold">Dashboard</div>

          <nav className="flex-1 px-4 space-y-1">
            <MenuItem icon={<FiGrid />} label="Dashboard" href="/dashboard" />
            <MenuItem icon={<FiUsers />} label="Recruitment" href="/dashboard/recruitment" />
            <MenuItem icon={<FiUserPlus />} label="Onboarding" href="/dashboard/onboarding" />
            <MenuItem icon={<FiCalendar />} label="Attendance & Leave" href="/dashboard/attendance" />
            <MenuItem icon={<FiDollarSign />} label="Payroll" href="/dashboard/payroll" />
            <MenuItem icon={<FiHelpCircle />} label="HR Tickets" href="/dashboard/hr-tickets" active />
            <MenuItem icon={<FiLogOut />} label="Exit Management" href="/dashboard/exit-management" />
          </nav>
        </aside>

        {/* ================= MAIN CONTENT ================= */}
        <main className="flex-1 p-8 bg-gradient-to-br from-[#EEE6FB] to-[#EADAF7] overflow-y-auto">

          <section className="bg-white/80 rounded-2xl shadow-md p-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-600 mb-4">
              Create Ticket Form
            </h2>

            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* ✅ FIX: Employee ID is auto-filled and read-only */}
              <input
                value={empId}
                placeholder="Employee ID"
                readOnly
                className="px-4 py-2 rounded-lg bg-gray-200 text-sm outline-none cursor-not-allowed text-gray-500"
              />
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject"
                className="px-4 py-2 rounded-lg bg-gray-100 text-sm outline-none"
              />
            </div>

            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Category (e.g. Leave Request)"
              className="w-full px-4 py-2 rounded-lg bg-gray-100 text-sm outline-none mb-4"
            />

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
              className="w-full px-4 py-2 rounded-lg bg-gray-100 text-sm outline-none h-28 mb-4"
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-purple-600 cursor-pointer">
                <FiPaperclip /> Attachment
                <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                {file && <p>{file.name}</p>}
              </label>

              <button
                onClick={submitTicket}
                className="px-6 py-2 rounded-lg text-sm text-white bg-gradient-to-r 
                from-[#7F3FBF] to-[#6F63D9] hover:from-[#6e35aa] hover:to-[#5b52c9] 
                hover:scale-105 transition duration-200"
              >
                Submit Ticket
              </button>
            </div>
          </section>

          {/* ================= RECENT TICKETS TABLE ================= */}
          <section className="bg-white/80 rounded-2xl shadow-md p-6">
            <h2 className="text-sm font-semibold text-gray-600 mb-4">
              Recent Tickets
            </h2>

            <div className="rounded-xl overflow-hidden">
              <div className="grid grid-cols-4 bg-[#F2ECFB] text-sm text-gray-600 px-4 py-2">
                <div>Emp ID</div>
                <div>Issue</div>
                <div>Category</div>
                <div>Status</div>
              </div>

              {tickets.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-6">No tickets found</p>
              ) : (
                tickets.map((row, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-4 px-4 py-3 text-sm bg-white items-center border-t border-gray-50"
                  >
                    {/* ✅ FIX: emp_id now displays correctly — matches backend mapping */}
                    <div className="font-medium text-gray-700">{row.emp_id}</div>
                    <div>{row.issue}</div>
                    <div>{row.category}</div>
                    <div className={getStatusColor(row.status)}> 
                       <span
    className={`px-3 py-1 rounded-full text-xs font-medium
      ${row.status === "Open" ? "bg-green-100 text-green-700" : ""}
      ${row.status === "Pending" ? "bg-orange-100 text-orange-700" : ""}
      ${row.status === "In Progress" ? "bg-yellow-100 text-yellow-700" : ""}
      ${row.status === "Closed" ? "bg-red-100 text-red-700" : ""}
    `}
  >{row.status}</span></div>
                  </div>
                ))
              )}
            </div>
          </section>

        </main>
      </div>
    </div>
  );
}
