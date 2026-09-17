import React, { useState } from "react";
import { FileDown, Printer, Users, Eye, CheckCircle2, Loader2 } from "lucide-react";
import { Exam, Student } from "../types";
import { generateOpticalFormPdf } from "../utils/pdfGenerator";

interface OpticalFormGeneratorProps {
  exam: Exam;
  students: Student[];
  onOpenExamManager: () => void;
}

export const OpticalFormGenerator: React.FC<OpticalFormGeneratorProps> = ({
  exam,
  students,
  onOpenExamManager,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    students[0]?.id || "blank"
  );
  const [printMode, setPrintMode] = useState<"personalized" | "blank">("personalized");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  const activeStudent = students.find((s) => s.id === selectedStudentId) || students[0] || {
    id: "demo",
    studentNumber: "101",
    fullName: "Ahmet Yılmaz",
    gradeClass: exam.gradeClass,
  };

  const handleDownloadPdf = async (mode: "all" | "single" | "blank") => {
    setIsGeneratingPdf(true);
    // Allow UI to render loading state before heavy PDF vector generation
    setTimeout(() => {
      try {
        if (mode === "all") {
          generateOpticalFormPdf(exam, students, "personalized");
        } else if (mode === "single") {
          generateOpticalFormPdf(exam, [activeStudent], "personalized");
        } else {
          generateOpticalFormPdf(exam, [], "blank");
        }
      } catch (err) {
        console.error("PDF generation failed:", err);
        alert("PDF oluşturulurken bir sorun oluştu.");
      } finally {
        setIsGeneratingPdf(false);
      }
    }, 50);
  };

  const handlePrint = () => {
    window.print();
  };

  const options = exam.optionsCount === 4 ? ["A", "B", "C", "D"] : ["A", "B", "C", "D", "E"];
  const questionsPerColumn = 10;
  const numColumns = Math.ceil(exam.questionCount / questionsPerColumn);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Optik Form Hazırla & PDF İndir
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Öğrenci listenize göre isimli, numaralı ve optik kodlu A4 cevap kağıtları oluşturun.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-download-all-pdf"
            onClick={() => handleDownloadPdf("all")}
            disabled={isGeneratingPdf}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-100 transition-all cursor-pointer disabled:opacity-60"
          >
            {isGeneratingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileDown className="w-4 h-4" />
            )}
            <span>
              {isGeneratingPdf
                ? "PDF Hazırlanıyor..."
                : `Tüm Sınıfı PDF İndir (${students.length} Öğrenci)`}
            </span>
          </button>

          <button
            id="btn-download-blank-pdf"
            onClick={() => handleDownloadPdf("blank")}
            disabled={isGeneratingPdf}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs sm:text-sm font-semibold transition-all cursor-pointer disabled:opacity-60"
          >
            <FileDown className="w-4 h-4 text-slate-500" />
            <span>Boş Form İndir</span>
          </button>

          <button
            id="btn-print-form"
            onClick={handlePrint}
            disabled={isGeneratingPdf}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-semibold transition-all cursor-pointer disabled:opacity-60"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Yazdır</span>
          </button>
        </div>
      </div>

      {/* 2-Column Layout: Controls & Live Sheet Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Controls & Student Selection */}
        <div className="lg:col-span-4 space-y-4">
          {/* Mode Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Baskı Modu
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPrintMode("personalized")}
                className={`p-3 rounded-lg border text-left transition-all ${
                  printMode === "personalized"
                    ? "border-indigo-600 bg-indigo-50/50 text-indigo-950 font-bold"
                    : "border-slate-200 hover:bg-slate-50 text-slate-700 font-medium"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs">İsimli / Özel</span>
                  {printMode === "personalized" && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                </div>
                <p className="text-[11px] text-slate-500 font-normal">
                  Her öğrenciye adı ve nosu basılı form
                </p>
              </button>

              <button
                onClick={() => setPrintMode("blank")}
                className={`p-3 rounded-lg border text-left transition-all ${
                  printMode === "blank"
                    ? "border-indigo-600 bg-indigo-50/50 text-indigo-950 font-bold"
                    : "border-slate-200 hover:bg-slate-50 text-slate-700 font-medium"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs">Boş / Anonim</span>
                  {printMode === "blank" && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                </div>
                <p className="text-[11px] text-slate-500 font-normal">
                  Öğrencinin kendisinin dolduracağı boş form
                </p>
              </button>
            </div>
          </div>

          {/* Student Roster Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Sınıf Öğrenci Listesi ({students.length})
                </h3>
              </div>
              <button
                onClick={onOpenExamManager}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
              >
                Öğrenci Yönetimi
              </button>
            </div>

            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {students.map((std) => {
                const isSelected = selectedStudentId === std.id;
                return (
                  <button
                    key={std.id}
                    onClick={() => {
                      setSelectedStudentId(std.id);
                      setPrintMode("personalized");
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors text-left ${
                      isSelected
                        ? "bg-indigo-600 text-white font-semibold"
                        : "hover:bg-slate-100 text-slate-700 font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-6 text-center font-mono ${isSelected ? "text-indigo-200" : "text-slate-400"}`}>
                        {std.studentNumber}
                      </span>
                      <span className="truncate">{std.fullName}</span>
                    </div>
                    <span className={`text-[11px] ${isSelected ? "text-indigo-100" : "text-slate-400"}`}>
                      {std.gradeClass}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <button
                id="btn-download-selected-single"
                onClick={() => handleDownloadPdf("single")}
                disabled={isGeneratingPdf}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isGeneratingPdf ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileDown className="w-3.5 h-3.5" />
                )}
                <span>Seçili Öğrenciyi İndir ({activeStudent.fullName})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: High-Fidelity Printable Optical Sheet Preview */}
        <div className="lg:col-span-8">
          <div className="bg-slate-100 rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-inner">
            <div className="flex items-center justify-between mb-3 text-xs font-semibold text-slate-500">
              <div className="flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-indigo-600" />
                <span>A4 Baskı Önizlemesi (1:1 Optik Format)</span>
              </div>
              <span>210mm x 297mm Standart OMR</span>
            </div>

            {/* Simulated Paper Sheet with print ID */}
            <div
              id="printable-optical-sheet"
              className="bg-white text-slate-900 p-6 sm:p-8 rounded-lg shadow-lg border border-slate-300 relative select-none font-sans print:shadow-none print:border-none"
            >
              {/* 4 Black Fiducial Corner Alignment Squares */}
              <div className="absolute top-3 left-3 w-5 h-5 bg-slate-950" />
              <div className="absolute top-3 right-3 w-5 h-5 bg-slate-950" />
              <div className="absolute bottom-3 left-3 w-5 h-5 bg-slate-950" />
              <div className="absolute bottom-3 right-3 w-5 h-5 bg-slate-950" />

              {/* Sheet Header */}
              <div className="border border-slate-300 bg-slate-50/70 p-3 rounded text-center mb-4">
                <h1 className="text-base sm:text-lg font-black tracking-wide text-slate-900">
                  ARİFLER EXAM - OPTİK CEVAP FORMU
                </h1>
                <div className="flex flex-wrap justify-center gap-x-4 text-[11px] text-slate-600 mt-1 font-medium">
                  <span><strong>Sınav:</strong> {exam.title}</span>
                  <span><strong>Ders:</strong> {exam.subject}</span>
                  <span><strong>Sınıf:</strong> {exam.gradeClass}</span>
                  <span><strong>Tarih:</strong> {exam.date}</span>
                </div>
              </div>

              {/* Student Info & Number Matrix Row */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-4">
                {/* Student Info Box */}
                <div className="sm:col-span-7 border border-slate-300 p-3 rounded bg-white text-xs">
                  <div className="font-bold text-slate-900 border-b border-slate-200 pb-1 mb-2">
                    ÖĞRENCİ BİLGİLERİ
                  </div>
                  <div className="space-y-2 text-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-500">Adı Soyadı:</span>
                      <span className="font-bold font-mono">
                        {printMode === "personalized" ? activeStudent.fullName : "......................................."}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-500">Sınıfı / Şube:</span>
                      <span className="font-bold font-mono">
                        {printMode === "personalized" ? activeStudent.gradeClass : exam.gradeClass}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-500">Öğrenci No:</span>
                      <span className="font-bold font-mono text-indigo-700">
                        {printMode === "personalized" ? activeStudent.studentNumber : "..................."}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Student Number Optical Bubble Matrix */}
                <div className="sm:col-span-5 border border-slate-300 p-2.5 rounded bg-white text-center">
                  <div className="text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Öğrenci No Kodlama
                  </div>
                  <div className="flex justify-center gap-2">
                    {[0, 1, 2, 3].map((colIdx) => {
                      const digits = (activeStudent.studentNumber || "").padStart(4, "0");
                      const activeDigit = printMode === "personalized" ? digits[colIdx] : "";
                      return (
                        <div key={colIdx} className="flex flex-col items-center">
                          <div className="w-5 h-5 border border-slate-400 font-bold text-xs flex items-center justify-center mb-1 bg-slate-50">
                            {activeDigit}
                          </div>
                          <div className="flex flex-col gap-0.5">
                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => {
                              const isMarked = printMode === "personalized" && activeDigit === digit.toString();
                              return (
                                <div
                                  key={digit}
                                  className={`w-3.5 h-3.5 rounded-full border text-[8px] flex items-center justify-center font-mono ${
                                    isMarked
                                      ? "bg-slate-900 border-slate-900 text-white font-bold"
                                      : "border-slate-400 text-slate-600 bg-white"
                                  }`}
                                >
                                  {isMarked ? "•" : digit}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Instructions Bar */}
              <div className="text-[10px] text-slate-500 text-center border-y border-slate-200 py-1 mb-4">
                Doğru Kodlama: <span className="font-bold text-slate-900">(●)</span> &nbsp;|&nbsp;
                Hatalı Kodlamalar: <span>(X) (/) ( ) (◐)</span> &nbsp;|&nbsp;
                Kurşun kalem ile daireyi taşırmadan doldurunuz.
              </div>

              {/* Questions Bubble Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {Array.from({ length: numColumns }).map((_, colIndex) => {
                  const startQ = colIndex * questionsPerColumn + 1;
                  const endQ = Math.min((colIndex + 1) * questionsPerColumn, exam.questionCount);
                  const questionsInCol = [];
                  for (let q = startQ; q <= endQ; q++) questionsInCol.push(q);

                  return (
                    <div key={colIndex} className="border border-slate-200 rounded p-2 bg-slate-50/30">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-1 mb-1.5 text-[10px] font-bold text-slate-700">
                        <span>Soru</span>
                        <div className="flex items-center gap-1.5">
                          {options.map((opt) => (
                            <span key={opt} className="w-4 text-center font-bold">{opt}</span>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1">
                        {questionsInCol.map((qNum) => (
                          <div
                            key={qNum}
                            className={`flex items-center justify-between text-xs py-0.5 px-1 rounded ${
                              qNum % 2 === 0 ? "bg-slate-100/60" : ""
                            }`}
                          >
                            <span className="font-bold text-slate-800 text-[11px] w-6">{qNum}.</span>
                            <div className="flex items-center gap-1.5">
                              {options.map((opt) => (
                                <div
                                  key={opt}
                                  className="w-4 h-4 rounded-full border border-slate-400 text-[9px] flex items-center justify-center font-mono text-slate-700 bg-white"
                                >
                                  {opt}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="mt-5 pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
                <span>Form ID: {exam.id}-{activeStudent.studentNumber || "GEN"}</span>
                <span>Arifler Exam OMR Optik Okuma Sistemi</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
