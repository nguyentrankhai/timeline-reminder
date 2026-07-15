"use client"

import { useMemo, useState } from "react"
import dayjs from "dayjs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FreeTime } from "@/lib/types"
import { Download } from "lucide-react"

interface FreeTimeTableProps {
  data: FreeTime[]
  loading: boolean
}

export function FreeTimeTable({ data, loading }: FreeTimeTableProps) {
  const [assigneeFilter, setAssigneeFilter] = useState<string>("")
  const [sortBy, setSortBy] = useState<"days" | "assignee">("days")

  const assignees = useMemo(() => {
    const set = new Set(data.map((d) => d.assignee))
    return Array.from(set).sort()
  }, [data])

  const filtered = useMemo(() => {
    let result = data
    if (assigneeFilter) {
      result = result.filter((d) => d.assignee === assigneeFilter)
    }
    if (sortBy === "days") {
      result = [...result].sort((a, b) => b.workingDays - a.workingDays)
    }
    return result
  }, [data, assigneeFilter, sortBy])

  const exportCSV = () => {
    const header = "Nhân sự,Từ ngày,Đến ngày,Số ngày làm việc"
    const rows = filtered.map(
      (f) =>
        `${f.assignee},${dayjs(f.from).format("DD/MM/YYYY")},${dayjs(f.to).format("DD/MM/YYYY")},${f.workingDays}`
    )
    const csv = [header, ...rows].join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "free-time-report.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-full animate-pulse rounded bg-muted" />
        <div className="h-64 w-full animate-pulse rounded bg-muted" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
        >
          <option value="">Tất cả nhân sự</option>
          {assignees.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <select
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "days" | "assignee")}
        >
          <option value="days">Sắp xếp theo số ngày</option>
          <option value="assignee">Sắp xếp theo nhân sự</option>
        </select>
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
          Không có dữ liệu
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nhân sự</TableHead>
              <TableHead>Từ ngày</TableHead>
              <TableHead>Đến ngày</TableHead>
              <TableHead className="text-right">Số ngày làm việc</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((f, i) => (
              <TableRow key={i}>
                <TableCell className="font-medium">{f.assignee}</TableCell>
                <TableCell>{dayjs(f.from).format("DD/MM/YYYY")}</TableCell>
                <TableCell>{dayjs(f.to).format("DD/MM/YYYY")}</TableCell>
                <TableCell className="text-right">
                  <Badge variant="secondary">{f.workingDays}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
