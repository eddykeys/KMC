"use client";

import { formatDate } from "@/lib/utils";

interface ReportCardViewProps {
  schoolName: string;
  studentName: string;
  accessId: string;
  className: string;
  termName: string;
  sessionName: string;
  generatedAt: string;
  averageScore: number | null;
  totalScore: number | null;
  position: number | null;
  outOf: number | null;
  classTeacherComment: string | null;
  principalComment: string | null;
  results: Array<{
    subjectName: string;
    firstCA: number | null;
    secondCA: number | null;
    midTermTest: number | null;
    assignment: number | null;
    project: number | null;
    examScore: number | null;
    totalScore: number | null;
    grade: string | null;
    remark: string | null;
  }>;
}

export function ReportCardView(props: ReportCardViewProps) {
  async function handleDownloadPdf() {
    const { jsPDF } = await import("jspdf");

    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    let y = 40;

    pdf.setFontSize(18);
    pdf.text(props.schoolName, 40, y);
    y += 24;
    pdf.setFontSize(14);
    pdf.text("Student Report Card", 40, y);
    y += 24;
    pdf.setFontSize(11);
    pdf.text(`Student: ${props.studentName} (${props.accessId})`, 40, y);
    y += 16;
    pdf.text(`Class: ${props.className}`, 40, y);
    y += 16;
    pdf.text(`Term: ${props.termName} • ${props.sessionName}`, 40, y);
    y += 16;
    pdf.text(`Generated: ${formatDate(props.generatedAt)}`, 40, y);
    y += 24;
    pdf.text(
      `Average: ${props.averageScore?.toFixed(2) ?? "-"}   Position: ${
        props.position && props.outOf ? `${props.position}/${props.outOf}` : "-"
      }`,
      40,
      y
    );
    y += 28;

    props.results.forEach((result, index) => {
      if (y > 740) {
        pdf.addPage();
        y = 40;
      }

      pdf.setFontSize(12);
      pdf.text(`${index + 1}. ${result.subjectName}`, 40, y);
      y += 16;
      pdf.setFontSize(10);
      pdf.text(
        `CA1: ${result.firstCA ?? "-"}  CA2: ${result.secondCA ?? "-"}  Mid: ${
          result.midTermTest ?? "-"
        }  Assign: ${result.assignment ?? "-"}  Project: ${result.project ?? "-"}  Exam: ${
          result.examScore ?? "-"
        }`,
        50,
        y
      );
      y += 14;
      pdf.text(
        `Total: ${result.totalScore ?? "-"}  Grade: ${result.grade ?? "-"}  Remark: ${
          result.remark ?? "-"
        }`,
        50,
        y
      );
      y += 20;
    });

    if (props.classTeacherComment) {
      pdf.text(`Class Teacher: ${props.classTeacherComment}`, 40, y);
      y += 18;
    }

    if (props.principalComment) {
      pdf.text(`Principal: ${props.principalComment}`, 40, y);
    }

    pdf.save(`${props.studentName.replace(/\s+/g, "-").toLowerCase()}-report-card.pdf`);
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 print:hidden">
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center rounded-2xl border border-sky-300/20 bg-sky-300/10 px-4 py-2 text-sm font-medium text-sky-100 transition hover:bg-sky-300/20"
        >
          Print report card
        </button>
        <button
          type="button"
          onClick={handleDownloadPdf}
          className="inline-flex items-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-300/20"
        >
          Export PDF
        </button>
      </div>

      <div className="rounded-[32px] border border-white/10 bg-white px-6 py-8 text-slate-900 shadow-2xl print:rounded-none print:border-none print:p-0 print:shadow-none">
        <div className="border-b border-slate-200 pb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
            {props.schoolName}
          </p>
          <h1 className="mt-3 text-3xl font-semibold">Student Report Card</h1>
          <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
            <p>
              <span className="font-semibold">Student:</span> {props.studentName}
            </p>
            <p>
              <span className="font-semibold">Access ID:</span> {props.accessId}
            </p>
            <p>
              <span className="font-semibold">Class:</span> {props.className}
            </p>
            <p>
              <span className="font-semibold">Term:</span> {props.termName} • {props.sessionName}
            </p>
            <p>
              <span className="font-semibold">Average:</span>{" "}
              {props.averageScore !== null ? props.averageScore.toFixed(2) : "-"}
            </p>
            <p>
              <span className="font-semibold">Position:</span>{" "}
              {props.position && props.outOf ? `${props.position}/${props.outOf}` : "-"}
            </p>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-2 py-3 font-semibold">Subject</th>
                <th className="px-2 py-3 font-semibold">CA1</th>
                <th className="px-2 py-3 font-semibold">CA2</th>
                <th className="px-2 py-3 font-semibold">Mid</th>
                <th className="px-2 py-3 font-semibold">Assign</th>
                <th className="px-2 py-3 font-semibold">Project</th>
                <th className="px-2 py-3 font-semibold">Exam</th>
                <th className="px-2 py-3 font-semibold">Total</th>
                <th className="px-2 py-3 font-semibold">Grade</th>
                <th className="px-2 py-3 font-semibold">Remark</th>
              </tr>
            </thead>
            <tbody>
              {props.results.map((result) => (
                <tr key={result.subjectName} className="border-b border-slate-100">
                  <td className="px-2 py-3 font-medium">{result.subjectName}</td>
                  <td className="px-2 py-3">{result.firstCA ?? "-"}</td>
                  <td className="px-2 py-3">{result.secondCA ?? "-"}</td>
                  <td className="px-2 py-3">{result.midTermTest ?? "-"}</td>
                  <td className="px-2 py-3">{result.assignment ?? "-"}</td>
                  <td className="px-2 py-3">{result.project ?? "-"}</td>
                  <td className="px-2 py-3">{result.examScore ?? "-"}</td>
                  <td className="px-2 py-3">{result.totalScore ?? "-"}</td>
                  <td className="px-2 py-3">{result.grade ?? "-"}</td>
                  <td className="px-2 py-3">{result.remark ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Class Teacher Comment
            </p>
            <p className="mt-2 text-sm text-slate-700">
              {props.classTeacherComment || "No class teacher comment recorded."}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Principal Comment
            </p>
            <p className="mt-2 text-sm text-slate-700">
              {props.principalComment || "No principal comment recorded."}
            </p>
          </div>
        </div>

        <p className="mt-6 text-xs uppercase tracking-[0.18em] text-slate-500">
          Generated {formatDate(props.generatedAt)}
        </p>
      </div>
    </div>
  );
}
