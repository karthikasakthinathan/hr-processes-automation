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
} from "react-icons/fi";

/* ===== MENU ITEM ===== */
function MenuItem({
icon,
label,
href,
active = false,
}: {
icon: ReactNode;
label: string;
href: string;
active?: boolean;
}) {
return ( <Link href={href}>
<div
className={`flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer transition ${
          active
            ? "bg-white/20 text-white"
            : "text-white/80 hover:bg-white/10"
        }`}
> <span>{icon}</span> <span>{label}</span> </div> </Link>
);
}

export default function OnboardingPage() {
const [empId, setEmpId] = useState("");
const [empName, setEmpName] = useState("");
const [jobTitle, setJobTitle] = useState("");
const [email, setEmail] = useState("");
const [location, setLocation] = useState("");

const [selectedFile, setSelectedFile] = useState<File | null>(null);
const [fileName, setFileName] = useState("No file selected");

const [hiresList, setHiresList] = useState<any[]>([]);

/* LOAD LIST */
const loadOnboarding = async () => {
const token = localStorage.getItem("token");


const res = await fetch(
  "http://localhost:8000/onboarding/get-onboarding-list",
  {
    headers: { Authorization: `Bearer ${token}` },
  }
);

const data = await res.json();
setHiresList(data.data || []);


};

useEffect(() => {
loadOnboarding();
}, []);

/* CREATE EMPLOYEE */
const createEmployee = async () => {
const token = localStorage.getItem("token");


const res = await fetch(
  "http://localhost:8000/onboarding/add-employee",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: empName,
      job_title: jobTitle,
      email: email,
      location: location,
    }),
  }
);

const data = await res.json();
alert(data.message || data.error);
loadOnboarding();


};

/* BULK UPLOAD */
const bulkUpload = async () => {
  if (!selectedFile) {
    alert("Please choose an Excel file first!");
    return;
  }

  const token = localStorage.getItem("token");
  const formData = new FormData();
  formData.append("file", selectedFile);

  try {
    const res = await fetch("http://localhost:8000/onboarding/bulk-upload", {  // ✅ correct endpoint
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await res.json();

    if (res.ok) {
      // ✅ Show full result summary
      alert(
        `✅ Upload Successful!\n\n` +
        `Total Inserted: ${data.total_inserted}\n` +
        `Total Skipped: ${data.total_skipped}\n` +
        `Sheets Processed: ${data.sheets_processed}\n\n` +
        `${data.message}`
      );
    } else {
      alert("❌ Upload Failed: " + (data.detail || data.message || "Unknown error"));
    }

  } catch (error) {
    alert("❌ Network Error: Could not reach the server.");
    console.error(error);
  }

  setSelectedFile(null);
  setFileName("No file selected");
  loadOnboarding();
};

return ( <div className="min-h-screen bg-[#f4f1fb] flex items-center justify-center p-6"> <div className="w-[1200px] h-[650px] rounded-2xl overflow-hidden shadow-2xl bg-white/40 backdrop-blur-xl border border-white/50 flex">


    {/* SIDEBAR */}
    <aside className="w-[250px] bg-gradient-to-b from-[#7F3FBF] to-[#6F63D9] text-white flex flex-col">
      <div className="px-6 py-6 text-lg font-semibold">Dashboard</div>

      <nav className="flex-1 px-4 space-y-2 text-[13px]">
        <MenuItem icon={<FiGrid />} label="Dashboard" href="/dashboard" />
        <MenuItem icon={<FiUsers />} label="Recruitment" href="/dashboard/recruitment" />
        <MenuItem icon={<FiUserPlus />} label="Onboarding" href="/dashboard/onboarding" active />
        <MenuItem icon={<FiCalendar />} label="Attendance & Leave" href="/dashboard/attendance" />
        <MenuItem icon={<FiDollarSign />} label="Payroll" href="/dashboard/payroll" />
        <MenuItem icon={<FiHelpCircle />} label="HR Tickets" href="/dashboard/hr-tickets" />
        <MenuItem icon={<FiLogOut />} label="Exit Management" href="/dashboard/exit-management" />
      </nav>
    </aside>

    {/* MAIN */}
    <main className="flex-1 p-8 overflow-y-auto bg-gradient-to-br from-[#EDE7F6] to-[#DCCBFA]">

      {/* HEADER */}
      <h1 className="text-xl font-semibold text-gray-700 mb-6">
        Onboarding
      </h1>

      {/* MANUAL FORM */}
      <div className="bg-white rounded-2xl shadow p-6 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Employee Id" value={empId} onChange={setEmpId}/>
          <Input label="Employee Name" value={empName} onChange={setEmpName}/>
          <Input label="Job Title" value={jobTitle} onChange={setJobTitle}/>
          <Input label="Email Address" value={email} onChange={setEmail}/>
          

        <div className="col-span-1">
    <Input label="Location" value={location} onChange={setLocation} />
  </div>

  <div className="flex items-end">
    <button
      onClick={createEmployee}
      className="px-6 py-2 bg-[#6f63d9] text-white rounded-lg"
    >
      Submit
    </button>
  </div>

</div>
      </div>

      {/* BULK EXCEL */}
      <div className="bg-white rounded-2xl shadow p-6 mb-6">
        <h2 className="text-sm font-medium text-gray-600 mb-3">
          Bulk Upload Employees
        </h2>

        <div className="flex items-center gap-4">
          <label className="text-sm text-purple-600 font-medium cursor-pointer">
            Choose Excel
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setSelectedFile(f);
                setFileName(f ? f.name : "No file selected");
              }}
            />
          </label>

          <span className="text-sm text-gray-500">{fileName}</span>

          <button
            onClick={bulkUpload}
            className="ml-auto px-6 py-2 bg-[#6f63d9] text-white rounded-lg"
          >
            Bulk Onboarding Submit
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="font-medium mb-4">New Hires List</h2>

        <table className="w-full text-sm">
          <thead className="text-left bg-[#F2ECFB] text-sm text-gray-600 px-4 py-2">
            <tr>
              <th className="py-2 px-3">Emp ID</th>
              <th className="py-2 px-3">Joining Date</th>
              <th className="py-2 px-3">Status</th>
              <th className="py-2 px-3">Training</th>
            </tr>
          </thead>

          <tbody>
            {hiresList.map((h, i) => (
              <tr key={i} >
                <td className="py-2 px-3">{h.id}</td>
                <td className="py-2 px-3">{h.joining_date}</td>
                <td className="py-2 px-3">{h.status}</td>
                <td className="py-2 px-3"> 
                   <span
    className={`px-3 py-1 rounded-full text-xs font-medium
      ${h.training === "Completed" ? "bg-green-100 text-green-700" : ""}
      ${h.training === "In Progress" ? "bg-orange-100 text-orange-700" : ""}
      ${h.training === "Not Started" ? "bg-red-100 text-red-700" : ""}
    `}
  >{h.training}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </main>
  </div>
</div>


);
}

/* INPUT */
function Input({
label,
value,
onChange,
}: {
label: string;
value: string;
onChange: (v: string) => void;
}) {
return ( <div> <label className="text-sm text-gray-600">{label}</label>
<input
value={value}
onChange={(e) => onChange(e.target.value)}
className="w-full mt-1 px-4 py-2 bg-gray-100 rounded-xl"
/> </div>
);
}
