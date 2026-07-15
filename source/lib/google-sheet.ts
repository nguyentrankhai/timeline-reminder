import { google, sheets_v4 } from "googleapis"
import { Task } from "@/lib/types"
import * as fs from "fs"
import * as path from "path"

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"]

interface ServiceAccountKey {
  client_email: string
  private_key: string
}

function loadCredentials(): ServiceAccountKey {
  const envPath = process.env.GOOGLE_CREDENTIALS_PATH
  if (envPath && fs.existsSync(envPath)) {
    const raw = fs.readFileSync(envPath, "utf-8")
    return JSON.parse(raw) as ServiceAccountKey
  }

  const rootDir = path.resolve(process.cwd(), "..")
  const projectJson = path.join(rootDir, "project", "alfinac-ee977f14fffe.json")
  if (fs.existsSync(projectJson)) {
    const raw = fs.readFileSync(projectJson, "utf-8")
    return JSON.parse(raw) as ServiceAccountKey
  }

  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL
  const privateKey = process.env.GOOGLE_PRIVATE_KEY

  if (!clientEmail || !privateKey) {
    throw new Error(
      "Missing Google credentials. Set GOOGLE_CREDENTIALS_PATH, or place alfinac-ee977f14fffe.json in project/, or set GOOGLE_CLIENT_EMAIL + GOOGLE_PRIVATE_KEY."
    )
  }

  return {
    client_email: clientEmail,
    private_key: privateKey.startsWith("-----BEGIN")
      ? privateKey
      : `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----\n`,
  }
}

function getAuth() {
  const creds = loadCredentials()
  return new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: SCOPES,
  })
}

function getSheetId(): string {
  const sheetId = process.env.GOOGLE_SHEET_ID
  if (!sheetId) {
    throw new Error("Missing GOOGLE_SHEET_ID environment variable")
  }
  return sheetId
}

export async function readSheetRange(
  range: string
): Promise<string[][]> {
  const auth = getAuth()
  const sheets = google.sheets({ version: "v4", auth })
  const sheetId = getSheetId()

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range,
    valueRenderOption: "FORMATTED_VALUE",
  })

  return (response.data.values as string[][]) || []
}

async function readHeaders(): Promise<string[]> {
  const headers = await readSheetRange("Detail Timeline!2:2")
  return headers[0] || []
}

function findColumnIndex(headers: string[], name: string): number {
  return headers.findIndex(
    (h) => h?.trim().toLowerCase() === name.trim().toLowerCase()
  )
}

function parseDate(value: string | undefined): Date | null {
  if (!value || typeof value !== "string") return null
  const trimmed = value.trim()
  if (!trimmed) return null

  const parts = trimmed.split("/")
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10) - 1
    const year = parseInt(parts[2], 10)
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      return new Date(year, month, day)
    }
  }

  const parsed = new Date(trimmed)
  if (!isNaN(parsed.getTime())) return parsed

  return null
}

function parseNumber(value: string | undefined): number {
  if (!value || typeof value !== "string") return 0
  const cleaned = value.trim().replace(/[^0-9.-]/g, "")
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

export async function fetchTasks(): Promise<Task[]> {
  const rows = await readSheetRange("Detail Timeline!3:1000")
  if (rows.length === 0) return []

  const headers = await readHeaders()

  const colIdx = (name: string) => findColumnIndex(headers, name)

  const colTaskName = colIdx("Công việc")
  const colAssignee = colIdx("Người phụ trách")
  const colModule = colIdx("Module")
  const colPriority = colIdx("Độ ưu tiên")
  const colStatus = colIdx("Trạng thái")
  const colProgress = colIdx("%")
  const colStartDate = colIdx("Ngày bắt đầu")
  const colEndDate = colIdx("Ngày kết thúc")
  const colActualEnd = colIdx("Ngày kết thúc thực tế")
  const colJira = colIdx("Mã Jira")
  const colCategory = colIdx("Task Category")

  const tasks: Task[] = []

  for (const row of rows) {
    const taskName = row[colTaskName]?.trim()
    if (!taskName) continue

    const startDate = parseDate(row[colStartDate])
    const endDate = parseDate(row[colEndDate])
    if (!startDate || !endDate) continue

    tasks.push({
      taskName,
      assignee: row[colAssignee]?.trim() || "",
      module: row[colModule]?.trim() || "",
      priority: parseNumber(row[colPriority]),
      status: row[colStatus]?.trim() || "",
      progress: parseNumber(row[colProgress]),
      startDate,
      endDate,
      actualEndDate: parseDate(row[colActualEnd]) || undefined,
      jiraId: row[colJira]?.trim() || undefined,
      category: row[colCategory]?.trim() || undefined,
    })
  }

  return tasks
}
