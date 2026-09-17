import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Camera,
  RefreshCw,
  Zap,
  ZapOff,
  Upload,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Award,
  ArrowRight,
  Database,
  Sparkles,
  HelpCircle,
  FileCheck
} from "lucide-react";
import confetti from "canvas-confetti";
import { Exam, ExamResult, ScanEvaluationResponse, Student } from "../types";

interface CameraScannerProps {
  exam: Exam;
  students: Student[];
  onResultSaved: (result: ExamResult) => void;
}

export const CameraScanner: React.FC<CameraScannerProps> = ({
  exam,
  students,
  onResultSaved,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraFacing, setCameraFacing] = useState<"environment" | "user">("environment");
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [torchSupported, setTorchSupported] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [scanning, setScanning] = useState<boolean>(false);
  const [scanStatusMessage, setScanStatusMessage] = useState<string>("");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<ScanEvaluationResponse | null>(null);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [manualStudentNumber, setManualStudentNumber] = useState<string>("");

  // Start Camera
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }

      setStream(mediaStream);
      setCameraActive(true);

      // Check torch capability
      const videoTrack = mediaStream.getVideoTracks()[0];
      const capabilities = (videoTrack?.getCapabilities && videoTrack.getCapabilities()) as any;
      if (capabilities && "torch" in capabilities) {
        setTorchSupported(true);
      } else {
        setTorchSupported(false);
      }
    } catch (err: any) {
      console.warn("Camera access failed or denied:", err);
      setCameraError("Kamera açılamadı veya izin verilmedi. Dosyadan fotoğraf yükleyerek devam edebilirsiniz.");
      setCameraActive(false);
    }
  }, [cameraFacing, stream]);

  // Stop Camera
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    setCameraActive(false);
    setTorchOn(false);
  }, [stream]);

  // Toggle Torch
  const toggleTorch = async () => {
    if (!stream) return;
    const videoTrack = stream.getVideoTracks()[0];
    try {
      await videoTrack.applyConstraints({
        advanced: [{ torch: !torchOn } as any]
      });
      setTorchOn(!torchOn);
    } catch (e) {
      console.warn("Torch failed", e);
    }
  };

  // Flip Camera
  const flipCamera = () => {
    setCameraFacing((prev) => (prev === "environment" ? "user" : "environment"));
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [cameraFacing]);

  // Process image via Server API
  const evaluateImage = async (base64Img: string, customStudentNum?: string) => {
    setScanning(true);
    setScanStatusMessage("Yapay zeka optik formu tarıyor...");

    try {
      const response = await fetch("/api/scan-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64Img,
          examId: exam.id,
          manualStudentNumber: customStudentNum || manualStudentNumber
        })
      });

      const data: ScanEvaluationResponse = await response.json();
      setEvaluation(data);
      setCapturedImage(base64Img);
      setIsSaved(false);

      if (data.totalScore >= 70) {
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch {
          // ignore
        }
      }
    } catch (err: any) {
      console.error("Evaluation error:", err);
      alert("Optik form okunamadı: " + (err?.message || "Sunucu hatası"));
    } finally {
      setScanning(false);
    }
  };

  // Capture frame from video
  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const base64Img = canvas.toDataURL("image/jpeg", 0.9);
    evaluateImage(base64Img);
  };

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      evaluateImage(base64);
    };
    reader.readAsDataURL(file);
  };

  // Demo Scan Generator (Simulated perfect / near perfect test sheet)
  const triggerDemoScan = () => {
    const randomStudent = students[Math.floor(Math.random() * students.length)] || {
      id: "demo",
      studentNumber: "101",
      fullName: "Örnek Öğrenci",
      gradeClass: exam.gradeClass
    };
    setManualStudentNumber(randomStudent.studentNumber);

    // Create a demo canvas image of an optical sheet
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 1100;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 800, 1100);
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(30, 30, 40, 40);
      ctx.fillRect(730, 30, 40, 40);
      ctx.fillRect(30, 1030, 40, 40);
      ctx.fillRect(730, 1030, 40, 40);
      ctx.font = "bold 28px sans-serif";
      ctx.fillText("ARİFLER EXAM - OPTİK CEVAP KAĞIDI", 150, 70);
      ctx.font = "20px sans-serif";
      ctx.fillText(`Öğrenci: ${randomStudent.fullName} (${randomStudent.studentNumber})`, 150, 110);
    }
    const demoBase64 = canvas.toDataURL("image/jpeg", 0.9);
    evaluateImage(demoBase64, randomStudent.studentNumber);
  };

  // Save to Database
  const saveResultToDatabase = async () => {
    if (!evaluation) return;

    const payload: ExamResult = {
      id: `res-${Date.now()}`,
      examId: exam.id,
      studentNumber: evaluation.studentNumber || "100",
      studentName: evaluation.studentName || "Öğrenci",
      studentClass: exam.gradeClass,
      answers: evaluation.answers,
      correctCount: evaluation.correctCount,
      wrongCount: evaluation.wrongCount,
      emptyCount: evaluation.emptyCount,
      netScore: evaluation.netScore,
      totalScore: evaluation.totalScore,
      scannedAt: new Date().toISOString(),
      opticalConfidence: evaluation.confidence || 98
    };

    try {
      const res = await fetch("/api/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setIsSaved(true);
        onResultSaved(data.result);
      }
    } catch (err) {
      console.error("Save error:", err);
      // Fallback local save
      setIsSaved(true);
      onResultSaved(payload);
    }
  };

  const resetScanner = () => {
    setEvaluation(null);
    setCapturedImage(null);
    setIsSaved(false);
    startCamera();
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 pb-24 md:pb-12">
      {/* Hidden Canvas for Frame Capture */}
      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Top Banner with Exam Info */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Optik Okuma Kamerası
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Aktif Sınav: <span className="font-semibold text-slate-800">{exam.title}</span> ({exam.questionCount} Soru, {exam.gradeClass})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-demo-scan"
            onClick={triggerDemoScan}
            disabled={scanning}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Örnek Formu Oku</span>
          </button>

          <button
            id="btn-upload-file"
            onClick={() => fileInputRef.current?.click()}
            disabled={scanning}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Fotoğraf Yükle</span>
          </button>
        </div>
      </div>

      {/* Main View: Camera or Evaluation Result */}
      {!evaluation ? (
        <div className="relative bg-slate-950 rounded-2xl overflow-hidden shadow-xl border border-slate-800 aspect-3/4 sm:aspect-16/10 flex items-center justify-center">
          {cameraActive ? (
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center p-6 max-w-sm">
              <Camera className="w-12 h-12 text-slate-600 mx-auto mb-3 animate-pulse" />
              <p className="text-sm font-semibold text-slate-300">
                {cameraError || "Kamera başlatılıyor..."}
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <button
                  onClick={startCamera}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
                >
                  Kamerayı Tekrar Başlat
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
                >
                  Cihazdan Fotoğraf Seç
                </button>
              </div>
            </div>
          )}

          {/* Scanner Reticle Overlay */}
          {cameraActive && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-6 sm:p-8">
              {/* Corner Fiducial Alignment Brackets */}
              <div className="w-full h-full relative border-2 border-indigo-500/40 rounded-xl">
                {/* 4 Corner Markers matching optical form fiducials */}
                <div className="absolute top-2 left-2 w-7 h-7 border-t-4 border-l-4 border-emerald-400" />
                <div className="absolute top-2 right-2 w-7 h-7 border-t-4 border-r-4 border-emerald-400" />
                <div className="absolute bottom-2 left-2 w-7 h-7 border-b-4 border-l-4 border-emerald-400" />
                <div className="absolute bottom-2 right-2 w-7 h-7 border-b-4 border-r-4 border-emerald-400" />

                {/* Animated Laser Scanning Line */}
                <div className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent shadow-[0_0_12px_rgba(99,102,241,0.8)] animate-pulse top-1/2 -translate-y-1/2" />
              </div>

              {/* Guidance Badge */}
              <div className="bg-slate-900/80 backdrop-blur text-slate-200 text-xs px-4 py-1.5 rounded-full border border-slate-700 font-medium">
                Optik formun 4 siyah köşesini hizalayın
              </div>
            </div>
          )}

          {/* Top Controls Overlay */}
          {cameraActive && (
            <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
              {torchSupported && (
                <button
                  onClick={toggleTorch}
                  className="w-10 h-10 rounded-full bg-slate-900/70 backdrop-blur text-white flex items-center justify-center hover:bg-slate-900 transition-colors"
                  title="Flaş / Işık"
                >
                  {torchOn ? <Zap className="w-5 h-5 text-amber-400" /> : <ZapOff className="w-5 h-5" />}
                </button>
              )}

              <button
                onClick={flipCamera}
                className="w-10 h-10 rounded-full bg-slate-900/70 backdrop-blur text-white flex items-center justify-center hover:bg-slate-900 transition-colors"
                title="Kamera Değiştir"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Bottom Capture Button Overlay */}
          {cameraActive && (
            <div className="absolute bottom-5 inset-x-0 flex items-center justify-center gap-6 z-10">
              <button
                id="btn-capture-scan"
                onClick={captureFrame}
                disabled={scanning}
                className="group relative flex items-center justify-center"
              >
                <span className="w-18 h-18 rounded-full border-4 border-white/80 flex items-center justify-center bg-indigo-600/90 group-hover:scale-105 group-active:scale-95 transition-all shadow-xl shadow-indigo-900/50">
                  <span className="w-13 h-13 rounded-full bg-white flex items-center justify-center">
                    <Camera className="w-6 h-6 text-indigo-600" />
                  </span>
                </span>
                <span className="absolute -bottom-6 text-[11px] font-bold text-white tracking-wider drop-shadow-md">
                  TARA & DEĞERLENDİR
                </span>
              </button>
            </div>
          )}

          {/* Scanning Progress Overlay */}
          {scanning && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 z-20 text-white">
              <div className="w-14 h-14 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin mb-4" />
              <p className="text-base font-bold text-white mb-1">Optik Form Okunuyor</p>
              <p className="text-xs text-indigo-300 animate-pulse">{scanStatusMessage}</p>
            </div>
          )}
        </div>
      ) : (
        /* Evaluation Result Modal / Card */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden transition-all animate-in fade-in zoom-in-95">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 text-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center">
                  <Award className="w-6 h-6 text-amber-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg sm:text-xl font-bold">{evaluation.studentName}</h3>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white">
                      No: {evaluation.studentNumber}
                    </span>
                  </div>
                  <p className="text-xs text-indigo-100 mt-0.5">
                    {exam.title} • {exam.gradeClass}
                  </p>
                </div>
              </div>

              {/* Score Highlight Badge */}
              <div className="flex items-baseline gap-2 bg-white/15 backdrop-blur px-4 py-2 rounded-xl border border-white/20">
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-indigo-200 block">Toplam Puan</span>
                  <span className="text-2xl sm:text-3xl font-black text-white">{evaluation.totalScore}</span>
                </div>
                <span className="text-xs text-indigo-200 font-bold">/ 100</span>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-4 border-b border-slate-100 bg-slate-50/50 divide-x divide-slate-100 p-3 text-center">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block">Net Doğru</span>
              <span className="text-lg font-black text-indigo-700">{evaluation.netScore}</span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-emerald-600 flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Doğru
              </span>
              <span className="text-lg font-black text-emerald-700">{evaluation.correctCount}</span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-rose-600 flex items-center justify-center gap-1">
                <XCircle className="w-3.5 h-3.5" /> Yanlış
              </span>
              <span className="text-lg font-black text-rose-700">{evaluation.wrongCount}</span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 flex items-center justify-center gap-1">
                <MinusCircle className="w-3.5 h-3.5" /> Boş
              </span>
              <span className="text-lg font-black text-slate-700">{evaluation.emptyCount}</span>
            </div>
          </div>

          {/* Question-by-Question Matrix */}
          <div className="p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center justify-between">
              <span>Soru Soru Cevap Dökümü</span>
              <span className="text-[11px] font-medium text-slate-400">
                (İşaretlenen / Doğru Cevap)
              </span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {evaluation.details?.map((detail) => {
                const isCorrect = detail.isCorrect;
                const isEmpty = detail.isEmpty;

                return (
                  <div
                    key={detail.questionNumber}
                    className={`p-2 rounded-lg border text-xs flex items-center justify-between transition-all ${
                      isCorrect
                        ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                        : isEmpty
                        ? "bg-slate-50 border-slate-200 text-slate-600"
                        : "bg-rose-50/70 border-rose-200 text-rose-900"
                    }`}
                  >
                    <span className="font-bold">Soru {detail.questionNumber}:</span>

                    <div className="flex items-center gap-1 font-mono font-bold">
                      {isCorrect ? (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white">
                          {detail.studentAnswer} ✓
                        </span>
                      ) : isEmpty ? (
                        <span className="text-slate-400">
                          - <span className="text-slate-500 font-normal">({detail.correctAnswer})</span>
                        </span>
                      ) : (
                        <span>
                          <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white mr-1">
                            {detail.studentAnswer} ✗
                          </span>
                          <span className="text-slate-500 text-[10px]">({detail.correctAnswer})</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Footer */}
          <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                id="btn-save-result"
                onClick={saveResultToDatabase}
                disabled={isSaved}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all ${
                  isSaved
                    ? "bg-emerald-600 text-white cursor-default"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                }`}
              >
                {isSaved ? (
                  <>
                    <FileCheck className="w-4 h-4" />
                    <span>Veritabanına Kaydedildi</span>
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    <span>Sonucu Veritabanına Kaydet</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="btn-next-scan"
                onClick={resetScanner}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-slate-800 hover:bg-slate-900 text-white transition-colors"
              >
                <span>Sıradaki Öğrenciyi Tara</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Helpful Optical Sheet Guidelines */}
      <div className="mt-6 bg-slate-50 rounded-xl p-4 border border-slate-200 text-slate-600 text-xs">
        <div className="flex items-center gap-2 font-bold text-slate-800 mb-2">
          <HelpCircle className="w-4 h-4 text-indigo-600" />
          <span>Optik Okuma İpuçları:</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-slate-600">
          <li>Cevap kağıdının 4 siyah köşe kutucuğunun kameranın görüş açısı içinde olduğundan emin olun.</li>
          <li>Kamerayı formun tam üstünden, dik açıyla ve iyi aydınlatılmış bir ortamda tutun.</li>
          <li>Öğrencilerinizin formlarını bu sayfadaki <strong>"Optik Form & PDF"</strong> menüsünden yazdırabilirsiniz.</li>
        </ul>
      </div>
    </div>
  );
};
