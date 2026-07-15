# Software Requirement Specification (SRS)

# Timeline Management Dashboard

Version: 1.0

---

# 1. Overview

## 1.1 Objective

Xây dựng hệ thống Web Dashboard đọc dữ liệu Timeline từ Google Spreadsheet và sinh ra các báo cáo quản lý tiến độ dự án theo thời gian thực.

Hệ thống chỉ đóng vai trò:

* Read-only
* Phân tích Timeline
* Dashboard
* Thống kê Resource
* Cảnh báo

Không chỉnh sửa dữ liệu trên Google Sheet.

Google Sheet vẫn là **Single Source Of Truth**.

---

# 2. System Architecture

```
Google Spreadsheet
        │
        │ Google API
        ▼
Sync Service
        │
        ▼
Memory Cache (Server)

        │

REST API

        │

NextJS Dashboard
```

Project sử dụng:

* NextJS 15
* Typescript
* App Router
* Tailwind
* shadcn/ui
* React Query
* Node Cache

Không sử dụng Database.

Dữ liệu chỉ lưu trong Memory Cache.

---

# 3. Configuration

Thông qua file `.env`

```
GOOGLE_SERVICE_ACCOUNT=
GOOGLE_PRIVATE_KEY=
GOOGLE_SHEET_ID=

GOOGLE_SHEET_NAME=Detail Timeline

CACHE_REFRESH_MINUTE=15

MAX_PARALLEL_TASK=4
```

---

# 4. Data Source

Nguồn dữ liệu:

Google Spreadsheet

Sheet Name mặc định:

```
Detail Timeline
```

Tên sheet có thể thay đổi thông qua ENV.

Nếu sheet không tồn tại

→ Sync Failed

---

# 5. Google API

Authentication

Service Account

Permission

Read Only

API

```
Google Sheets API
```

---

# 6. Data Loading

## Startup

Khi server khởi động

```
Load Sheet
↓

Parse

↓

Validate

↓

Cache
```

---

## Manual Reload

Dashboard có nút

```
Reload
```

Thực hiện

```
Google API

↓

Reload Cache
```

Không restart server.

---

## Auto Reload

Cron

```
Every 15 minutes
```

Flow

```
Read Sheet

↓

Replace Cache

↓

Done
```

Không merge dữ liệu.

Luôn replace toàn bộ cache.

---

# 7. Timeline Data Model

Đọc toàn bộ sheet.

Header nằm ở dòng 2.

Các dòng dữ liệu bắt đầu từ dòng 3.

Các cột được sử dụng:

| Sheet Column          | Meaning       |
| --------------------- | ------------- |
| Mapping               | Mapping Code  |
| Module                | Module        |
| Công việc             | Task Name     |
| Độ ưu tiên            | Priority      |
| Người phụ trách       | Assignee      |
| Trạng thái            | Status        |
| %                     | Progress      |
| Ngày bắt đầu          | Start Date    |
| Ngày kết thúc         | End Date      |
| Ngày kết thúc thực tế | Actual Finish |
| Mã Jira               | Jira ID       |
| Task Category         | Category      |

Các cột khác bỏ qua.

---

# 8. Ignore Rules

Các dòng sau không được xem là Task:

Người phụ trách = empty

hoặc

Ngày bắt đầu = empty

hoặc

Ngày kết thúc = empty

hoặc

Task Name = empty

---

# 9. Cache Model

```
TimelineCache
```

```
tasks[]

lastReload

version
```

Task Object

```
{
    mapping

    module

    taskName

    assignee

    priority

    status

    progress

    startDate

    endDate

    actualFinish

    jira

    category
}
```

---

# 10. Dashboard

Dashboard gồm 4 widget chính.

---

## Widget 1

### Resource Availability

Mục tiêu

Tính khoảng thời gian rảnh của từng nhân sự.

Thuật toán

Lấy Current Date

↓

Tìm Task cuối cùng của User

↓

Sắp xếp theo End Date

↓

Lấy End Date lớn nhất

↓

Idle Day

```
EndDate - Today
```

Ví dụ

```
Today

10/03

Task cuối

30/03

Idle

20 ngày
```

Nếu không có Task

```
Available Now
```

Hiển thị

| User | Last Task End | Free After | Remaining Days |

---

## Widget 2

### Parallel Task Analyzer

Mục tiêu

Tìm user đang làm quá nhiều task cùng lúc.

Rule

Hai Task overlap nếu

```
Task A

Start <= TaskB.End

AND

End >= TaskB.Start
```

Đếm số lượng Task overlap theo từng ngày.

Nếu

```
Overlap >

MAX_PARALLEL_TASK
```

Sinh Warning.

Default

```
4
```

Ví dụ

```
NguyenTK

05/03

6 Tasks
```

Warning

```
Overloaded
```

Hiển thị

| User | Date | Parallel Tasks |

---

## Widget 3

### Upcoming Deadline

Task

```
Status != Hoàn thành

AND

EndDate <= Today + 3
```

Rule

3 ngày mặc định.

Có thể config.

Sort

```
Nearest Deadline
```

---

## Widget 4

### Overdue

Task

```
Status != Hoàn thành

AND

EndDate < Today
```

Sort

Quá hạn nhiều nhất.

---

# 11. Status Mapping

Hoàn thành

```
Hoàn thành

Done

Completed
```

Review

```
Chờ review

Review
```

In Progress

```
Đang thực hiện

Doing

Progress
```

Pending

```
Pending

Todo
```

AI Agent phải normalize Status trước khi xử lý.

---

# 12. APIs

---

## GET

```
/api/dashboard
```

Response

```
{
    summary,

    resources,

    overload,

    overdue,

    upcoming,

    lastReload
}
```

---

## GET

```
/api/tasks
```

Query

```
user=

status=

module=
```

---

## POST

```
/api/reload
```

Function

Reload Google Sheet.

Response

```
{
success:true,

reloadTime
}
```

---

## GET

```
/api/system
```

Response

```
{
cacheVersion,

lastReload,

sheetName,

sheetId,

taskCount
}
```

---

# 13. UI

Sidebar

```
Dashboard

Tasks

System
```

Dashboard

```
Summary Card

↓

Resource Availability

↓

Overloaded Resource

↓

Upcoming Deadline

↓

Overdue
```

Tasks

Data Grid

Search

Filter

Sort

---

# 14. Error Handling

Google API Timeout

```
Keep Old Cache
```

Google API Failed

```
Keep Old Cache

Show Banner
```

Invalid Sheet

```
Reload Failed
```

Empty Sheet

```
No Data
```

---

# 15. Logging

Log

```
Reload Started

Reload Finished

Task Count

Reload Duration

Google API Error

Validation Error
```

---

# 16. Non-functional Requirements

| Item           | Requirement                   |
| -------------- | ----------------------------- |
| Response Time  | < 500 ms (cache hit)          |
| Google Sync    | < 10 s                        |
| Cache Refresh  | 15 phút                       |
| Availability   | ≥ 99%                         |
| Memory         | < 300 MB                      |
| Database       | Không sử dụng                 |
| Authentication | Không yêu cầu (phiên bản đầu) |

---

# 17. Acceptance Criteria

### AC-01

Server khởi động phải tải thành công dữ liệu từ Google Sheet và lưu vào Memory Cache.

### AC-02

Người dùng có thể nhấn **Reload** để đồng bộ dữ liệu mới mà không cần khởi động lại server.

### AC-03

Hệ thống tự động đồng bộ lại dữ liệu mỗi 15 phút.

### AC-04

Dashboard hiển thị chính xác:

* Thời gian rảnh của từng nhân sự.
* Danh sách nhân sự có số task song song vượt ngưỡng cấu hình.
* Danh sách công việc sắp đến hạn (mặc định trong 3 ngày) nhưng chưa hoàn thành.
* Danh sách công việc quá hạn chưa hoàn thành.

### AC-05

Khi Google API lỗi hoặc Google Sheet không truy cập được, hệ thống vẫn tiếp tục phục vụ dữ liệu từ cache hiện có và ghi log lỗi.

### AC-06

Tất cả các phép tính chỉ sử dụng các dòng hợp lệ theo quy tắc lọc (đủ Assignee, Start Date, End Date và Task Name).

---

## Khuyến nghị mở rộng

Từ cấu trúc timeline hiện tại trong file Excel, mình khuyến nghị bổ sung các tính năng ngay từ đầu vì AI Agent sẽ dễ thiết kế kiến trúc mở rộng:

* **Timeline Gantt View**: hiển thị Gantt theo từng nhân sự hoặc module.
* **Workload Heatmap**: ma trận User × Ngày, tô màu theo số lượng task đồng thời.
* **Module Progress Dashboard**: % hoàn thành theo từng module và mốc (Milestone).
* **Critical Path Detection**: xác định chuỗi công việc ảnh hưởng trực tiếp đến ngày hoàn thành dự án.
* **Slack/Telegram/Email Notification**: cảnh báo tự động khi có task sắp đến hạn hoặc quá hạn.
* **Jira Hyperlink**: nếu có `Mã Jira`, tạo liên kết trực tiếp tới ticket để theo dõi. Đây là các tính năng có thể được thiết kế dưới dạng module mà không cần thay đổi kiến trúc hiện tại.
