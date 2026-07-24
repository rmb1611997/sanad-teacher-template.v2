import * as XLSX from "xlsx"

export function exportToExcel(
  rows: Record<string, string | number>[],
  fileName: string,
  sheetName = "بيانات"
) {
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)

  const colWidths = rows.length > 0
    ? Object.keys(rows[0]).map((key) => ({
        wch: Math.max(key.length, ...rows.map((r) => String(r[key] ?? "").length)) + 4,
      }))
    : []
  ws["!cols"] = colWidths

  const datedName = `${fileName}-${new Date().toLocaleDateString("ar-EG").replace(/\//g, "-")}.xlsx`
  XLSX.writeFile(wb, datedName)
}
