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
import { Overload } from "@/lib/types"
import { Download, ChevronDown, ChevronUp } from "lucide-react"

interface OverloadTableProps {
  data: Overload[]
  loading: boolean
}

export function OverloadTable({ data, loading }: OverloadTableProps) {
  const [assigneeFilter, setAssigneeFilter] = useState<string>("")
  const [minTasks, setMinTasks] = useState<number>(5)
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

  const assignees = useMemo(() => {
    const set = new Set(data.map((o) => o.assignee))
    return Array.from(set).sort()
  }, [data])

  const filtered = useMemo(() => {
    let result = data
    if (assigneeFilter) {
      result = result.filter((o) => o.assignee === assigneeFilter)
    }
    result = result.filter((o) => o.taskCount >= minTasks)
    return result
  }, [data, assigneeFilter, minTasks])

  const toggleRow = (index: number) => {
    const next = new Set(expandedRows)
    if (next.has(index)) {
      next.delete(index)
    } else {
      next.add(index)
    }
    setExpandedRows(next)
  }

  const exportCSV = () => {
    const header = "Nhân sự,Ngày,Số task,Danh sách task"
    const rows = filtered.map(
      (o) =>
        `${o.assignee},${dayjs(o.date).format("DD/MM/YYYY")},${o.taskCount},"${o.tasks.join("; ")}"`
    )
    const csv = [header, ...rows].join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "overload-report.csv"
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
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">
            Số task tối thiểu:
          </label>
          <input
            type="number"
            min={1}
            value={minTasks}
            onChange={(e) => setMinTasks(Number(e.target.value))}
            className="w-20 rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
          Không có dữ liệu quá tải
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>Nhân sự</TableHead>
              <TableHead>Ngày</TableHead>
              <TableHead className="text-right">Số task</TableHead>
              <TableHead>Danh sách task</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((o, i) => {
              const isExpanded = expandedRows.has(i)
              return (
                <TableRow key={i}>
                  <TableCell>
                    <button
                      onClick={() => toggleRow(i)}
                      className="rounded p-1 hover:bg-muted"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="font-medium">{o.assignee}</TableCell>
                  <TableCell>
                    {dayjs(o.date).format("DD/MM/YYYY")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="destructive">{o.taskCount}</Badge>
                  </TableCell>
                  <TableCell className="max-w-md truncate">
                    {isExpanded ? (
                      <ul className="list-disc space-y-1 pl-4">
                        {o.tasks.map((t, j) => (
                          <li key={j} className="text-sm">
                            {t}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {o.tasks.slice(0, 3).join(", ")}
                        {o.tasks.length > 3 && ", ..."}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
