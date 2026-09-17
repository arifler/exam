import { jsPDF } from "jspdf";
import { Exam, Student } from "../types";

/**
 * Normalizes Turkish and special characters to safe ASCII for standard PDF fonts (Helvetica)
 * preventing text corruption, missing characters, or encoding crashes in PDF viewers.
 */
export function cleanPdfText(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .replace(/ğ/g, "g")
    .replace(/Ğ/g, "G")
    .replace(/ü/g, "u")
    .replace(/Ü/g, "U")
    .replace(/ş/g, "s")
    .replace(/Ş/g, "S")
    .replace(/ı/g, "i")
    .replace(/İ/g, "I")
    .replace(/ö/g, "o")
    .replace(/Ö/g, "O")
    .replace(/ç/g, "c")
    .replace(/Ç/g, "C")
    .replace(/[^\x20-\x7E]/g, " ");
}

export function generateOpticalFormPdf(
  exam: Exam,
  students: Student[],
  mode: "personalized" | "blank" = "personalized"
) {
  // Standard A4 dimensions in mm: 210 x 297
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true
  });

  const studentList =
    mode === "personalized" && students.length > 0
      ? students
      : [{ id: "blank", studentNumber: "", fullName: "", gradeClass: exam.gradeClass }];

  studentList.forEach((student, index) => {
    if (index > 0) {
      doc.addPage("a4", "portrait");
    }

    drawSingleOpticalForm(doc, exam, student, mode === "personalized");
  });

  const safeTitle = cleanPdfText(exam.title).replace(/[^a-zA-Z0-9_]/g, "_");
  const fileName = `${safeTitle || "Optik_Form"}_${mode === "personalized" ? "Isimli" : "Bos"}.pdf`;
  doc.save(fileName);
}

function drawSingleOpticalForm(
  doc: jsPDF,
  exam: Exam,
  student: Student,
  isPersonalized: boolean
) {
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 12;

  // -------------------------------------------------------------
  // 1. OMR FIDUCIAL CORNER ALIGNMENT MARKERS (Solid Black Squares)
  // -------------------------------------------------------------
  const markerSize = 8;
  doc.setFillColor(15, 23, 42); // slate-900 / solid black
  doc.rect(margin, margin, markerSize, markerSize, "F"); // Top-Left
  doc.rect(pageWidth - margin - markerSize, margin, markerSize, markerSize, "F"); // Top-Right
  doc.rect(margin, pageHeight - margin - markerSize, markerSize, markerSize, "F"); // Bottom-Left
  doc.rect(pageWidth - margin - markerSize, pageHeight - margin - markerSize, markerSize, markerSize, "F"); // Bottom-Right

  // Outer framing boundary with precise alignment guides
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.3);
  doc.rect(margin + 0.5, margin + 0.5, pageWidth - 2 * (margin + 0.5), pageHeight - 2 * (margin + 0.5));

  // -------------------------------------------------------------
  // 2. HEADER BOX
  // -------------------------------------------------------------
  const headerX = margin + 11;
  const headerY = margin + 1;
  const headerWidth = pageWidth - 2 * headerX;
  const headerHeight = 21;

  // Header background & border
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(148, 163, 184); // slate-400
  doc.setLineWidth(0.4);
  doc.roundedRect(headerX, headerY, headerWidth, headerHeight, 1.5, 1.5, "FD");

  // Title
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("ARIFLER EXAM - OPTIK CEVAP FORMU", pageWidth / 2, headerY + 6.5, { align: "center" });

  // Subtitle / Meta information
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const examTitleStr = cleanPdfText(exam.title);
  const subjectStr = cleanPdfText(exam.subject);
  const gradeStr = cleanPdfText(exam.gradeClass);
  const dateStr = cleanPdfText(exam.date);
  doc.text(
    `Sinav: ${examTitleStr}   |   Ders: ${subjectStr}   |   Sinif: ${gradeStr}   |   Tarih: ${dateStr}`,
    pageWidth / 2,
    headerY + 13,
    { align: "center" }
  );

  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    "Lutfen cevaplarinizi yumusak kursun kalemle, daireleri tasırmadan ve tam doldurarak kodlayiniz.",
    pageWidth / 2,
    headerY + 18,
    { align: "center" }
  );

  // -------------------------------------------------------------
  // 3. STUDENT INFORMATION & NUMBER MATRIX SECTION
  // -------------------------------------------------------------
  const sectionY = headerY + headerHeight + 3.5;
  const sectionHeight = 49;
  const colGap = 4;
  const infoWidth = 106;
  const matrixWidth = pageWidth - 2 * headerX - infoWidth - colGap;
  const matrixX = headerX + infoWidth + colGap;

  // --- 3A. Left: Student Information Card ---
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.35);
  doc.roundedRect(headerX, sectionY, infoWidth, sectionHeight, 1.2, 1.2, "FD");

  // Info Card Header
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(headerX, sectionY, infoWidth, 6.5, 1.2, 1.2, "F");
  doc.line(headerX, sectionY + 6.5, headerX + infoWidth, sectionY + 6.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text("OGRENCI BILGILERI", headerX + 4, sectionY + 4.6);

  // Student Fields
  const rowStartY = sectionY + 12.5;
  const fieldSpacing = 7.5;

  const fields = [
    { label: "Adi Soyadi", value: isPersonalized && student.fullName ? cleanPdfText(student.fullName) : "" },
    { label: "Sinifi / Sube", value: isPersonalized && student.gradeClass ? cleanPdfText(student.gradeClass) : cleanPdfText(exam.gradeClass) },
    { label: "Ogrenci No", value: isPersonalized && student.studentNumber ? cleanPdfText(student.studentNumber) : "" },
  ];

  fields.forEach((f, idx) => {
    const rowY = rowStartY + idx * fieldSpacing;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`${f.label} :`, headerX + 4, rowY);

    if (f.value) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(f.value, headerX + 28, rowY);
    } else {
      // Dotted underline for manual handwriting
      doc.setDrawColor(203, 213, 225);
      doc.setLineDashPattern([1, 1], 0);
      doc.line(headerX + 28, rowY + 0.5, headerX + infoWidth - 6, rowY + 0.5);
      doc.setLineDashPattern([], 0); // reset dash
    }
  });

  // Booklet Type (Kitapcık Turu) & Signature Row
  const bookletRowY = rowStartY + 3 * fieldSpacing + 1.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text("Kitapcik Turu :", headerX + 4, bookletRowY);

  // Draw Booklet bubbles [ A ] [ B ]
  ["A", "B"].forEach((bType, bIdx) => {
    const bCircleX = headerX + 31 + bIdx * 11;
    const bCircleY = bookletRowY - 1;
    doc.setDrawColor(100, 116, 139);
    doc.setLineWidth(0.3);
    doc.circle(bCircleX, bCircleY, 2.2, "S");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text(bType, bCircleX, bCircleY + 0.8, { align: "center" });
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Imza : ..............................", headerX + 62, bookletRowY);

  // --- 3B. Right: Student Number Optical Coding Matrix ---
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.35);
  doc.roundedRect(matrixX, sectionY, matrixWidth, sectionHeight, 1.2, 1.2, "FD");

  // Matrix Header
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(matrixX, sectionY, matrixWidth, 6.5, 1.2, 1.2, "F");
  doc.line(matrixX, sectionY + 6.5, matrixX + matrixWidth, sectionY + 6.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text("OGRENCI NO KODLAMA", matrixX + matrixWidth / 2, sectionY + 4.6, { align: "center" });

  // Draw 4-column Student Number Bubbles
  const numDigits = 4;
  const rawNum = student.studentNumber ? cleanPdfText(student.studentNumber) : "";
  const paddedNum = rawNum.padStart(numDigits, "0").slice(-numDigits);

  const colPitch = 12.5;
  const matrixStartX = matrixX + (matrixWidth - numDigits * colPitch) / 2 + colPitch / 2;
  const boxTopY = sectionY + 8.5;

  for (let c = 0; c < numDigits; c++) {
    const colCenterX = matrixStartX + c * colPitch;
    const digitChar = isPersonalized ? paddedNum[c] : "";

    // Digit header box (where digit number is written)
    doc.setDrawColor(148, 163, 184);
    doc.setFillColor(248, 250, 252);
    doc.setLineWidth(0.3);
    doc.rect(colCenterX - 4, boxTopY, 8, 5.2, "FD");

    if (digitChar) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(digitChar, colCenterX, boxTopY + 3.9, { align: "center" });
    }

    // 0 through 9 Optical Bubbles
    const bubbleStartY = boxTopY + 7.5;
    const bubbleStepY = 3.2; // 3.2mm distance between centers, radius is 1.35mm (diameter 2.7mm) -> NO overlapping!
    const bubbleRadius = 1.35;

    for (let d = 0; d <= 9; d++) {
      const bY = bubbleStartY + d * bubbleStepY;
      const isFilled = isPersonalized && digitChar === d.toString();

      if (isFilled) {
        // Solid black/slate fill for marked bubble
        doc.setFillColor(15, 23, 42);
        doc.setDrawColor(15, 23, 42);
        doc.circle(colCenterX, bY, bubbleRadius, "FD");
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(6.5);
        doc.text(d.toString(), colCenterX, bY + 0.65, { align: "center" });
      } else {
        // Clear outline with legible digit inside
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(148, 163, 184);
        doc.circle(colCenterX, bY, bubbleRadius, "FD");
        doc.setTextColor(71, 85, 105);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6);
        doc.text(d.toString(), colCenterX, bY + 0.6, { align: "center" });
      }
    }
  }

  // -------------------------------------------------------------
  // 4. INSTRUCTIONS & MARKING SAMPLES BANNER
  // -------------------------------------------------------------
  const instrY = sectionY + sectionHeight + 3;
  const instrHeight = 7.5;
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(headerX, instrY, headerWidth, instrHeight, 1, 1, "FD");

  // Sample drawings using vector shapes so they never depend on missing Unicode fonts
  const midY = instrY + instrHeight / 2;

  // Label: Dogru Kodlama
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text("Dogru Kodlama:", headerX + 16, midY + 1, { align: "right" });

  // Correct sample: filled bubble
  doc.setFillColor(15, 23, 42);
  doc.circle(headerX + 21, midY, 1.8, "F");
  doc.setFontSize(6.5);
  doc.setTextColor(255, 255, 255);
  doc.text("A", headerX + 21, midY + 0.7, { align: "center" });

  // Label: Hatali Kodlamalar
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Hatali:", headerX + 42, midY + 1, { align: "right" });

  // Wrong sample 1: circle with X
  const w1X = headerX + 47;
  doc.setDrawColor(148, 163, 184);
  doc.circle(w1X, midY, 1.8, "S");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(225, 29, 72);
  doc.text("X", w1X, midY + 0.7, { align: "center" });

  // Wrong sample 2: circle with slash
  const w2X = headerX + 53;
  doc.setDrawColor(148, 163, 184);
  doc.circle(w2X, midY, 1.8, "S");
  doc.line(w2X - 1.2, midY + 1.2, w2X + 1.2, midY - 1.2);

  // Wrong sample 3: circle with tiny dot
  const w3X = headerX + 59;
  doc.setDrawColor(148, 163, 184);
  doc.circle(w3X, midY, 1.8, "S");
  doc.setFillColor(15, 23, 42);
  doc.circle(w3X, midY, 0.5, "F");

  // Warning text on the right
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(71, 85, 105);
  doc.text(
    "Dairenin icini tamamen karalayiniz. Cevap alaninin disina tasırmayiniz ve burusturmayiniz.",
    headerX + headerWidth - 4,
    midY + 0.9,
    { align: "right" }
  );

  // -------------------------------------------------------------
  // 5. OPTICAL ANSWER GRID (QUESTIONS & BUBBLES)
  // -------------------------------------------------------------
  const questionsY = instrY + instrHeight + 3.5;
  const totalQuestions = Math.min(Math.max(exam.questionCount, 1), 40);
  const options = exam.optionsCount === 4 ? ["A", "B", "C", "D"] : ["A", "B", "C", "D", "E"];

  // Column count based on question amount:
  // <= 10: 1 or 2 columns
  // <= 20: 2 columns of 10
  // <= 30: 3 columns of 10
  // <= 40: 4 columns of 10
  const colsCount = totalQuestions <= 10 ? 2 : totalQuestions <= 20 ? 2 : totalQuestions <= 30 ? 3 : 4;
  const questionsPerCol = Math.ceil(totalQuestions / colsCount);
  const totalGridWidth = headerWidth;
  const colSpacing = colsCount === 4 ? 3.5 : colsCount === 3 ? 5 : 12;
  const singleColWidth = (totalGridWidth - (colsCount - 1) * colSpacing) / colsCount;

  // Row height adjusted to give plenty of room and clean spacing
  const colHeaderHeight = 6.5;
  const rowHeight = colsCount === 4 ? 8.2 : 8.8;
  const bubbleRadius = colsCount === 4 ? 1.75 : 1.9; // Diameter: 3.5mm to 3.8mm

  for (let c = 0; c < colsCount; c++) {
    const colX = headerX + c * (singleColWidth + colSpacing);
    const qStart = c * questionsPerCol + 1;
    const qEnd = Math.min((c + 1) * questionsPerCol, totalQuestions);

    if (qStart > totalQuestions) continue;

    const actualRows = qEnd - qStart + 1;
    const blockHeight = colHeaderHeight + actualRows * rowHeight;

    // Column Outer Box
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.35);
    doc.roundedRect(colX, questionsY, singleColWidth, blockHeight, 1.2, 1.2, "FD");

    // Column Header Bar
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(colX, questionsY, singleColWidth, colHeaderHeight, 1.2, 1.2, "F");
    doc.line(colX, questionsY + colHeaderHeight, colX + singleColWidth, questionsY + colHeaderHeight);

    // Header Labels: "Soru" and option headers A, B, C, D, E
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text("Soru", colX + 4.5, questionsY + 4.5);

    // Calculate option spacing within column
    const optAreaLeft = colX + (colsCount === 4 ? 11 : 14);
    const optAreaWidth = singleColWidth - (colsCount === 4 ? 13 : 16);
    const optPitch = optAreaWidth / options.length;

    options.forEach((opt, oIdx) => {
      const optCenterX = optAreaLeft + oIdx * optPitch + optPitch / 2;
      doc.text(opt, optCenterX, questionsY + 4.5, { align: "center" });
    });

    // Question Rows
    for (let q = qStart; q <= qEnd; q++) {
      const rIdx = q - qStart;
      const rowY = questionsY + colHeaderHeight + rIdx * rowHeight;
      const rowMidY = rowY + rowHeight / 2;

      // Alternating row background for visual alignment tracking
      if (q % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(colX + 0.2, rowY, singleColWidth - 0.4, rowHeight, "F");
      }

      // Subtle horizontal divider line
      if (rIdx < actualRows - 1) {
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.2);
        doc.line(colX + 1, rowY + rowHeight, colX + singleColWidth - 1, rowY + rowHeight);
      }

      // Small OMR timing line mark on the left edge of the column
      doc.setFillColor(15, 23, 42);
      doc.rect(colX + 0.5, rowMidY - 0.7, 1.5, 1.4, "F");

      // Question Number (e.g., " 1.", "12.")
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      const qNumText = q < 10 ? ` ${q}.` : `${q}.`;
      doc.text(qNumText, colX + 3.5, rowMidY + 1);

      // Bubbles for each option
      options.forEach((opt, oIdx) => {
        const bubbleCenterX = optAreaLeft + oIdx * optPitch + optPitch / 2;

        // Draw bubble circle
        doc.setDrawColor(100, 116, 139); // slate-500
        doc.setFillColor(255, 255, 255);
        doc.setLineWidth(0.3);
        doc.circle(bubbleCenterX, rowMidY, bubbleRadius, "FD");

        // Option Letter inside the bubble
        doc.setFont("helvetica", "bold");
        doc.setFontSize(colsCount === 4 ? 6.5 : 7);
        doc.setTextColor(71, 85, 105);
        doc.text(opt, bubbleCenterX, rowMidY + (colsCount === 4 ? 0.75 : 0.8), { align: "center" });
      });
    }
  }

  // -------------------------------------------------------------
  // 6. BOTTOM TIMING TRACK & VERIFICATION FOOTER
  // -------------------------------------------------------------
  const footerY = pageHeight - margin - 5.5;

  // Bottom OMR Timing Track: barcode-like synchronization marks for computer vision / scanners
  const timingTrackY = footerY - 4;
  const numMarks = 36;
  const trackStartX = headerX;
  const trackWidth = headerWidth;
  const markPitch = trackWidth / numMarks;

  doc.setFillColor(15, 23, 42);
  for (let m = 0; m < numMarks; m++) {
    const markX = trackStartX + m * markPitch;
    doc.rect(markX, timingTrackY, 2.5, 1.5, "F");
  }

  // Form ID & Signature Text
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  const studentIdTag = student.studentNumber ? `STD-${student.studentNumber}` : "BLANK";
  doc.text(
    `Arifler Exam OMR Optik Form Sistemi - Form No: ${exam.id}-${studentIdTag}`,
    headerX,
    footerY
  );
  doc.text(
    "Bu optik form Arifler Exam yapay zeka ve kamera sistemiyle aninda okunabilir.",
    pageWidth - headerX,
    footerY,
    { align: "right" }
  );
}
