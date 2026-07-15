"use client"

import { useEffect, useState, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OverviewCards } from "@/components/dashboard/overview-cards"
import { FreeTimeTable } from "@/components/dashboard/free-time-table"
import { OverloadTable } from "@/components/dashboard/overload-table"
import { UpcomingPlanTable } from "@/components/dashboard/upcoming-plan-table"
import { ReportResponse } from "@/lib/types"
import { BarChart3, RefreshCw } from "lucide-react"

export default function DashboardPage() {
  const [data, setData] = useState<ReportResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/report")
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to fetch report")
      }
      const json: ReportResponse = await res.json()
      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold">
              Logistics Timeline Dashboard
            </h1>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Làm mới
          </button>
        </div>
      </header>

      <main className="container py-8">
        {error ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-destructive/50 bg-destructive/10 p-12">
            <p className="text-lg font-medium text-destructive">
              Lỗi kết nối dữ liệu
            </p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <button
              onClick={fetchData}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <>
            <OverviewCards
              summary={data?.summary ?? null}
              loading={loading}
            />

            <div className="mt-8">
              <Tabs defaultValue="free-time">
                <TabsList>
                  <TabsTrigger value="free-time">
                    Thời gian trống
                  </TabsTrigger>
                  <TabsTrigger value="overload">
                    Quá tải công việc
                  </TabsTrigger>
                  <TabsTrigger value="upcoming">
                    Kế hoạch tiếp theo
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="free-time">
                  <FreeTimeTable
                    data={data?.freeTimes ?? []}
                    loading={loading}
                  />
                </TabsContent>
                <TabsContent value="overload">
                  <OverloadTable
                    data={data?.overloads ?? []}
                    loading={loading}
                  />
                </TabsContent>
                <TabsContent value="upcoming">
                  <UpcomingPlanTable
                    data={data?.upcomingPlans ?? []}
                    loading={loading}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </>
        )}
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        Logistics Timeline Dashboard &copy; {new Date().getFullYear()}
      </footer>
    </div>
  )
}
