import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { CameraScanner } from "./components/CameraScanner";
import { OpticalFormGenerator } from "./components/OpticalFormGenerator";
import { AnalyticsDashboard } from "./components/AnalyticsDashboard";
import { ExamManager } from "./components/ExamManager";
import { Exam, Student, ExamResult } from "./types";

export default function App() {
  const [activeTab, setActiveTab] = useState<"scanner" | "generator" | "analytics" | "exams">("scanner");
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [students, setStudents] = useState<Student[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch initial data from server REST API
  useEffect(() => {
    async function loadData() {
      try {
        const [examsRes, studentsRes, resultsRes] = await Promise.all([
          fetch("/api/exams"),
          fetch("/api/students"),
          fetch("/api/results")
        ]);

        if (examsRes.ok) {
          const exData = await examsRes.json();
          setExams(exData);
          if (exData.length > 0) {
            setSelectedExamId(exData[0].id);
          }
        }

        if (studentsRes.ok) {
          const stdData = await studentsRes.json();
          setStudents(stdData);
        }

        if (resultsRes.ok) {
          const resData = await resultsRes.json();
          setResults(resData);
        }
      } catch (err) {
        console.warn("Could not load from backend, using default fallback:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const currentExam = exams.find((e) => e.id === selectedExamId) || exams[0] || {
    id: "exam-1",
    title: "8. Sınıf Matematik Deneme Sınavı",
    subject: "Matematik",
    gradeClass: "8-A",
    date: new Date().toISOString().split("T")[0],
    questionCount: 20,
    optionsCount: 4,
    answerKey: { 1: "A", 2: "C", 3: "B", 4: "D", 5: "A", 6: "C", 7: "D", 8: "B", 9: "A", 10: "C", 11: "D", 12: "B", 13: "A", 14: "C", 15: "B", 16: "D", 17: "A", 18: "C", 19: "D", 20: "B" },
    pointsPerQuestion: 5,
    penaltyRatio: 3,
    createdAt: new Date().toISOString()
  };

  // Result Saved Handler
  const handleResultSaved = (newResult: ExamResult) => {
    setResults((prev) => {
      const idx = prev.findIndex((r) => r.id === newResult.id || (r.examId === newResult.examId && r.studentNumber === newResult.studentNumber));
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = newResult;
        return updated;
      }
      return [newResult, ...prev];
    });
  };

  // Exam Save Handler
  const handleSaveExam = async (updatedExam: Exam) => {
    try {
      const res = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedExam)
      });
      const data = await res.json();
      if (data.exams) {
        setExams(data.exams);
      }
    } catch {
      setExams((prev) => {
        const idx = prev.findIndex((e) => e.id === updatedExam.id);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = updatedExam;
          return copy;
        }
        return [updatedExam, ...prev];
      });
    }
  };

  // Delete Exam
  const handleDeleteExam = async (id: string) => {
    try {
      await fetch(`/api/exams/${id}`, { method: "DELETE" });
      setExams((prev) => prev.filter((e) => e.id !== id));
      setResults((prev) => prev.filter((r) => r.examId !== id));
    } catch {
      setExams((prev) => prev.filter((e) => e.id !== id));
    }
  };

  // Students Save Handler
  const handleSaveStudents = async (newStudents: Student[]) => {
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStudents)
      });
      const data = await res.json();
      if (data.students) {
        setStudents(data.students);
      }
    } catch {
      setStudents(newStudents);
    }
  };

  // Delete Student
  const handleDeleteStudent = async (id: string) => {
    try {
      await fetch(`/api/students/${id}`, { method: "DELETE" });
      setStudents((prev) => prev.filter((s) => s.id !== id));
    } catch {
      setStudents((prev) => prev.filter((s) => s.id !== id));
    }
  };

  // Delete Result
  const handleDeleteResult = async (id: string) => {
    try {
      await fetch(`/api/results/${id}`, { method: "DELETE" });
      setResults((prev) => prev.filter((r) => r.id !== id));
    } catch {
      setResults((prev) => prev.filter((r) => r.id !== id));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin mb-4" />
        <h1 className="text-base font-bold text-slate-800">Arifler Exam Yükleniyor...</h1>
        <p className="text-xs text-slate-500 mt-1">Optik okuma ve sınav veritabanı hazırlanıyor</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        exams={exams}
        selectedExamId={selectedExamId}
        setSelectedExamId={setSelectedExamId}
      />

      {/* Main Content Areas */}
      <main className="flex-1">
        {activeTab === "scanner" && (
          <CameraScanner
            exam={currentExam}
            students={students}
            onResultSaved={handleResultSaved}
          />
        )}

        {activeTab === "generator" && (
          <OpticalFormGenerator
            exam={currentExam}
            students={students}
            onOpenExamManager={() => setActiveTab("exams")}
          />
        )}

        {activeTab === "analytics" && (
          <AnalyticsDashboard
            exam={currentExam}
            results={results}
            onDeleteResult={handleDeleteResult}
          />
        )}

        {activeTab === "exams" && (
          <ExamManager
            exams={exams}
            selectedExam={currentExam}
            students={students}
            onSaveExam={handleSaveExam}
            onDeleteExam={handleDeleteExam}
            onSaveStudents={handleSaveStudents}
            onDeleteStudent={handleDeleteStudent}
          />
        )}
      </main>
    </div>
  );
}
