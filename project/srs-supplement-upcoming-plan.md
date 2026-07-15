# SRS Bổ sung: Tab "Kế hoạch tiếp theo"

> Bổ sung cho tài liệu SRS chính tại `project/srs.md`
> Mục lục: tính năng này nằm ở **mục 12** (kế thừa các mục 1-11 của SRS gốc).

---

# 12. Chức năng 3

# Tab "Kế hoạch tiếp theo"

## 12.1 Mục tiêu

Cung cấp góc nhìn tổng quan về các công việc sắp tới của từng nhân sự, giúp trả lời câu hỏi:

- **Ngày mai làm gì?**
- **Công việc nào sắp đến hạn mà chưa hoàn thành?**
- **Công việc nào sắp phải bắt đầu?**
- **Công việc nào đã quá hạn?**

Mỗi nhân sự có thể xem danh sách công việc được phân loại theo mức độ khẩn cấp, ưu tiên theo thời gian còn lại.

---

## 12.2 Model

```ts
interface UpcomingPlan {
  assignee: string
  taskName: string
  module: string
  status: string
  progress: number
  priority: number
  startDate: Date
  endDate: Date
  actualEndDate?: Date
  jiraId?: string
  category?: string

  // Computed fields
  category: UpcomingCategory
  daysUntilStart: number   // Âm nếu đã bắt đầu
  daysUntilEnd: number     // Âm nếu đã quá hạn
}

type UpcomingCategory =
  | "overdue"        // Quá hạn
  | "ending-soon"    // Sắp kết thúc
  | "starting-soon"  // Sắp bắt đầu
  | "active"         // Đang thực hiện
```

## 12.3 Categories & Điều kiện

Tất cả tính theo `Today()`. Các category được **ưu tiên** theo thứ tự dưới đây (một task chỉ thuộc **một** category duy nhất - category có độ ưu tiên cao nhất được chọn).

| STT | Category | value | Điều kiện | Ý nghĩa |
|-----|----------|-------|-----------|---------|
| 1 | Quá hạn | `overdue` | `endDate < Today()` AND `status != Hoàn thành` | Công việc đã quá hạn, cần xử lý gấp |
| 2 | Sắp kết thúc | `ending-soon` | `Today() <= endDate <= Today() + 7` AND `status != Hoàn thành` | Công việc sắp đến hạn trong 7 ngày tới |
| 3 | Sắp bắt đầu | `starting-soon` | `Today() <= startDate <= Today() + 7` | Công việc sắp bắt đầu trong 7 ngày tới |
| 4 | Đang thực hiện | `active` | `startDate <= Today() <= endDate` AND `status != Hoàn thành` AND không thuộc 3 category trên | Công việc đang làm, không quá hạn và còn > 7 ngày |

### Giải thích

- **overdue**: Task đã quá hạn nhưng chưa hoàn thành → được ưu tiên cao nhất.
- **ending-soon**: Task chưa hoàn thành và còn hạn trong vòng 7 ngày.
- **starting-soon**: Task sắp bắt đầu trong vòng 7 ngày (bất kể trạng thái, vì cần chuẩn bị).
- **active**: Task đang trong thời gian thực hiện, không thuộc các trường hợp khẩn cấp trên.

### Cấu hình linh hoạt

Số ngày (7) cho `ending-soon` và `starting-soon` nên được đặt trong config để dễ thay đổi:

```ts
{
  upcomingWindowDays: 7
}
```

---

## 12.4 Thuật toán

### Bước 1: Lấy tất cả task

Không lọc theo trạng thái (vẫn hiển thị task đã hoàn thành ở category `starting-soon` nếu sắp bắt đầu, nhưng có thể xem xét lọc bỏ task hoàn thành nếu cần).

Tuy nhiên, task đã hoàn thành sẽ **không** xuất hiện ở category `overdue`, `ending-soon`, `active`. Chỉ xuất hiện ở `starting-soon` nếu ngày bắt đầu trong tương lai gần.

### Bước 2: Xác định category cho mỗi task

Duyệt từng task, kiểm tra lần lượt các điều kiện từ 1 → 4 (xem 12.3). Dừng lại ở điều kiện đầu tiên thỏa mãn.

```text
Với mỗi task:
  1. Nếu endDate < today && status != "Hoàn thành"
     → category = "overdue"
  2. Nếu today <= endDate <= today + 7 && status != "Hoàn thành"
     → category = "ending-soon"
  3. Nếu today <= startDate <= today + 7
     → category = "starting-soon"
  4. Nếu startDate <= today <= endDate && status != "Hoàn thành"
     → category = "active"
  5. Ngược lại → bỏ qua (không hiển thị)
```

### Bước 3: Tính các trường computed

```text
daysUntilStart = startDate - today   // số ngày, âm nếu đã bắt đầu
daysUntilEnd   = endDate - today     // số ngày, âm nếu đã quá hạn
```

### Bước 4: Sắp xếp

```text
1. Nhóm theo assignee (A-Z)
2. Trong mỗi nhóm, sắp xếp theo:
   a. Category priority (overdue → ending-soon → starting-soon → active)
   b. daysUntilEnd ASC (việc gấp hơn lên trước)
   c. Priority DESC (ưu tiên cao hơn lên trước)
```

### Độ phức tạp

```
O(n)
```
Trong đó `n` là tổng số task.

---

## 12.5 Output

### API Response

Thêm trường `upcomingPlans: UpcomingPlan[]` vào `ReportResponse`:

```json
{
  "summary": { ... },
  "freeTimes": [ ... ],
  "overloads": [ ... ],
  "upcomingPlans": [ ... ]       // ← Mới
}
```

### Cập nhật ReportSummary

```ts
interface ReportSummary {
  totalAssignees: number
  totalTasks: number
  unfinishedTasks: number
  overloadedAssignees: number
  freeTimeSlots: number
  overdueTasks: number           // ← Mới: tổng số task quá hạn
  upcomingPlansCount: number     // ← Mới: tổng số task trong kế hoạch tiếp theo
}
```

### Dashboard hiển thị

#### Overview Cards

Thêm 2 card mới bên cạnh các card hiện có:

| Card | Màu | Icon | Giá trị |
|------|-----|------|---------|
| Quá hạn | red | AlertCircle | `overdueTasks` |
| Việc sắp tới | blue | CalendarDays | `upcomingPlansCount` |

#### Bảng dữ liệu

| Nhân sự | Công việc | Module | Trạng thái | % | Ngày bắt đầu | Ngày kết thúc | Phân loại | Còn lại |
|----------|-----------|--------|------------|---|-------------|---------------|-----------|---------|
| TrinhLT | Task A | Module 1 | Đang làm | 60% | 01/07 | 10/07 | Quá hạn | -5 ngày |
| TrinhLT | Task B | Module 2 | Chưa làm | 0% | 15/07 | 20/07 | Sắp kết thúc | 5 ngày |
| AnhNT | Task C | Module 1 | Chưa làm | 0% | 12/07 | 18/07 | Sắp bắt đầu | +2 ngày |

Cột **Phân loại** hiển thị dạng Badge với màu sắc tương ứng:

| Category | Badge màu |
|----------|-----------|
| Quá hạn | Red (destructive) |
| Sắp kết thúc | Orange (warning) |
| Sắp bắt đầu | Blue (info) |
| Đang thực hiện | Green (success) |

Cột **Còn lại** hiển thị số ngày:

- `-5 ngày` (âm, màu đỏ) → quá hạn 5 ngày
- `+5 ngày` (dương) → còn 5 ngày
- `Hôm nay` → đến hạn hôm nay
- `+0 ngày` → bắt đầu hôm nay

---

## 12.6 Chức năng

### Filter

| Bộ lọc | Mô tả |
|--------|-------|
| Nhân sự | Lọc theo dropdown, mặc định "Tất cả" |
| Category | Lọc theo category (checkbox hoặc select): Tất cả / Quá hạn / Sắp kết thúc / Sắp bắt đầu / Đang thực hiện |
| Tìm kiếm | Ô input tìm kiếm theo tên task (text search, không phân biệt hoa thường) |

### Export CSV

- Nút Export CSV ở góc phải
- Format: `Nhân sự,Công việc,Module,Trạng thái,%,Ngày bắt đầu,Ngày kết thúc,Phân loại,Còn lại (ngày)`
- File name: `upcoming-plan-report.csv`

### States

| State | Hiển thị |
|-------|----------|
| Loading | Skeleton loading (giống các tab khác) |
| Empty | "Không có kế hoạch tiếp theo" |
| Error | Hiển thị ở component con với retry, hoặc dùng error state chung của page |

---

## 12.7 Cập nhật API

### File: `app/api/report/route.ts`

Import thêm `analyzeUpcomingPlan` và gọi trong `GET()`:

```ts
import { analyzeUpcomingPlan } from "@/lib/analyze/upcoming-plan"

// Trong GET():
const upcomingPlans = analyzeUpcomingPlan(tasks, today)
```

### File mới: `lib/analyze/upcoming-plan.ts`

Implement thuật toán tại mục 12.4.

Tham số:

```ts
export function analyzeUpcomingPlan(
  tasks: Task[],
  today: Date,
  windowDays: number = 7
): UpcomingPlan[]
```

### Cập nhật `ReportResponse`

```ts
interface ReportResponse {
  summary: ReportSummary
  freeTimes: FreeTime[]
  overloads: Overload[]
  upcomingPlans: UpcomingPlan[]   // ← Mới
}
```

### Cập nhật `ReportSummary`

```ts
interface ReportSummary {
  totalAssignees: number
  totalTasks: number
  unfinishedTasks: number
  overloadedAssignees: number
  freeTimeSlots: number
  overdueTasks: number            // ← Mới
  upcomingPlansCount: number      // ← Mới
}
```

---

## 12.8 Cập nhật Dashboard

### File: `app/page.tsx`

- Thêm `TabsTrigger` mới: `value="upcoming"`
- Thêm `TabsContent` và render component `<UpcomingPlanTable>`
- Truyền `data?.upcomingPlans ?? []` và `loading`
- Cập nhật `OverviewCards` với 2 card mới

### File mới: `components/dashboard/upcoming-plan-table.tsx`

Component `UpcomingPlanTable`:

- Props: `data: UpcomingPlan[]`, `loading: boolean`
- Filter: nhân sự, category, tìm kiếm
- Sort: theo thứ tự ưu tiên (mục 12.4 Bước 4)
- Export CSV
- Loading skeleton
- Empty state: "Không có kế hoạch tiếp theo"

### Cập nhật `config/sheets.ts`

```ts
{
  upcomingWindowDays: 7
}
```

---

## 12.9 Giao diện tham khảo

```
┌──────────────────────────────────────────────────────┐
│ [Tất cả nhân sự ▼] [Phân loại: Tất cả ▼] [🔍 Tìm...] │  [Export CSV]
├────────┬────────┬────────┬──────┬────┬────────┬──────┤
│ Nhân sự│ Công v.│ Module │ %    │ BD │ KT     │ PL   │
├────────┼────────┼────────┼──────┼────┼────────┼──────┤
│ Trinh  │ Task A │ Mod 1  │ 60%  │1/7 │10/7   │🔴 QH │
│ Trinh  │ Task B │ Mod 2  │ 0%   │15/7│20/7   │🟠 SKT│
│ AnhNT  │ Task C │ Mod 1  │ 0%   │12/7│18/7   │🔵 SBD│
│ Phuong │ Task D │ Mod 3  │ 80%  │1/6 │30/8   │🟢 DTH│
└────────┴────────┴────────┴──────┴────┴────────┴──────┘

PL = Phân loại:
  🔴 Quá hạn  🟠 Sắp kết thúc  🔵 Sắp bắt đầu  🟢 Đang thực hiện
```

---

## 12.10 Test cases

| # | Kịch bản | Expected |
|---|----------|----------|
| 1 | Task quá hạn 5 ngày, chưa hoàn thành | Category = `overdue`, `daysUntilEnd = -5` |
| 2 | Task đến hạn hôm nay, chưa hoàn thành | Category = `ending-soon`, `daysUntilEnd = 0` |
| 3 | Task còn 3 ngày, chưa hoàn thành | Category = `ending-soon`, `daysUntilEnd = 3` |
| 4 | Task bắt đầu sau 3 ngày, chưa làm | Category = `starting-soon`, `daysUntilStart = 3` |
| 5 | Task đang làm, còn 10 ngày | Category = `active`, `daysUntilEnd = 10` |
| 6 | Task đã hoàn thành, ngày kết thúc cũ | Không hiển thị (không thuộc category nào) |
| 7 | Task quá hạn nhưng đã hoàn thành | Không hiển thị |
| 8 | Task bắt đầu hôm nay | Category = `starting-soon`, `daysUntilStart = 0` |
| 9 | Cảnh báo: task vừa quá hạn vừa sắp kết thúc | Chỉ hiển thị `overdue` (ưu tiên cao hơn) |

---

*Hết tài liệu bổ sung*
