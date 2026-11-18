import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function generateScorecard(result, student) {
  const document = new jsPDF();
  document.setFillColor(23, 44, 78);
  document.rect(0, 0, 210, 48, 'F');
  document.setTextColor(255, 255, 255);
  document.setFontSize(22);
  document.text('EXAMLY', 18, 21);
  document.setFontSize(11);
  document.text('OFFICIAL EXAM SCORECARD', 18, 32);
  document.setTextColor(36, 54, 80);
  document.setFontSize(16);
  document.text(result.exam?.title || 'Examination result', 18, 64);
  document.setFontSize(10);
  document.text(`Student: ${student?.name || 'Student'}`, 18, 75);
  document.text(`Department: ${student?.department || '—'}`, 18, 82);
  document.text(`Issued: ${new Date(result.createdAt).toLocaleDateString()}`, 18, 89);
  autoTable(document, {
    startY: 103,
    head: [['Subject', 'Score', 'Percentage', 'Result', 'Time']],
    body: [[
      result.exam?.subject || '—',
      `${result.score} / ${result.totalMarks}`,
      `${result.percentage}%`,
      result.status,
      `${Math.floor(result.timeTakenSeconds / 60)}m ${result.timeTakenSeconds % 60}s`
    ]],
    theme: 'grid',
    headStyles: { fillColor: [49, 95, 206] },
    styles: { cellPadding: 4 }
  });
  document.setFontSize(9);
  document.setTextColor(110, 125, 145);
  document.text('This scorecard was generated electronically by Examly.', 18, 145);
  document.save(`examly-scorecard-${String(result.exam?.title || 'result').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`);
}

