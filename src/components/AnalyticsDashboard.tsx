import React, { useState, useMemo } from "react";
import {
  Users,
  Award,
  TrendingUp,
  Download,
  Search,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Eye,
  Trash2,
  HelpCircle,
  AlertTriangle
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { Exam, ExamResult, QuestionAnalysis } from "../types";

interface AnalyticsDashboardProps {
  exam: Exam;
  results: ExamResult[];
  onDeleteResult: (id: string) => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  exam,
  results,
  onDeleteResult,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudentResult, setSelectedStudentResult] = useState<ExamResult | null>(null);

  // Filter results for current exam
  const examResults = useMemo(() => {
    return results.filter((r) => r.examId === exam.id);
  }, [results, exam.id]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalStudents = examResults.length;
    if (totalStudents === 0) {
      return {
        totalStudents: 0,
        averageScore: 0,
        averageNet: 0,
        highestScore: 0,
        lowestScore: 0,
        passRate: 0,
        topStudent: null as ExamResult | null,
      };
    }

    const scores = examResults.map((r) => r.totalScore);
    const nets = examResults.map((r) => r.netScore);

    const sumScore = scores.reduce((a, b) => a + b, 0);
    const sumNet = nets.reduce((a, b) => a + b, 0);

    const averageScore = parseFloat((sumScore / totalStudents).toFixed(1));
    const averageNet = parseFloat((sumNet / totalStudents).toFixed(2));
    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);

    const passingStudents = examResults.filter((r) => r.totalScore >= 50).length;
    const passRate = Math.round((passingStudents / totalStudents) * 100);

    const sortedByScore = [...examResults].sort((a, b) => b.totalScore - a.totalScore);
    const topStudent = sortedByScore[0];

    return {
      totalStudents,
      averageScore,
      averageNet,
      highestScore,
      lowestScore,
      passRate,
      topStudent,
    };
  }, [examResults]);

  // Score Distribution Data for BarChart (Histogram: 0-20, 21-40, 41-60, 61-80, 81-100)
  const scoreDistribution = useMemo(() => {
    const ranges = [
      { range: "0-20", count: 0 },
      { range: "21-40", count: 0 },
      { range: "41-60", count: 0 },
      { range: "61-80", count: 0 },
      { range: "81-100", count: 0 },
    ];

    examResults.forEach((r) => {
      const s = r.totalScore;
      if (s <= 20) ranges[0].count++;
      else if (s <= 40) ranges[1].count++;
      else if (s <= 60) ranges[2].count++;
      else if (s <= 80) ranges[3].count++;
      else ranges[4].count++;
    });

    return ranges;
  }, [examResults]);

  // Question-by-Question Item Analysis (Madde Analizi)
  const questionAnalysisList: QuestionAnalysis[] = useMemo(() => {
    const totalCount = examResults.length;
    const list: QuestionAnalysis[] = [];

    for (let q = 1; q <= exam.questionCount; q++) {
      const correctAns = exam.answerKey[q] || "A";
      let correct = 0;
      let wrong = 0;
      let empty = 0;
      const optDist: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };

      examResults.forEach((r) => {
        const studentAns = (r.answers?.[q] || "").toUpperCase();
        if (!studentAns) {
          empty++;
        } else if (studentAns === correctAns) {
          correct++;
          if (optDist[studentAns] !== undefined) optDist[studentAns]++;
        } else {
          wrong++;
          if (optDist[studentAns] !== undefined) optDist[studentAns]++;
        }
      });

      const successRate = totalCount > 0 ? Math.round((correct / totalCount) * 100) : 0;
      list.push({
        questionNumber: q,
        correctAnswer: correctAns,
        correctCount: correct,
        wrongCount: wrong,
        emptyCount: empty,
        successRate,
        optionDistribution: optDist,
      });
    }

    return list;
  }, [examResults, exam]);

  // Overall Answer Breakdown (Correct vs Wrong vs Empty Pie)
  const overallBreakdown = useMemo(() => {
    let totalCorrect = 0;
    let totalWrong = 0;
    let totalEmpty = 0;

    examResults.forEach((r) => {
      totalCorrect += r.correctCount;
      totalWrong += r.wrongCount;
      totalEmpty += r.emptyCount;
    });

    return [
      { name: "Doğru", value: totalCorrect, color: "#10b981" },
      { name: "Yanlış", value: totalWrong, color: "#f43f5e" },
      { name: "Boş", value: totalEmpty, color: "#94a3b8" },
    ];
  }, [examResults]);

  // Filtered student rows
  const filteredStudents = useMemo(() => {
    const list = [...examResults].sort((a, b) => b.totalScore - a.totalScore);
    if (!searchTerm.trim()) return list;
    const term = searchTerm.toLowerCase();
    return list.filter(
      (r) =>
        r.studentName.toLowerCase().includes(term) ||
        r.studentNumber.toLowerCase().includes(term)
    );
  }, [examResults, searchTerm]);

  // Export results to CSV
  const exportToCsv = () => {
    if (examResults.length === 0) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Sira,Ogrenci No,Ad Soyad,Sinif,Dogru,Yanlis,Bos,Net,Puan\n";

    filteredStudents.forEach((r, idx) => {
      csvContent += `${idx + 1},"${r.studentNumber}","${r.studentName}","${r.studentClass || exam.gradeClass}",${r.correctCount},${r.wrongCount},${r.emptyCount},${r.netScore},${r.totalScore}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${exam.title}_Sonuc_Listesi.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-12 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Öğretmen Analiz & Raporlama Paneli
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            <strong>{exam.title}</strong> sınavına ait madde analizleri, başarı grafikleri ve karne dökümleri.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-export-csv"
            onClick={exportToCsv}
            disabled={examResults.length === 0}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Excel / CSV İndir</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Students */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Katılan Öğrenci</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{metrics.totalStudents}</div>
          <span className="text-[11px] text-slate-500">Kişi optik formu okundu</span>
        </div>

        {/* Average Score */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Sınıf Ortalaması</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-indigo-700 mt-2">{metrics.averageScore}</div>
          <span className="text-[11px] text-slate-500">100 üzerinden ortalama</span>
        </div>

        {/* Average Net */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Net Ortalaması</span>
            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{metrics.averageNet}</div>
          <span className="text-[11px] text-slate-500">{exam.questionCount} soru üzerinden</span>
        </div>

        {/* Top Score */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">En Yüksek Puan</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">{metrics.highestScore}</div>
          <span className="text-[11px] text-slate-500 truncate block">
            {metrics.topStudent ? metrics.topStudent.studentName : "-"}
          </span>
        </div>

        {/* Pass Rate */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Başarı Oranı</span>
            <span className="text-xs font-bold text-emerald-600">≥50 Puan</span>
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">%{metrics.passRate}</div>
          <span className="text-[11px] text-slate-500">Geçer not alanlar</span>
        </div>
      </div>

      {/* Visual Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Score Distribution Chart */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Puan Dağılım Grafiği</h3>
              <p className="text-xs text-slate-500">Puan aralıklarına göre öğrenci yoğunluğu</p>
            </div>
            <span className="text-xs font-mono font-semibold px-2 py-1 rounded bg-slate-100 text-slate-600">
              Histogram
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="range" tick={{ fontSize: 12, fill: "#64748b" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <Tooltip
                  formatter={(value: any) => [`${value} Öğrenci`, "Kişi Sayısı"]}
                  contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", color: "#fff", fontSize: "12px" }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Correct/Wrong/Blank Donut Chart */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Cevap Dağılım Oranı</h3>
              <p className="text-xs text-slate-500">Sınıf genelinde işaretleme durumu</p>
            </div>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={overallBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {overallBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [`${value} Soru`, "Adet"]}
                  contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", color: "#fff", fontSize: "12px" }}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Question Item Analysis (Madde Analizi Grafiği) */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Soru Bazlı Başarı & Madde Analizi (% Doğruluk)
            </h3>
            <p className="text-xs text-slate-500">
              Hangi soruların sınıfça anlaşıldığını veya zorlanıldığını tespit edin.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Kolay (≥%70)
            </span>
            <span className="flex items-center gap-1 text-indigo-600 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Orta (%40-%69)
            </span>
            <span className="flex items-center gap-1 text-rose-600 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Zor (&lt;%40)
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={questionAnalysisList}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="questionNumber" tick={{ fontSize: 11, fill: "#64748b" }} tickFormatter={(val) => `S.${val}`} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#64748b" }} tickFormatter={(val) => `%${val}`} />
              <Tooltip
                formatter={(val: any, name: any, item: any) => [
                  `%${val} (Doğru: ${item.payload.correctCount} / ${item.payload.correctCount + item.payload.wrongCount + item.payload.emptyCount} Öğrenci)`,
                  `Cevap Anahtarı: ${item.payload.correctAnswer}`,
                ]}
                contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", color: "#fff", fontSize: "12px" }}
              />
              <Bar dataKey="successRate" radius={[4, 4, 0, 0]}>
                {questionAnalysisList.map((entry, index) => {
                  const color =
                    entry.successRate >= 70
                      ? "#10b981"
                      : entry.successRate >= 40
                      ? "#6366f1"
                      : "#f43f5e";
                  return <Cell key={`cell-${index}`} fill={color} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Difficult Questions Alert */}
        {questionAnalysisList.some((q) => q.successRate < 40 && examResults.length > 0) && (
          <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Dikkat Çeken Sorular:</strong>{" "}
              {questionAnalysisList
                .filter((q) => q.successRate < 40)
                .map((q) => `Soru ${q.questionNumber} (%${q.successRate})`)
                .join(", ")}{" "}
              numaralı sorularda sınıf başarısı %40'ın altındadır. Bu kazanımların derste tekrar edilmesi önerilir.
            </span>
          </div>
        )}
      </div>

      {/* Student Leaderboard / Exam Results Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Öğrenci Sınav Sonuçları ve Başarı Sıralaması
            </h3>
            <p className="text-xs text-slate-500">
              Taranan tüm optik form kayıtları ve soru detayları
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Öğrenci adı veya no ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {filteredStudents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Sıra</th>
                  <th className="px-4 py-3">Öğrenci No</th>
                  <th className="px-4 py-3">Adı Soyadı</th>
                  <th className="px-4 py-3 text-center">Doğru</th>
                  <th className="px-4 py-3 text-center">Yanlış</th>
                  <th className="px-4 py-3 text-center">Boş</th>
                  <th className="px-4 py-3 text-center">Net</th>
                  <th className="px-4 py-3 text-right">Puan</th>
                  <th className="px-4 py-3 text-center">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((res, index) => {
                  const isTop3 = index < 3;
                  return (
                    <tr
                      key={res.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="px-4 py-3 font-bold text-slate-700">
                        {isTop3 ? (
                          <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black text-white ${
                            index === 0 ? "bg-amber-500" : index === 1 ? "bg-slate-400" : "bg-amber-700"
                          }`}>
                            {index + 1}
                          </span>
                        ) : (
                          <span>{index + 1}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-600">
                        {res.studentNumber}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {res.studentName}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-emerald-600">
                        {res.correctCount}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-rose-600">
                        {res.wrongCount}
                      </td>
                      <td className="px-4 py-3 text-center font-medium text-slate-400">
                        {res.emptyCount}
                      </td>
                      <td className="px-4 py-3 text-center font-black text-indigo-700">
                        {res.netScore}
                      </td>
                      <td className="px-4 py-3 text-right font-black text-slate-900 text-sm">
                        {res.totalScore}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedStudentResult(res)}
                            title="Öğrenci Kağıdını İncele"
                            className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`${res.studentName} sonucunu silmek istediğinize emin misiniz?`)) {
                                onDeleteResult(res.id);
                              }
                            }}
                            title="Sonucu Sil"
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 text-xs">
            Henüz taranmış optik form sonucu bulunmuyor. Kamera ile form tarayarak anında sonuç ekleyebilirsiniz.
          </div>
        )}
      </div>

      {/* Student Result Detail Modal */}
      {selectedStudentResult && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {selectedStudentResult.studentName} - Optik Sınav Kağıdı
                </h3>
                <p className="text-xs text-slate-500">
                  No: {selectedStudentResult.studentNumber} • Puan: {selectedStudentResult.totalScore} • Net: {selectedStudentResult.netScore}
                </p>
              </div>
              <button
                onClick={() => setSelectedStudentResult(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              {Array.from({ length: exam.questionCount }).map((_, i) => {
                const qNum = i + 1;
                const studentAns = (selectedStudentResult.answers?.[qNum] || "").toUpperCase();
                const correctAns = (exam.answerKey[qNum] || "").toUpperCase();
                const isEmpty = !studentAns;
                const isCorrect = !isEmpty && studentAns === correctAns;

                return (
                  <div
                    key={qNum}
                    className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                      isCorrect
                        ? "bg-emerald-50 border-emerald-200 text-emerald-900 font-bold"
                        : isEmpty
                        ? "bg-slate-50 border-slate-200 text-slate-500"
                        : "bg-rose-50 border-rose-200 text-rose-900 font-bold"
                    }`}
                  >
                    <span>S.{qNum}:</span>
                    <span className="font-mono">
                      {isCorrect ? (
                        <span>{studentAns} ✓</span>
                      ) : isEmpty ? (
                        <span>- ({correctAns})</span>
                      ) : (
                        <span>{studentAns} ✗ ({correctAns})</span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200">
              <button
                onClick={() => setSelectedStudentResult(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
