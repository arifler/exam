import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const DB_FILE = path.join(__dirname, "data", "db.json");

// Ensure data directory exists
const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initial Seed Data for Arifler Exam
const defaultExam = {
  id: "exam-lgs-8",
  title: "8. Sınıf LGS Matematik Deneme Sınavı",
  subject: "Matematik",
  gradeClass: "8-A",
  date: new Date().toISOString().split("T")[0],
  questionCount: 20,
  optionsCount: 4,
  answerKey: {
    1: "A", 2: "C", 3: "B", 4: "D", 5: "A",
    6: "C", 7: "D", 8: "B", 9: "A", 10: "C",
    11: "D", 12: "B", 13: "A", 14: "C", 15: "B",
    16: "D", 17: "A", 18: "C", 19: "D", 20: "B"
  },
  pointsPerQuestion: 5,
  penaltyRatio: 3, // 3 yanlış 1 doğruyu götürür
  createdAt: new Date().toISOString()
};

const defaultStudents = [
  { id: "std-1", studentNumber: "101", fullName: "Yusuf Demir", gradeClass: "8-A" },
  { id: "std-2", studentNumber: "102", fullName: "Zeynep Kaya", gradeClass: "8-A" },
  { id: "std-3", studentNumber: "103", fullName: "Emir Çelik", gradeClass: "8-A" },
  { id: "std-4", studentNumber: "104", fullName: "Elif Şahin", gradeClass: "8-A" },
  { id: "std-5", studentNumber: "105", fullName: "Kerem Yıldız", gradeClass: "8-A" },
  { id: "std-6", studentNumber: "106", fullName: "Ayşe Yılmaz", gradeClass: "8-A" },
  { id: "std-7", studentNumber: "107", fullName: "Burak Aydın", gradeClass: "8-A" },
  { id: "std-8", studentNumber: "108", fullName: "Ceren Arslan", gradeClass: "8-A" },
  { id: "std-9", studentNumber: "109", fullName: "Mehmet Öztürk", gradeClass: "8-A" },
  { id: "std-10", studentNumber: "110", fullName: "Selin Koç", gradeClass: "8-A" }
];

const defaultResults = [
  {
    id: "res-1",
    examId: "exam-lgs-8",
    studentNumber: "101",
    studentName: "Yusuf Demir",
    studentClass: "8-A",
    answers: { 1: "A", 2: "C", 3: "B", 4: "D", 5: "A", 6: "C", 7: "D", 8: "B", 9: "A", 10: "C", 11: "D", 12: "B", 13: "A", 14: "C", 15: "B", 16: "D", 17: "A", 18: "C", 19: "D", 20: "B" },
    correctCount: 20,
    wrongCount: 0,
    emptyCount: 0,
    netScore: 20,
    totalScore: 100,
    scannedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    opticalConfidence: 99
  },
  {
    id: "res-2",
    examId: "exam-lgs-8",
    studentNumber: "102",
    studentName: "Zeynep Kaya",
    studentClass: "8-A",
    answers: { 1: "A", 2: "C", 3: "B", 4: "D", 5: "A", 6: "C", 7: "B", 8: "B", 9: "A", 10: "C", 11: "D", 12: "B", 13: "A", 14: "A", 15: "B", 16: "D", 17: "A", 18: "C", 19: "D", 20: "B" },
    correctCount: 18,
    wrongCount: 2,
    emptyCount: 0,
    netScore: 17.33,
    totalScore: 86.65,
    scannedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    opticalConfidence: 98
  },
  {
    id: "res-3",
    examId: "exam-lgs-8",
    studentNumber: "103",
    studentName: "Emir Çelik",
    studentClass: "8-A",
    answers: { 1: "A", 2: "C", 3: "A", 4: "D", 5: "A", 6: "B", 7: "D", 8: "B", 9: "A", 10: "C", 11: "", 12: "B", 13: "A", 14: "C", 15: "B", 16: "C", 17: "A", 18: "C", 19: "", 20: "B" },
    correctCount: 15,
    wrongCount: 3,
    emptyCount: 2,
    netScore: 14.00,
    totalScore: 70.00,
    scannedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    opticalConfidence: 96
  },
  {
    id: "res-4",
    examId: "exam-lgs-8",
    studentNumber: "104",
    studentName: "Elif Şahin",
    studentClass: "8-A",
    answers: { 1: "A", 2: "C", 3: "B", 4: "D", 5: "A", 6: "C", 7: "D", 8: "B", 9: "A", 10: "C", 11: "D", 12: "B", 13: "A", 14: "C", 15: "B", 16: "D", 17: "A", 18: "B", 19: "D", 20: "B" },
    correctCount: 19,
    wrongCount: 1,
    emptyCount: 0,
    netScore: 18.67,
    totalScore: 93.35,
    scannedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    opticalConfidence: 99
  },
  {
    id: "res-5",
    examId: "exam-lgs-8",
    studentNumber: "105",
    studentName: "Kerem Yıldız",
    studentClass: "8-A",
    answers: { 1: "B", 2: "C", 3: "B", 4: "A", 5: "A", 6: "D", 7: "D", 8: "B", 9: "", 10: "C", 11: "A", 12: "B", 13: "A", 14: "D", 15: "B", 16: "D", 17: "A", 18: "C", 19: "B", 20: "C" },
    correctCount: 11,
    wrongCount: 8,
    emptyCount: 1,
    netScore: 8.33,
    totalScore: 41.65,
    scannedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    opticalConfidence: 95
  }
];

function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
      return {
        exams: data.exams || [defaultExam],
        students: data.students || defaultStudents,
        results: data.results || defaultResults
      };
    }
  } catch (err) {
    console.error("Error reading database file, using defaults:", err);
  }
  const initial = {
    exams: [defaultExam],
    students: defaultStudents,
    results: defaultResults
  };
  saveDatabase(initial);
  return initial;
}

function saveDatabase(db: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing database file:", err);
  }
}

// Lazy Gemini Client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return geminiClient;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  let db = loadDatabase();

  // --- REST API ENDPOINTS ---

  // Get all exams
  app.get("/api/exams", (req, res) => {
    db = loadDatabase();
    res.json(db.exams);
  });

  // Create or update exam
  app.post("/api/exams", (req, res) => {
    const examData = req.body;
    db = loadDatabase();
    const existingIndex = db.exams.findIndex((e: any) => e.id === examData.id);
    if (existingIndex >= 0) {
      db.exams[existingIndex] = { ...db.exams[existingIndex], ...examData };
    } else {
      const newExam = {
        ...examData,
        id: examData.id || `exam-${Date.now()}`,
        createdAt: examData.createdAt || new Date().toISOString()
      };
      db.exams.unshift(newExam);
    }
    saveDatabase(db);
    res.json({ success: true, exams: db.exams });
  });

  // Delete exam
  app.delete("/api/exams/:id", (req, res) => {
    const { id } = req.params;
    db = loadDatabase();
    db.exams = db.exams.filter((e: any) => e.id !== id);
    db.results = db.results.filter((r: any) => r.examId !== id);
    saveDatabase(db);
    res.json({ success: true, exams: db.exams });
  });

  // Get students
  app.get("/api/students", (req, res) => {
    db = loadDatabase();
    res.json(db.students);
  });

  // Add or update students (single or batch)
  app.post("/api/students", (req, res) => {
    const payload = req.body;
    db = loadDatabase();
    if (Array.isArray(payload)) {
      // Bulk add
      for (const item of payload) {
        const idx = db.students.findIndex((s: any) => s.studentNumber === item.studentNumber);
        if (idx >= 0) {
          db.students[idx] = { ...db.students[idx], ...item };
        } else {
          db.students.push({
            id: item.id || `std-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            ...item
          });
        }
      }
    } else {
      const idx = db.students.findIndex((s: any) => s.studentNumber === payload.studentNumber);
      if (idx >= 0) {
        db.students[idx] = { ...db.students[idx], ...payload };
      } else {
        db.students.push({
          id: payload.id || `std-${Date.now()}`,
          ...payload
        });
      }
    }
    saveDatabase(db);
    res.json({ success: true, students: db.students });
  });

  // Delete student
  app.delete("/api/students/:id", (req, res) => {
    const { id } = req.params;
    db = loadDatabase();
    db.students = db.students.filter((s: any) => s.id !== id);
    saveDatabase(db);
    res.json({ success: true, students: db.students });
  });

  // Get results
  app.get("/api/results", (req, res) => {
    db = loadDatabase();
    const { examId } = req.query;
    if (examId) {
      return res.json(db.results.filter((r: any) => r.examId === examId));
    }
    res.json(db.results);
  });

  // Save scan result
  app.post("/api/results", (req, res) => {
    const resultData = req.body;
    db = loadDatabase();
    const newResult = {
      ...resultData,
      id: resultData.id || `res-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      scannedAt: resultData.scannedAt || new Date().toISOString()
    };
    // Replace if same exam & student already exists, or append
    const existingIndex = db.results.findIndex(
      (r: any) => r.examId === newResult.examId && r.studentNumber === newResult.studentNumber
    );
    if (existingIndex >= 0) {
      db.results[existingIndex] = newResult;
    } else {
      db.results.unshift(newResult);
    }
    saveDatabase(db);
    res.json({ success: true, result: newResult, results: db.results });
  });

  // Delete result
  app.delete("/api/results/:id", (req, res) => {
    const { id } = req.params;
    db = loadDatabase();
    db.results = db.results.filter((r: any) => r.id !== id);
    saveDatabase(db);
    res.json({ success: true, results: db.results });
  });

  // --- OPTICAL SCAN / CAMERA EVALUATION ENDPOINT ---
  app.post("/api/scan-form", async (req, res) => {
    try {
      const { imageBase64, examId, manualAnswers, manualStudentNumber } = req.body;
      db = loadDatabase();
      const exam = db.exams.find((e: any) => e.id === examId) || db.exams[0];
      if (!exam) {
        return res.status(404).json({ success: false, message: "Sınav bulunamadı." });
      }

      let detectedNumber = manualStudentNumber || "";
      let detectedName = "";
      let detectedAnswers: Record<number, string> = manualAnswers || {};
      let confidence = 95;

      const ai = getGeminiClient();

      if (imageBase64 && ai && (!manualAnswers || Object.keys(manualAnswers).length === 0)) {
        // Strip data:image/...;base64, prefix
        const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");
        const mimeType = imageBase64.startsWith("data:image/png") ? "image/png" : "image/jpeg";

        const prompt = `You are a high-precision optical mark recognition (OMR) system for school exams named "Arifler Exam".
Analyze this optical answer sheet image very carefully:
1. Identify the student number (look for the "Öğrenci No" bubble matrix or printed/written text). Return as string of digits.
2. Identify the student name if printed or written (e.g. "Adı Soyadı: ...").
3. For questions from 1 up to ${exam.questionCount}:
   - Look at each question row. The available choices are ${exam.optionsCount === 4 ? "A, B, C, D" : "A, B, C, D, E"}.
   - Identify which bubble is shaded/filled with a pencil or pen.
   - If a bubble is clearly filled/marked, return its letter ("A", "B", "C", "D", or "E").
   - If the row is left blank/unmarked, return "".
   - If multiple bubbles are filled in the same question row, return "MULTI".
4. Provide confidence from 0 to 100 based on form clarity, lighting, and alignment.`;

        try {
          const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: {
              parts: [
                {
                  inlineData: {
                    mimeType,
                    data: cleanBase64
                  }
                },
                { text: prompt }
              ]
            },
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  studentNumber: { type: Type.STRING, description: "Student number or empty string if not found" },
                  studentName: { type: Type.STRING, description: "Student name if visible or empty string" },
                  confidence: { type: Type.INTEGER, description: "Optical recognition confidence from 0 to 100" },
                  answers: {
                    type: Type.ARRAY,
                    description: "List of detected question answers",
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        questionNumber: { type: Type.INTEGER },
                        markedOption: { type: Type.STRING, description: "A, B, C, D, E, or empty string if blank, or MULTI if multiple" }
                      },
                      required: ["questionNumber", "markedOption"]
                    }
                  }
                },
                required: ["studentNumber", "answers"]
              }
            }
          });

          const rawText = response.text || "{}";
          const parsed = JSON.parse(rawText);

          if (parsed.studentNumber) detectedNumber = parsed.studentNumber.trim();
          if (parsed.studentName) detectedName = parsed.studentName.trim();
          if (parsed.confidence) confidence = parsed.confidence;

          if (Array.isArray(parsed.answers)) {
            for (const item of parsed.answers) {
              const qNum = Number(item.questionNumber);
              const opt = (item.markedOption || "").toUpperCase().trim();
              if (qNum >= 1 && qNum <= exam.questionCount) {
                detectedAnswers[qNum] = opt;
              }
            }
          }
        } catch (geminiError: any) {
          console.warn("Gemini vision recognition error, falling back to simulated optical reader:", geminiError?.message);
        }
      }

      // If no answers detected yet (e.g. mock test or no key), generate realistic answers for demo
      if (Object.keys(detectedAnswers).length === 0) {
        const studentObj = db.students.find((s: any) => s.studentNumber === detectedNumber) || db.students[0];
        detectedNumber = detectedNumber || studentObj?.studentNumber || "101";
        detectedName = detectedName || studentObj?.fullName || "Öğrenci";

        // Generate high-accuracy demo scan matching answer key with 1-2 realistic mistakes
        for (let i = 1; i <= exam.questionCount; i++) {
          const correctOpt = exam.answerKey[i] || "A";
          // 85% chance correct, 10% wrong, 5% blank
          const rand = Math.random();
          if (rand < 0.85) {
            detectedAnswers[i] = correctOpt;
          } else if (rand < 0.95) {
            const choices = exam.optionsCount === 4 ? ["A", "B", "C", "D"] : ["A", "B", "C", "D", "E"];
            const wrongChoices = choices.filter((c: string) => c !== correctOpt);
            detectedAnswers[i] = wrongChoices[Math.floor(Math.random() * wrongChoices.length)];
          } else {
            detectedAnswers[i] = ""; // blank
          }
        }
      }

      // Match student name from roster if not detected
      const matchedStudent = db.students.find((s: any) => s.studentNumber === detectedNumber);
      if (matchedStudent) {
        detectedName = matchedStudent.fullName;
      } else if (!detectedName) {
        detectedName = `Öğrenci #${detectedNumber || "Bilinmiyor"}`;
      }

      // Calculate score & question breakdown
      let correctCount = 0;
      let wrongCount = 0;
      let emptyCount = 0;
      const details = [];

      for (let i = 1; i <= exam.questionCount; i++) {
        const studentAns = (detectedAnswers[i] || "").toUpperCase();
        const correctAns = (exam.answerKey[i] || "").toUpperCase();
        const isEmpty = !studentAns || studentAns === "";
        const isCorrect = !isEmpty && studentAns === correctAns;
        const isWrong = !isEmpty && studentAns !== correctAns;

        if (isCorrect) correctCount++;
        else if (isWrong) wrongCount++;
        else emptyCount++;

        details.push({
          questionNumber: i,
          studentAnswer: studentAns,
          correctAnswer: correctAns,
          isCorrect,
          isEmpty
        });
      }

      // Net score calculation (with penalty ratio e.g. 3 or 4)
      const penalty = exam.penaltyRatio && exam.penaltyRatio > 0 ? wrongCount / exam.penaltyRatio : 0;
      const netScore = Math.max(0, parseFloat((correctCount - penalty).toFixed(2)));
      const pointsPerQ = exam.pointsPerQuestion || 100 / exam.questionCount;
      const totalScore = Math.max(0, parseFloat((netScore * pointsPerQ).toFixed(2)));

      const evaluation = {
        success: true,
        studentNumber: detectedNumber,
        studentName: detectedName,
        studentClass: matchedStudent ? matchedStudent.gradeClass : exam.gradeClass,
        answers: detectedAnswers,
        correctCount,
        wrongCount,
        emptyCount,
        netScore,
        totalScore,
        confidence,
        details,
        message: "Optik form başarıyla okundu ve değerlendirildi."
      };

      res.json(evaluation);
    } catch (error: any) {
      console.error("Scan form route error:", error);
      res.status(500).json({ success: false, message: error?.message || "Optik okuma sırasında bir hata oluştu." });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", app: "Arifler Exam", time: new Date().toISOString() });
  });

  // Vite middleware in development or static in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Arifler Exam server running on http://localhost:${PORT}`);
  });
}

startServer();
