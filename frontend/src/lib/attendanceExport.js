import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"

import { attendanceStatusLabels, formatDisplayDate } from "@/data/mockAttendance"

const statusLabels = attendanceStatusLabels

const EXCEL_HEADERS = [
  "Student ID",
  "Name",
  "Date",
  "AM Time In",
  "AM Time Out",
  "AM Status",
  "PM Time In",
  "PM Time Out",
  "PM Status",
  "Hours",
]

function formatTimeForExport(value) {
  return value && value !== "—" ? value : ""
}

function getPdfExportRows(records) {
  return records.map((record) => [
    record.studentId,
    record.name,
    formatDisplayDate(record.date),
    record.amTimeIn,
    record.amTimeOut,
    statusLabels[record.amStatus] ?? record.amStatus,
    record.pmTimeIn,
    record.pmTimeOut,
    statusLabels[record.pmStatus] ?? record.pmStatus,
    record.hours > 0 ? `${record.hours}h` : "—",
  ])
}

function getExcelExportRows(records) {
  return records.map((record) => ({
    "Student ID": String(record.studentId),
    Name: record.name,
    Date: formatDisplayDate(record.date),
    "AM Time In": formatTimeForExport(record.amTimeIn),
    "AM Time Out": formatTimeForExport(record.amTimeOut),
    "AM Status": statusLabels[record.amStatus] ?? record.amStatus,
    "PM Time In": formatTimeForExport(record.pmTimeIn),
    "PM Time Out": formatTimeForExport(record.pmTimeOut),
    "PM Status": statusLabels[record.pmStatus] ?? record.pmStatus,
    Hours: record.hours > 0 ? record.hours : 0,
  }))
}

function getExportFilename(prefix, extension) {
  const stamp = new Date().toISOString().slice(0, 10)
  return `${prefix}-${stamp}.${extension}`
}

export function exportAttendanceExcel(records) {
  const rows = getExcelExportRows(records)
  const worksheet = XLSX.utils.json_to_sheet(rows, { header: EXCEL_HEADERS })

  worksheet["!cols"] = [
    { wch: 14 },
    { wch: 28 },
    { wch: 16 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 8 },
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance")

  XLSX.writeFile(workbook, getExportFilename("attendance", "xlsx"))
}

export function exportAttendancePdf(records) {
  const doc = new jsPDF({ orientation: "landscape" })

  doc.setFontSize(14)
  doc.text("Attendance Records", 14, 16)
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`Generated on ${new Date().toLocaleString("en-PH")}`, 14, 23)
  doc.setTextColor(0)

  autoTable(doc, {
    startY: 28,
    head: [[
      "Student ID",
      "Name",
      "Date",
      "AM In",
      "AM Out",
      "AM Status",
      "PM In",
      "PM Out",
      "PM Status",
      "Hours",
    ]],
    body: getPdfExportRows(records),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [124, 58, 237] },
    alternateRowStyles: { fillColor: [245, 243, 255] },
  })

  doc.save(getExportFilename("attendance", "pdf"))
}
