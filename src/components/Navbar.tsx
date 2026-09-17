import React from "react";
import { Camera, FileDown, Settings2, BarChart3, CheckCircle2 } from "lucide-react";
import { Exam } from "../types";

interface NavbarProps {
  activeTab: "scanner" | "generator" | "exams" | "analytics";
  setActiveTab: (tab: "scanner" | "generator" | "exams" | "analytics") => void;
  exams: Exam[];
  selectedExamId: string;
  setSelectedExamId: (id: string) => void;
}

interface NavItem {
  id: "scanner" | "generator" | "analytics" | "exams";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  exams,
  selectedExamId,
  setSelectedExamId,
}) => {
  const currentExam = exams.find((e) => e.id === selectedExamId) || exams[0];

  const navItems: NavItem[] = [
    { id: "scanner", label: "Kamera ile Oku", icon: Camera, badge: "Canlı" },
    { id: "generator", label: "Optik Form & PDF", icon: FileDown },
    { id: "analytics", label: "Analiz & Rapor", icon: BarChart3 },
    { id: "exams", label: "Sınav & Cevaplar", icon: Settings2 },
  ];

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <span className="font-extrabold text-lg tracking-wider">A</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-lg sm:text-xl tracking-tight">
                  Arifler <span className="text-indigo-600">Exam</span>
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Optik OMR v2.4
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Mobil Uyumlu Optik Okuma & Sınav Değerlendirme
              </p>
            </div>
          </div>

          {/* Center: Active Exam Selector */}
          <div className="flex items-center gap-2 max-w-xs sm:max-w-md w-full justify-end sm:justify-center">
            <div className="w-full relative">
              <select
                id="exam-selector"
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="w-full text-xs sm:text-sm font-medium bg-slate-100 hover:bg-slate-200/70 text-slate-800 rounded-lg px-3 py-2 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all truncate pr-8 cursor-pointer"
              >
                {exams.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.title} ({exam.gradeClass} - {exam.questionCount} Soru)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Desktop Nav Tabs */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-btn-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700 font-semibold shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-indigo-600" : "text-slate-500"}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.2 text-[10px] uppercase font-bold tracking-wider rounded-full bg-indigo-600 text-white animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-2 py-1.5 shadow-lg flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`mobile-nav-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[11px] font-medium transition-colors ${
                isActive ? "text-indigo-600 font-bold" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 mb-0.5 ${isActive ? "text-indigo-600 scale-110 transition-transform" : ""}`} />
                {item.badge && (
                  <span className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-indigo-600" />
                )}
              </div>
              <span className="truncate max-w-[70px]">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
