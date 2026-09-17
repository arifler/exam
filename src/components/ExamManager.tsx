import React, { useState } from "react";
import {
  Plus,
  Trash2,
  Save,
  Key,
  Users,
  Check,
  Upload,
  BookOpen
} from "lucide-react";
import { Exam, Student } from "../types";

interface ExamManagerProps {
  exams: Exam[];
  selectedExam: Exam;
  students: Student[];
  onSaveExam: (exam: Exam) => void;
  onDeleteExam: (id: string) => void;
  onSaveStudents: (students: Student[]) => void;
  onDeleteStudent: (id: string) => void;
}

export const ExamManager: React.FC<ExamManagerProps> = ({
  exams,
  selectedExam,
  students,
  onSaveExam,
  onDeleteExam,
  onSaveStudents,
  onDeleteStudent,
}) => {
  const [activeTab, setActiveTab] = useState<"key" | "settings" | "students">("key");

  // Exam form state
  const [examForm, setExamForm] = useState<Exam>({ ...selectedExam });

  // Quick key text import
  const [keyInputText, setKeyInputText] = useState("");
  const [bulkStudentText, setBulkStudentText] = useState("");

  // New Student input
  const [newStudentNumber, setNewStudentNumber] = useState("");
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentClass, setNewStudentClass] = useState(examForm.gradeClass || "8-A");

  // Sync if selectedExam changes externally
  React.useEffect(() => {
    setExamForm({ ...selectedExam });
  }, [selectedExam]);

  // Set single question answer
  const handleSetOption = (qNum: number, opt: string) => {
    const updatedKey = { ...examForm.answerKey, [qNum]: opt };
    setExamForm({ ...examForm, answerKey: updatedKey });
  };

  // Quick Parse Answer Key string like "ACBDA..." or "1A 2C 3B..."
  const handleQuickKeyParse = () => {
    if (!keyInputText.trim()) return;
    const clean = keyInputText.toUpperCase().replace(/[^A-E0-9]/g, " ");
    const parts = clean.trim().split(/\s+/);

    const newKey: Record<number, string> = { ...examForm.answerKey };

    // Check if it's pairs like ["1A", "2B"] or raw letters ["A", "C", "B"]
    if (parts.length > 0 && /^[0-9]+[A-E]$/.test(parts[0])) {
      parts.forEach((p) => {
        const match = p.match(/^([0-9]+)([A-E])$/);
        if (match) {
          const qNum = parseInt(match[1], 10);
          const opt = match[2];
          if (qNum <= examForm.questionCount) {
            newKey[qNum] = opt;
          }
        }
      });
    } else {
      // Raw string of letters e.g. "ACBD..."
      const letters = keyInputText.toUpperCase().replace(/[^A-E]/g, "").split("");
      letters.forEach((letter, idx) => {
        const qNum = idx + 1;
        if (qNum <= examForm.questionCount) {
          newKey[qNum] = letter;
        }
      });
    }

    setExamForm({ ...examForm, answerKey: newKey });
    setKeyInputText("");
  };

  // Save Exam changes
  const handleSaveExamSubmit = () => {
    onSaveExam(examForm);
    alert("Sınav ve cevap anahtarı başarıyla kaydedildi.");
  };

  // Add Single Student
  const handleAddStudent = () => {
    if (!newStudentNumber || !newStudentName) {
      alert("Lütfen öğrenci numarası ve adını giriniz.");
      return;
    }
    const newStd: Student = {
      id: `std-${Date.now()}`,
      studentNumber: newStudentNumber.trim(),
      fullName: newStudentName.trim(),
      gradeClass: newStudentClass.trim() || examForm.gradeClass,
    };
    onSaveStudents([...students, newStd]);
    setNewStudentNumber("");
    setNewStudentName("");
  };

  // Bulk Student Import
  const handleBulkStudentImport = () => {
    if (!bulkStudentText.trim()) return;
    const lines = bulkStudentText.trim().split("\n");
    const newStudentsList: Student[] = [];

    lines.forEach((line) => {
      const parts = line.split(/[,;\t]/).map((p) => p.trim());
      if (parts.length >= 2) {
        const sNum = parts[0];
        const sName = parts[1];
        const sClass = parts[2] || examForm.gradeClass;
        newStudentsList.push({
          id: `std-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          studentNumber: sNum,
          fullName: sName,
          gradeClass: sClass,
        });
      }
    });

    if (newStudentsList.length > 0) {
      onSaveStudents([...students, ...newStudentsList]);
      setBulkStudentText("");
      alert(`${newStudentsList.length} öğrenci başarıyla listeye eklendi.`);
    }
  };

  const options = examForm.optionsCount === 4 ? ["A", "B", "C", "D"] : ["A", "B", "C", "D", "E"];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-12 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Sınav & Cevap Anahtarı Yönetimi
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Doğru cevapları belirleyin, puanlama kurallarını ayarlayın ve öğrenci listesini yönetin.
          </p>
        </div>

        <button
          id="btn-save-all-exam"
          onClick={handleSaveExamSubmit}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-100 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>Değişiklikleri Kaydet</span>
        </button>
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-slate-200 gap-4 text-xs sm:text-sm font-bold">
        <button
          onClick={() => setActiveTab("key")}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === "key"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Cevap Anahtarı</span>
        </button>

        <button
          onClick={() => setActiveTab("settings")}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === "settings"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Sınav Parametreleri</span>
        </button>

        <button
          onClick={() => setActiveTab("students")}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === "students"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Öğrenci Listesi ({students.length})</span>
        </button>
      </div>

      {/* TAB 1: CEVAP ANAHTARI */}
      {activeTab === "key" && (
        <div className="space-y-6">
          {/* Quick Paste Box */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Hızlı Cevap Anahtarı Yapıştır / Aktar
            </h3>
            <p className="text-[11px] text-slate-500 mb-3">
              Cevapları tek satırda harf olarak (Örn: <strong>ACBDAEBC...</strong>) veya soru numarasıyla (Örn: <strong>1A 2C 3B...</strong>) yapıştırabilirsiniz.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={keyInputText}
                onChange={(e) => setKeyInputText(e.target.value)}
                placeholder="Örnek: ACBDAECDBA..."
                className="w-full text-xs font-mono uppercase bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                id="btn-apply-key"
                onClick={handleQuickKeyParse}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold shrink-0 cursor-pointer"
              >
                Uygula
              </button>
            </div>
          </div>

          {/* Clickable Bubble Grid */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">
                Cevap Matrisi ({examForm.questionCount} Soru)
              </h3>
              <span className="text-xs text-slate-500">
                Seçmek istediğiniz şıkkın üzerine tıklayın
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {Array.from({ length: examForm.questionCount }).map((_, i) => {
                const qNum = i + 1;
                const currentOpt = examForm.answerKey[qNum] || "";

                return (
                  <div
                    key={qNum}
                    className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center justify-between"
                  >
                    <span className="font-bold text-slate-800 text-xs w-7">{qNum}.</span>

                    <div className="flex items-center gap-1.5">
                      {options.map((opt) => {
                        const isSelected = currentOpt === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => handleSetOption(qNum, opt)}
                            className={`w-7 h-7 rounded-full text-xs font-bold font-mono transition-all flex items-center justify-center cursor-pointer ${
                              isSelected
                                ? "bg-indigo-600 text-white shadow-xs scale-105"
                                : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SINAV AYARLARI */}
      {activeTab === "settings" && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4 max-w-2xl">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Sınav Başlığı</label>
            <input
              type="text"
              value={examForm.title}
              onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Ders Adı</label>
              <input
                type="text"
                value={examForm.subject}
                onChange={(e) => setExamForm({ ...examForm, subject: e.target.value })}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Sınıf / Şube</label>
              <input
                type="text"
                value={examForm.gradeClass}
                onChange={(e) => setExamForm({ ...examForm, gradeClass: e.target.value })}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Soru Sayısı</label>
              <select
                value={examForm.questionCount}
                onChange={(e) => setExamForm({ ...examForm, questionCount: Number(e.target.value) })}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 cursor-pointer"
              >
                <option value={10}>10 Soru</option>
                <option value={20}>20 Soru</option>
                <option value={30}>30 Soru</option>
                <option value={40}>40 Soru</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Şık Sayısı</label>
              <select
                value={examForm.optionsCount}
                onChange={(e) => setExamForm({ ...examForm, optionsCount: Number(e.target.value) as 4 | 5 })}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 cursor-pointer"
              >
                <option value={4}>4 Şık (A, B, C, D) - LGS / Ortaokul</option>
                <option value={5}>5 Şık (A, B, C, D, E) - YKS / Lise</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Soru Başı Puan</label>
              <input
                type="number"
                value={examForm.pointsPerQuestion}
                onChange={(e) => setExamForm({ ...examForm, pointsPerQuestion: Number(e.target.value) })}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Yanlış Götürme Kuralı</label>
              <select
                value={examForm.penaltyRatio}
                onChange={(e) => setExamForm({ ...examForm, penaltyRatio: Number(e.target.value) })}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 cursor-pointer"
              >
                <option value={0}>Yok (Yanlışlar doğruyu götürmez)</option>
                <option value={3}>3 Yanlış 1 Doğruyu Götürür (LGS / Ortaokul)</option>
                <option value={4}>4 Yanlış 1 Doğruyu Götürür (YKS / Lise)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ÖĞRENCİ LİSTESİ */}
      {activeTab === "students" && (
        <div className="space-y-6">
          {/* Add Student Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
              Yeni Öğrenci Ekle
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="Öğrenci No (Örn: 111)"
                value={newStudentNumber}
                onChange={(e) => setNewStudentNumber(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 font-mono"
              />
              <input
                type="text"
                placeholder="Adı Soyadı"
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 sm:col-span-2"
              />
              <button
                onClick={handleAddStudent}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Öğrenciyi Ekle</span>
              </button>
            </div>
          </div>

          {/* Bulk Import */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Toplu Öğrenci Listesi Yapıştır
            </h3>
            <p className="text-[11px] text-slate-500 mb-3">
              Her satıra bir öğrenci gelecek şekilde (Örnek: <strong>101, Ahmet Kaya, 8-A</strong>) yapıştırınız.
            </p>
            <textarea
              rows={3}
              value={bulkStudentText}
              onChange={(e) => setBulkStudentText(e.target.value)}
              placeholder="101, Yusuf Demir, 8-A&#10;102, Zeynep Kaya, 8-A"
              className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2"
            />
            <button
              onClick={handleBulkStudentImport}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              Toplu Listeyi İçe Aktar
            </button>
          </div>

          {/* Current Student Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 font-bold text-xs text-slate-800">
              Kayıtlı Sınıf Listesi ({students.length} Öğrenci)
            </div>
            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {students.map((std) => (
                <div
                  key={std.id}
                  className="px-4 py-2.5 flex items-center justify-between text-xs hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-12 font-mono font-bold text-indigo-600">
                      {std.studentNumber}
                    </span>
                    <span className="font-semibold text-slate-900">{std.fullName}</span>
                    <span className="text-slate-400 text-[11px]">({std.gradeClass})</span>
                  </div>
                  <button
                    onClick={() => onDeleteStudent(std.id)}
                    title="Öğrenciyi Sil"
                    className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
