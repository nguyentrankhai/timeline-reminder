# Software Requirement Specification (SRS)

# Hệ thống Dashboard phân tích Timeline từ Google Sheet

---

# 1. Mục tiêu

Xây dựng Dashboard sử dụng **NextJS** để đọc dữ liệu trực tiếp từ Google Sheet và phân tích tải công việc của nhân sự.

Hệ thống chỉ phục vụ xem báo cáo nên **không cần Authentication**.

---

# 2. Công nghệ

## Frontend

- NextJS 15
- React
- TailwindCSS
- shadcn/ui
- TanStack Table
- DayJS

## Backend

Sử dụng **NextJS Route Handler**

```text
app/api/report/route.ts
```

hoặc

```text
app/api/google-sheet/route.ts
```

## Google Services

- Google Sheets API
- Google Service Account
- Google Sheets Readonly API

### Environment Variables

```env
GOOGLE_PROJECT_ID=

GOOGLE_CLIENT_EMAIL=

GOOGLE_PRIVATE_KEY=

GOOGLE_SHEET_ID=
```

---

# 3. Kiến trúc hệ thống

```text
Google Sheet
      │
Google Sheets API
      │
Service Account
      │
NextJS API
      │
Dashboard
```

---

# 4. Luồng xử lý

```text
Dashboard

↓

API gọi Google Sheet

↓

Đọc dữ liệu từ sheet "Detail Timeline"

↓

Chuẩn hóa dữ liệu

↓

Phân tích timeline

↓

Render Dashboard
```

---

# 5. Mapping dữ liệu

| Google Sheet | Model |
|--------------|-------|
| Công việc | taskName |
| Người phụ trách | assignee |
| Module | module |
| Độ ưu tiên | priority |
| Trạng thái | status |
| % | progress |
| Ngày bắt đầu | startDate |
| Ngày kết thúc | endDate |
| Ngày kết thúc thực tế | actualEndDate |
| Mã Jira | jiraId |
| Task Category | category |

## Model

```ts
interface Task {
    taskName: string

    assignee: string

    module: string

    priority: number

    status: string

    progress: number

    startDate: Date

    endDate: Date

    actualEndDate?: Date

    jiraId?: string

    category?: string
}
```

---

# 6. Yêu cầu nghiệp vụ

## 6.1 Danh sách nhân sự

Lấy danh sách nhân sự bằng cách **Distinct** theo cột:

```
Người phụ trách
```

Ví dụ

```
TrinhLT

AnhNT

PhuongNV
```

---

## 6.2 Task chưa hoàn thành

Các task được xem là **đang thực hiện** khi:

```
Status != Hoàn thành
```

Danh sách trạng thái hoàn thành nên được cấu hình để dễ mở rộng.

Ví dụ

```
[
    "Hoàn thành"
]
```

---

## 6.3 Khoảng thời gian phân tích

Khoảng phân tích được xác định từ:

```
Today()
```

đến

```
Max(EndDate)
```

Ví dụ

```
Today

2026-07-01

↓

Max EndDate

2026-11-30
```

---

# 7. Chức năng 1

# Báo cáo thời gian trống của nhân sự

## Mục tiêu

Xác định khoảng thời gian nhân sự **không có task nào được phân công**.

---

## Điều kiện

Chỉ tính:

- Ngày làm việc
- Không tính Thứ 7
- Không tính Chủ nhật
- Không tính ngày lễ

Nguồn ngày lễ có thể lấy từ:

- Sheet Holidays
- Google Calendar Holiday
- File cấu hình JSON

---

## Thuật toán

Ví dụ

```
Task 1

01/07 → 05/07

Task 2

10/07 → 15/07
```

Timeline

```
01 02 03 04 05
██████████████

06 07 08 09

FREE

10 11 12 13 14 15
██████████████
```

Kết quả

```
06/07

07/07

08/07

09/07
```

Nếu có nhiều khoảng

```
06/07 - 09/07

18/07 - 25/07
```

---

## Output

| Nhân sự | Từ ngày | Đến ngày | Số ngày làm việc |
|----------|----------|-----------|------------------|
| TrinhLT | 06/07 | 09/07 | 4 |
| AnhNT | 18/07 | 25/07 | 6 |

---

# 8. Chức năng 2

# Báo cáo quá tải công việc

## Mục tiêu

Một nhân sự được xem là **quá tải** khi:

```
Số task đồng thời > 4
```

---

## Điều kiện

Chỉ tính:

```
Status != Hoàn thành
```

và

```
EndDate >= Today()
```

---

## Thuật toán

Ví dụ

```
Task A

01 → 20

Task B

05 → 18

Task C

08 → 22

Task D

10 → 15

Task E

11 → 17
```

Ngày

```
11
```

Có

```
5 task
```

=> Quá tải

---

## Output

| Nhân sự | Ngày | Số task | Danh sách task |
|----------|------|----------|----------------|
| TrinhLT | 11/07 | 5 | Task A, Task B, Task C, Task D, Task E |

---

# 9. API

## GET

```
GET /api/report
```

## Response

```json
{
  "summary": {
    "totalAssignees": 0,
    "totalTasks": 0,
    "unfinishedTasks": 0,
    "overloadedAssignees": 0,
    "freeTimeSlots": 0
  },
  "freeTimes": [],
  "overloads": []
}
```

---

## FreeTime Model

```ts
interface FreeTime {

    assignee: string

    from: Date

    to: Date

    workingDays: number

}
```

---

## Overload Model

```ts
interface Overload {

    assignee: string

    date: Date

    taskCount: number

    tasks: string[]

}
```

---

# 10. Dashboard

## Dashboard Overview

Hiển thị các chỉ số:

- Tổng số nhân sự
- Tổng số task
- Tổng task chưa hoàn thành
- Tổng nhân sự đang quá tải
- Tổng khoảng thời gian trống

---

## Tab 1 - Free Time

Hiển thị

| Nhân sự | Từ ngày | Đến ngày | Số ngày |
|----------|----------|-----------|----------|

### Chức năng

- Lọc theo nhân sự
- Lọc theo khoảng thời gian
- Sắp xếp theo số ngày trống
- Export CSV

---

## Tab 2 - Overload

Hiển thị

| Nhân sự | Ngày | Số task | Danh sách task |
|----------|------|----------|----------------|

### Chức năng

- Lọc theo nhân sự
- Lọc theo số lượng task
- Xem chi tiết các task đang chồng lấp
- Export CSV

---

# 11. Thuật toán đề xuất

## 11.1 Phân tích thời gian trống

### Bước 1

Nhóm task theo:

```
assignee
```

### Bước 2

Loại bỏ các task đã hoàn thành (nếu chỉ muốn đánh giá khối lượng công việc còn lại).

### Bước 3

Sắp xếp theo:

```
startDate ASC
```

### Bước 4

Merge các khoảng thời gian giao nhau.

Ví dụ

```
01 → 05

03 → 08

↓

01 → 08
```

### Bước 5

So sánh với khoảng:

```
Today()

↓

Max EndDate
```

để tìm khoảng trống.

### Bước 6

Loại bỏ:

- Thứ 7
- Chủ nhật
- Ngày lễ

Sau đó tính số ngày làm việc.

### Độ phức tạp

```
O(n log n)
```

---

## 11.2 Phân tích quá tải

### Bước 1

Nhóm task theo:

```
assignee
```

### Bước 2

Duyệt từng ngày làm việc.

### Bước 3

Lấy các task thỏa điều kiện:

```
startDate <= currentDate <= endDate
```

và

```
Status != Hoàn thành
```

### Bước 4

Đếm số lượng task.

Nếu

```
taskCount > 4
```

thì ghi nhận quá tải.

### Bước 5 (Tùy chọn)

Gộp các ngày liên tiếp có cùng trạng thái quá tải thành một khoảng.

Ví dụ

```
10/07

11/07

12/07

↓

10/07 - 12/07
```

### Độ phức tạp

```
O(a × d × t)
```

Trong đó:

- `a`: số nhân sự
- `d`: số ngày làm việc
- `t`: số task trung bình của mỗi nhân sự

Đối với quy mô vài nghìn task trên Google Sheet, thuật toán đáp ứng tốt cho dashboard nội bộ.

Nếu dữ liệu tăng lên hàng chục nghìn task, có thể tối ưu bằng thuật toán **Line Sweep (Event-based)** để giảm chi phí tính toán xuống gần:

```
O(n log n)
```