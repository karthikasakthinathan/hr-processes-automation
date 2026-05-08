"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import {
  FiGrid, FiUsers, FiUserPlus, FiCalendar,
  FiDollarSign, FiHelpCircle, FiLogOut, FiSearch,
  FiBriefcase, FiX, FiUpload, FiFile,
  FiTrash2, FiCheckCircle, FiAlertCircle,
  FiZap,
} from "react-icons/fi";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Job {
  id: number;
  title: string;
  location: string;
  description: string;
  required_skills: string[];
  status?: string;
}

interface Candidate {
  rank?: number;
  name: string;
  email: string;
  score?: number;
  match_score?: number;
  matched_skills?: string[];
  missing_skills?: string[];
  status: string;
  experience_years?: number;
}

interface ScreenResult {
  job: Job;
  summary: {
    total_candidates: number;
    shortlisted: number;
    rejected: number;
    average_score: number;
    top_candidate: string | null;
  };
  ranked_candidates: Candidate[];
}

interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: string;
  status: "pending" | "parsing" | "ready" | "error";
  parsedData?: {
    name: string;
    email: string;
    skills: string[];
    experience_years: number;
  };
  errorMsg?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const API = "http://127.0.0.1:8000";

function token() {
  return typeof window !== "undefined" ? localStorage.getItem("token") : null;
}

function authHeaders(json = false) {
  const h: Record<string, string> = { Authorization: `Bearer ${token()}` };
  if (json) h["Content-Type"] = "application/json";
  return h;
}

function statusStyle(status: string) {
  if (status === "Highly Shortlisted") return "bg-purple-100 text-purple-700";
  if (status === "Shortlisted") return "bg-green-100 text-green-600";
  return "bg-red-100 text-red-500";
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── PDF Parser via Backend ───────────────────────────────────────────────────

async function parseResumeViaBackend(file: File): Promise<{ name: string; email: string; skills: string[]; experience_years: number } | null> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API}/recruitment/parse-resume`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token()}` },
      body: formData,
    });

    const data = await res.json();
    if (data.success) return data.data;
    return null;
  } catch {
    return null;
  }
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RecruitmentPage() {
  const [tab, setTab] = useState<"jobs" | "screen" | "candidates">("jobs");

  // Job form
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [requiredSkills, setRequiredSkills] = useState("");
  const [jobLoading, setJobLoading] = useState(false);

  // Jobs list
  const [jobs, setJobs] = useState<Job[]>([]);

  // Screen - PDF upload
  const [selectedJobId, setSelectedJobId] = useState<number | "">("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [screenResult, setScreenResult] = useState<ScreenResult | null>(null);
  const [screenLoading, setScreenLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Candidates tab
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => { loadJobs(); loadCandidates(); }, []);

  // ── API calls ─────────────────────────────────────────────────────────────

  const loadJobs = async () => {
    try {
      const res = await fetch(`${API}/recruitment/jobs`, { headers: authHeaders() });
      const data = await res.json();
      setJobs(data.data || []);
    } catch (e) { console.error(e); }
  };

  const loadCandidates = async (jobId?: number, status?: string) => {
    try {
      const params = new URLSearchParams();
      if (jobId) params.set("job_id", String(jobId));
      if (status) params.set("status", status);
      const res = await fetch(`${API}/recruitment/candidates?${params}`, { headers: authHeaders() });
      const data = await res.json();
      setCandidates(data.data || []);
    } catch (e) { console.error(e); }
  };

  const createJob = async () => {
    if (!title || !location) return alert("Title and location are required.");
    setJobLoading(true);
    try {
      const res = await fetch(`${API}/recruitment/create-job`, {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify({ title, location, description, required_skills: requiredSkills }),
      });
      if (res.ok) {
        alert("Job created ✅");
        setTitle(""); setLocation(""); setDescription(""); setRequiredSkills("");
        loadJobs();
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to create job");
      }
    } catch (e) { console.error(e); }
    finally { setJobLoading(false); }
  };

  // ── PDF Handling ──────────────────────────────────────────────────────────

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const pdfFiles = Array.from(files).filter(f => f.type === "application/pdf");
    if (pdfFiles.length === 0) return alert("Only PDF files are accepted.");

    const newEntries: UploadedFile[] = pdfFiles.map(f => ({
      id: `${Date.now()}-${Math.random()}`,
      file: f,
      name: f.name,
      size: formatBytes(f.size),
      status: "parsing",
    }));

    setUploadedFiles(prev => [...prev, ...newEntries]);

    // Parse each PDF via backend
    for (const entry of newEntries) {
      const parsed = await parseResumeViaBackend(entry.file);
      setUploadedFiles(prev => prev.map(f =>
        f.id === entry.id
          ? parsed
            ? { ...f, status: "ready", parsedData: parsed }
            : { ...f, status: "error", errorMsg: "Could not parse resume" }
          : f
      ));
    }
  }, []);

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  const screenCandidates = async () => {
    if (!selectedJobId) return alert("Select a job first.");
    const readyFiles = uploadedFiles.filter(f => f.status === "ready" && f.parsedData);
    if (readyFiles.length === 0) return alert("No parsed resumes ready. Please upload PDF resumes first.");

    setScreenLoading(true);
    setScreenResult(null);
    try {
      const candidateList = readyFiles.map(f => ({
        name: f.parsedData!.name || f.name.replace(".pdf", ""),
        email: f.parsedData!.email || `${f.name.replace(".pdf", "").toLowerCase().replace(/\s/g, ".")}@resume.com`,
        skills: f.parsedData!.skills,
        experience_years: f.parsedData!.experience_years || 0,
      }));

      const res = await fetch(`${API}/recruitment/screen-candidates`, {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify({ job_id: selectedJobId, candidates: candidateList }),
      });
      const data = await res.json();
      if (data.error) return alert(data.error);
      setScreenResult(data);
      loadCandidates();
    } catch (e) { console.error(e); }
    finally { setScreenLoading(false); }
  };

  const filteredCandidates = candidates.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus ? c.status === filterStatus : true;
    return matchSearch && matchStatus;
  });

  const readyCount = uploadedFiles.filter(f => f.status === "ready").length;
  const parsingCount = uploadedFiles.filter(f => f.status === "parsing").length;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#f8f6fc] flex items-center justify-center p-6">
      <div className="w-[1200px] min-h-[650px] bg-white rounded-2xl shadow-lg flex overflow-hidden">

        {/* SIDEBAR */}
        <aside className="w-[220px] bg-gradient-to-b from-[#7F3FBF] via-[#8E5BE8] to-[#6C63FF] text-white flex flex-col rounded-l-2xl flex-shrink-0">
          <div className="px-6 py-6 text-base font-semibold tracking-wide">Dashboard</div>
          <nav className="flex-1 px-3 space-y-1 text-[13px]">
            <MenuItem icon={<FiGrid size={15} />} label="Dashboard" href="/dashboard" />
            <MenuItem icon={<FiUsers size={15} />} label="Recruitment" href="/dashboard/recruitment" active />
            <MenuItem icon={<FiUserPlus size={15} />} label="Onboarding" href="/dashboard/onboarding" />
            <MenuItem icon={<FiCalendar size={15} />} label="Attendance & Leave" href="/dashboard/attendance" />
            <MenuItem icon={<FiDollarSign size={15} />} label="Payroll" href="/dashboard/payroll" />
            <MenuItem icon={<FiHelpCircle size={15} />} label="HR Tickets" href="/dashboard/hr-tickets" />
            <MenuItem icon={<FiLogOut size={15} />} label="Exit Management" href="/dashboard/exit-management" />
          </nav>
          <div className="px-5 py-4 bg-white/10 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/30 flex items-center justify-center text-xs font-semibold">RD</div>
            <div className="text-xs">
              <p className="font-medium">Rahul Devy</p>
              <p className="opacity-70">HR Manager</p>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <main className="flex-1 overflow-y-auto bg-[#f4f0fc]">
          <div className="p-6">

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h1 className="text-lg font-semibold text-gray-800">Recruitment</h1>
                <p className="text-xs text-gray-400 mt-0.5">Smart screening & candidate ranking</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center text-xs font-semibold text-purple-700">RD</div>
                <span className="text-sm text-gray-600">Rahul Devy</span>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-white border border-[#e6e0f8] rounded-lg p-1 mb-5 w-fit">
              {(["jobs", "screen", "candidates"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-1.5 rounded-md text-xs font-medium transition capitalize ${
                    tab === t
                      ? "bg-gradient-to-r from-[#7F3FBF] to-[#6C63FF] text-white shadow"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {t === "jobs" ? "Post a Job" : t === "screen" ? "Screen Candidates" : "Candidates"}
                </button>
              ))}
            </div>

            {/* ── TAB: POST A JOB ── */}
            {tab === "jobs" && (
              <div className="space-y-5">
                <div className="bg-white border border-[#e6e1f5] rounded-xl p-6">
                  <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <FiBriefcase size={14} className="text-purple-500" /> Create Job Posting
                  </h2>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <input placeholder="Job Title *" value={title} onChange={e => setTitle(e.target.value)}
                      className="border border-[#ddd6f7] rounded-lg px-3 py-2 text-sm focus:border-[#7F3FBF] focus:ring-2 focus:ring-[#7F3FBF]/20 outline-none" />
                    <input placeholder="Location *" value={location} onChange={e => setLocation(e.target.value)}
                      className="border border-[#ddd6f7] rounded-lg px-3 py-2 text-sm focus:border-[#7F3FBF] focus:ring-2 focus:ring-[#7F3FBF]/20 outline-none" />
                  </div>
                  <input
                    placeholder="Required Skills (comma-separated, e.g. python, sql, react) *"
                    value={requiredSkills}
                    onChange={e => setRequiredSkills(e.target.value)}
                    className="w-full border border-[#ddd6f7] rounded-lg px-3 py-2 text-sm mb-3 focus:border-[#7F3FBF] focus:ring-2 focus:ring-[#7F3FBF]/20 outline-none"
                  />
                  <textarea placeholder="Job Description" value={description} onChange={e => setDescription(e.target.value)}
                    className="w-full border border-[#ddd6f7] rounded-lg px-3 py-2 text-sm h-24 mb-4 focus:border-[#7F3FBF] focus:ring-2 focus:ring-[#7F3FBF]/20 outline-none resize-none" />
                  <div className="flex justify-end">
                    <button onClick={createJob} disabled={jobLoading}
                      className="bg-gradient-to-r from-[#7F3FBF] to-[#6C63FF] text-white px-6 py-2 rounded-lg text-sm shadow hover:opacity-90 disabled:opacity-50">
                      {jobLoading ? "Creating..." : "Post Job"}
                    </button>
                  </div>
                </div>

                <div className="bg-white border border-[#e6e1f5] rounded-xl p-5">
                  <h2 className="text-sm font-semibold text-gray-700 mb-3">Active Job Postings ({jobs.length})</h2>
                  {jobs.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-6">No jobs posted yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {jobs.map(job => (
                        <div key={job.id} className="flex items-start justify-between bg-[#faf8ff] border border-[#ede8fb] rounded-lg px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-gray-800">{job.title}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{job.location}</p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {(job.required_skills || []).map(s => (
                                <span key={s} className="bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded-full">{s}</span>
                              ))}
                            </div>
                          </div>
                          <span className="text-[10px] bg-green-100 text-green-600 px-2 py-1 rounded-full font-medium">
                            {job.status || "Open"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── TAB: SCREEN CANDIDATES ── */}
            {tab === "screen" && (
              <div className="space-y-5">
                <div className="bg-white border border-[#e6e1f5] rounded-xl p-6">
                  <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <FiZap size={14} className="text-purple-500" /> AI Resume Screening
                  </h2>

                  {/* Job selector */}
                  <select
                    value={selectedJobId}
                    onChange={e => setSelectedJobId(Number(e.target.value))}
                    className="w-full border border-[#ddd6f7] rounded-lg px-3 py-2 text-sm mb-5 focus:border-[#7F3FBF] outline-none bg-white"
                  >
                    <option value="">-- Select a Job to Screen For --</option>
                    {jobs.map(j => (
                      <option key={j.id} value={j.id}>{j.title} — {j.location}</option>
                    ))}
                  </select>

                  {/* Drop Zone */}
                  <div
                    onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                      isDragOver
                        ? "border-[#7F3FBF] bg-purple-50 scale-[1.01]"
                        : "border-[#d5cdf5] hover:border-[#7F3FBF] hover:bg-purple-50/50"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf"
                      multiple
                      className="hidden"
                      onChange={e => e.target.files && addFiles(e.target.files)}
                    />
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#7F3FBF]/10 to-[#6C63FF]/10 flex items-center justify-center">
                        <FiUpload size={24} className="text-[#7F3FBF]" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-700">
                          {isDragOver ? "Drop PDF resumes here" : "Upload Resume PDFs"}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Drag & drop multiple PDFs or click to browse · Only PDF files accepted
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-purple-600 bg-purple-50 border border-purple-100 px-3 py-1.5 rounded-full">
                        <FiZap size={10} />
                        AI will automatically extract skills & experience from resumes
                      </div>
                    </div>
                  </div>

                  {/* File List */}
                  {uploadedFiles.length > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-gray-500">{uploadedFiles.length} file{uploadedFiles.length > 1 ? "s" : ""}</span>
                          {parsingCount > 0 && (
                            <span className="flex items-center gap-1 text-amber-500">
                              <span className="animate-spin inline-block">⟳</span> {parsingCount} parsing...
                            </span>
                          )}
                          {readyCount > 0 && (
                            <span className="flex items-center gap-1 text-green-600">
                              <FiCheckCircle size={10} /> {readyCount} ready
                            </span>
                          )}
                        </div>
                        <button onClick={() => setUploadedFiles([])} className="text-[10px] text-red-400 hover:text-red-600 transition">
                          Clear all
                        </button>
                      </div>

                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {uploadedFiles.map(f => (
                          <div key={f.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition ${
                            f.status === "ready" ? "bg-green-50/50 border-green-100" :
                            f.status === "error" ? "bg-red-50/50 border-red-100" :
                            "bg-[#faf8ff] border-[#ede8fb]"
                          }`}>
                            {/* File icon */}
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              f.status === "ready" ? "bg-green-100" :
                              f.status === "error" ? "bg-red-100" :
                              "bg-purple-100"
                            }`}>
                              <FiFile size={14} className={
                                f.status === "ready" ? "text-green-600" :
                                f.status === "error" ? "text-red-400" :
                                "text-purple-500"
                              } />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-700 truncate">{f.name}</p>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <span className="text-[10px] text-gray-400">{f.size}</span>
                                {f.status === "parsing" && (
                                  <span className="text-[10px] text-amber-500 animate-pulse">
                                    ⟳ Extracting with AI...
                                  </span>
                                )}
                                {f.status === "ready" && f.parsedData && (
                                  <span className="text-[10px] text-green-600">
                                    ✓ {f.parsedData.name} · {f.parsedData.skills.length} skills · {f.parsedData.experience_years}y exp
                                  </span>
                                )}
                                {f.status === "error" && (
                                  <span className="text-[10px] text-red-400 flex items-center gap-1">
                                    <FiAlertCircle size={9} /> {f.errorMsg}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Status + Delete */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {f.status === "ready" && <FiCheckCircle size={14} className="text-green-500" />}
                              {f.status === "error" && <FiAlertCircle size={14} className="text-red-400" />}
                              <button
                                onClick={() => removeFile(f.id)}
                                className="text-gray-300 hover:text-red-400 transition p-1 rounded"
                              >
                                <FiTrash2 size={13} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action bar */}
                  <div className="flex items-center justify-between mt-5 pt-4 border-t border-[#f0ebfc]">
                    <p className="text-xs text-gray-400">
                      {uploadedFiles.length === 0
                        ? "Upload PDF resumes to get started"
                        : parsingCount > 0
                        ? `Processing ${parsingCount} resume${parsingCount > 1 ? "s" : ""} with AI...`
                        : `${readyCount} resume${readyCount !== 1 ? "s" : ""} ready for screening`
                      }
                    </p>
                    <button
                      onClick={screenCandidates}
                      disabled={screenLoading || readyCount === 0 || !selectedJobId}
                      className="flex items-center gap-2 bg-gradient-to-r from-[#7F3FBF] to-[#6C63FF] text-white px-6 py-2 rounded-lg text-sm shadow hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      <FiZap size={13} />
                      {screenLoading ? "Screening..." : "Run Smart Screening"}
                    </button>
                  </div>
                </div>

                {/* Result */}
                {screenResult && (
                  <div className="bg-white border border-[#e6e1f5] rounded-xl p-6">
                    <h2 className="text-sm font-semibold text-gray-700 mb-3">
                      Screening Result — <span className="text-purple-600">{screenResult.job.title}</span>
                    </h2>
                    <div className="grid grid-cols-4 gap-3 mb-5">
                      {[
                        { label: "Total", value: screenResult.summary.total_candidates, color: "text-gray-700" },
                        { label: "Shortlisted", value: screenResult.summary.shortlisted, color: "text-green-600" },
                        { label: "Rejected", value: screenResult.summary.rejected, color: "text-red-500" },
                        { label: "Avg Score", value: `${screenResult.summary.average_score}%`, color: "text-purple-600" },
                      ].map(card => (
                        <div key={card.label} className="bg-[#faf8ff] border border-[#ede8fb] rounded-lg p-3 text-center">
                          <p className="text-[10px] text-gray-400 mb-1">{card.label}</p>
                          <p className={`text-xl font-semibold ${card.color}`}>{card.value}</p>
                        </div>
                      ))}
                    </div>

                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-[#F2ECFB] text-gray-500">
                          <th className="text-left py-2 px-3 rounded-l-lg">Rank</th>
                          <th className="text-left py-2 px-3">Name</th>
                          <th className="text-left py-2 px-3">Score</th>
                          <th className="text-left py-2 px-3">Matched Skills</th>
                          <th className="text-left py-2 px-3">Missing Skills</th>
                          <th className="text-left py-2 px-3 rounded-r-lg">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {screenResult.ranked_candidates.map((c, i) => (
                          <tr key={i} className="border-b border-[#f0ebfc] hover:bg-[#faf8ff] transition">
                            <td className="py-2 px-3 font-bold text-purple-400">#{c.rank}</td>
                            <td className="py-2 px-3 font-medium text-gray-700">{c.name}</td>
                            <td className="py-2 px-3">
                              <div className="flex items-center gap-2">
                                <div className="w-20 bg-gray-100 rounded-full h-1.5">
                                  <div className="bg-gradient-to-r from-[#7F3FBF] to-[#6C63FF] h-1.5 rounded-full"
                                    style={{ width: `${c.score}%` }} />
                                </div>
                                <span className="font-semibold text-purple-700">{c.score}%</span>
                              </div>
                            </td>
                            <td className="py-2 px-3">
                              <div className="flex flex-wrap gap-1">
                                {(c.matched_skills || []).map(s => (
                                  <span key={s} className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-[10px]">{s}</span>
                                ))}
                              </div>
                            </td>
                            <td className="py-2 px-3">
                              <div className="flex flex-wrap gap-1">
                                {(c.missing_skills || []).map(s => (
                                  <span key={s} className="bg-red-50 text-red-400 px-1.5 py-0.5 rounded text-[10px]">{s}</span>
                                ))}
                              </div>
                            </td>
                            <td className="py-2 px-3">
                              <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${statusStyle(c.status)}`}>
                                {c.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB: ALL CANDIDATES ── */}
            {tab === "candidates" && (
              <div className="bg-white border border-[#e6e1f5] rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-gray-700">All Screened Candidates</h2>
                  <div className="flex items-center gap-2">
                    <select
                      value={filterStatus}
                      onChange={e => { setFilterStatus(e.target.value); loadCandidates(undefined, e.target.value || undefined); }}
                      className="border border-[#ddd6f7] rounded-lg px-3 py-1.5 text-xs focus:border-[#7F3FBF] outline-none bg-white"
                    >
                      <option value="">All Status</option>
                      <option value="Highly Shortlisted">Highly Shortlisted</option>
                      <option value="Shortlisted">Shortlisted</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                    <div className="flex items-center gap-1 border border-[#ddd6f7] rounded-lg px-3 py-1.5">
                      <FiSearch size={12} className="text-gray-400" />
                      <input
                        placeholder="Search name or email"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="text-xs outline-none w-36"
                      />
                    </div>
                  </div>
                </div>

                {filteredCandidates.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">No candidates found.</p>
                ) : (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-[#F2ECFB] text-gray-500">
                        <th className="text-left py-2 px-3 rounded-l-lg">Rank</th>
                        <th className="text-left py-2 px-3">Name</th>
                        <th className="text-left py-2 px-3">Email</th>
                        <th className="text-left py-2 px-3">Score</th>
                        <th className="text-left py-2 px-3">Matched</th>
                        <th className="text-left py-2 px-3">Missing</th>
                        <th className="text-left py-2 px-3 rounded-r-lg">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCandidates.map((c, i) => (
                        <tr key={i} className="border-b border-[#f0ebfc] hover:bg-[#faf8ff] transition">
                          <td className="py-2 px-3 font-bold text-purple-300">#{c.rank ?? "—"}</td>
                          <td className="py-2 px-3 font-medium text-gray-700">{c.name}</td>
                          <td className="py-2 px-3 text-gray-400">{c.email}</td>
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-100 rounded-full h-1.5">
                                <div className="bg-gradient-to-r from-[#7F3FBF] to-[#6C63FF] h-1.5 rounded-full"
                                  style={{ width: `${c.match_score ?? 0}%` }} />
                              </div>
                              <span className="font-semibold text-purple-700">{c.match_score ?? 0}%</span>
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <div className="flex flex-wrap gap-1">
                              {(c.matched_skills || []).map(s => (
                                <span key={s} className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-[10px]">{s}</span>
                              ))}
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <div className="flex flex-wrap gap-1">
                              {(c.missing_skills || []).map(s => (
                                <span key={s} className="bg-red-50 text-red-400 px-1.5 py-0.5 rounded text-[10px]">{s}</span>
                              ))}
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${statusStyle(c.status)}`}>
                              {c.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}

// ─── Sidebar MenuItem ─────────────────────────────────────────────────────────

function MenuItem({ icon, label, href, active = false }: {
  icon: React.ReactNode; label: string; href: string; active?: boolean;
}) {
  return (
    <Link href={href}>
      <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition text-[13px] ${
        active ? "bg-white/20 backdrop-blur-md" : "hover:bg-white/10"
      }`}>
        {icon}
        <span>{label}</span>
      </div>
    </Link>
  );
}
