import nodemailer from 'nodemailer';
import logger from './logger.js';
import { formatDate } from './task-checker.js';

export function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT, 10) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !user || !pass) {
    throw new Error('SMTP configuration incomplete. Check SMTP_HOST, SMTP_USER, SMTP_PASSWORD.');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export function getRecipients() {
  const emails = process.env.NOTIFICATION_EMAILS;
  if (!emails) {
    throw new Error('NOTIFICATION_EMAILS not configured');
  }
  return emails.split(',').map(e => e.trim()).filter(Boolean);
}

export function buildEmailHtml(result) {
  const { dueToday, upcoming, overdue, today } = result;
  const hasDueToday = dueToday.length > 0;
  const hasUpcoming = upcoming.length > 0;
  const hasOverdue = overdue.length > 0;

  const statusColors = {
    'Hoàn thành': '#4CAF50',
    'Đang thực hiện': '#2196F3',
    'Chưa thực hiện': '#FF9800',
  };

  function rowColor(task) {
    return statusColors[task.status] || '#9E9E9E';
  }

  function taskRows(taskList) {
    return taskList.map(t => `
      <tr>
        <td style="padding:8px;border:1px solid #ddd;max-width:250px">${escapeHtml(t.taskName)}</td>
        <td style="padding:8px;border:1px solid #ddd">${escapeHtml(t.module)}</td>
        <td style="padding:8px;border:1px solid #ddd">${t.priority || '-'}</td>
        <td style="padding:8px;border:1px solid #ddd">${escapeHtml(t.assignee) || '-'}</td>
        <td style="padding:8px;border:1px solid #ddd">
          <span style="display:inline-block;padding:2px 8px;border-radius:4px;color:#fff;background-color:${rowColor(t)};font-size:12px">
            ${escapeHtml(t.status)}
          </span>
        </td>
        <td style="padding:8px;border:1px solid #ddd">${t.startDateStr || '-'}</td>
        <td style="padding:8px;border:1px solid #ddd;font-weight:${t.daysRemaining <= 0 ? 'bold' : 'normal'};color:${t.daysRemaining <= 0 ? '#f44336' : t.daysRemaining <= 3 ? '#FF9800' : 'inherit'}">
          ${t.endDateStr || '-'}
        </td>
        <td style="padding:8px;border:1px solid #ddd;text-align:center;">
          ${t.daysRemaining !== null ? (t.daysRemaining <= 0 ? '<strong style="color:#f44336">Hôm nay</strong>' : t.daysRemaining === 0 ? 'Hôm nay' : `${t.daysRemaining} ngày`) : '-'}
        </td>
      </tr>
    `).join('\n');
  }

  const sectionStyle = 'margin:24px 0;padding:16px;border-radius:8px';

  const sections = [];

  if (hasOverdue) {
    sections.push(`
      <div style="${sectionStyle};background-color:#FFF3E0;border:1px solid #FFCC80">
        <h2 style="color:#E65100;margin:0 0 12px 0">⚠️ Công việc quá hạn</h2>
        <p style="color:#BF360C;margin:0 0 12px 0">Các công việc sau đã quá hạn nhưng chưa hoàn thành:</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead>
            <tr style="background-color:#FFCC80">
              <th style="padding:8px;border:1px solid #ddd;text-align:left">Công việc</th>
              <th style="padding:8px;border:1px solid #ddd;text-align:left">Module</th>
              <th style="padding:8px;border:1px solid #ddd;text-align:left">Ưu tiên</th>
              <th style="padding:8px;border:1px solid #ddd;text-align:left">Người phụ trách</th>
              <th style="padding:8px;border:1px solid #ddd;text-align:left">Trạng thái</th>
              <th style="padding:8px;border:1px solid #ddd;text-align:left">Ngày bắt đầu</th>
              <th style="padding:8px;border:1px solid #ddd;text-align:left">Ngày kết thúc</th>
              <th style="padding:8px;border:1px solid #ddd;text-align:center">Số ngày</th>
            </tr>
          </thead>
          <tbody>
            ${taskRows(overdue)}
          </tbody>
        </table>
      </div>
    `);
  }

  if (hasDueToday) {
    sections.push(`
      <div style="${sectionStyle};background-color:#E8F5E9;border:1px solid #A5D6A7">
        <h2 style="color:#2E7D32;margin:0 0 12px 0">📅 Công việc đến hạn hôm nay (${today})</h2>
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead>
            <tr style="background-color:#A5D6A7">
              <th style="padding:8px;border:1px solid #ddd;text-align:left">Công việc</th>
              <th style="padding:8px;border:1px solid #ddd;text-align:left">Module</th>
              <th style="padding:8px;border:1px solid #ddd;text-align:left">Ưu tiên</th>
              <th style="padding:8px;border:1px solid #ddd;text-align:left">Người phụ trách</th>
              <th style="padding:8px;border:1px solid #ddd;text-align:left">Trạng thái</th>
              <th style="padding:8px;border:1px solid #ddd;text-align:left">Ngày bắt đầu</th>
              <th style="padding:8px;border:1px solid #ddd;text-align:left">Ngày kết thúc</th>
              <th style="padding:8px;border:1px solid #ddd;text-align:center">Hạn</th>
            </tr>
          </thead>
          <tbody>
            ${taskRows(dueToday)}
          </tbody>
        </table>
      </div>
    `);
  }

  if (hasUpcoming) {
    sections.push(`
      <div style="${sectionStyle};background-color:#E3F2FD;border:1px solid #90CAF9">
        <h2 style="color:#1565C0;margin:0 0 12px 0">🔜 Công việc sắp đến hạn (3 ngày tới)</h2>
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead>
            <tr style="background-color:#90CAF9">
              <th style="padding:8px;border:1px solid #ddd;text-align:left">Công việc</th>
              <th style="padding:8px;border:1px solid #ddd;text-align:left">Module</th>
              <th style="padding:8px;border:1px solid #ddd;text-align:left">Ưu tiên</th>
              <th style="padding:8px;border:1px solid #ddd;text-align:left">Người phụ trách</th>
              <th style="padding:8px;border:1px solid #ddd;text-align:left">Trạng thái</th>
              <th style="padding:8px;border:1px solid #ddd;text-align:left">Ngày bắt đầu</th>
              <th style="padding:8px;border:1px solid #ddd;text-align:left">Ngày kết thúc</th>
              <th style="padding:8px;border:1px solid #ddd;text-align:center">Còn lại</th>
            </tr>
          </thead>
          <tbody>
            ${taskRows(upcoming)}
          </tbody>
        </table>
      </div>
    `);
  }

  if (!hasDueToday && !hasUpcoming && !hasOverdue) {
    sections.push(`
      <div style="${sectionStyle};background-color:#F5F5F5;border:1px solid #E0E0E0;text-align:center">
        <p style="color:#757575;margin:0;font-size:16px">🎉 Không có công việc nào đến hạn trong hôm nay hoặc 3 ngày tới.</p>
      </div>
    `);
  }

  const now = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Segoe UI,Arial,sans-serif;margin:0;padding:0;background-color:#f5f5f5">
  <div style="max-width:900px;margin:0 auto;padding:20px">
    <div style="background:linear-gradient(135deg,#1a237e,#283593);color:#fff;padding:24px;border-radius:12px 12px 0 0">
      <h1 style="margin:0;font-size:22px">📋 Báo cáo tiến độ công việc</h1>
      <p style="margin:8px 0 0;opacity:0.9">Timeline Logistics - Cập nhật lúc ${now}</p>
    </div>
    <div style="background:#fff;padding:20px;border-radius:0 0 12px 12px;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
      ${sections.join('\n')}
    </div>
    <div style="text-align:center;padding:16px;color:#999;font-size:12px">
      <p>Đây là email tự động từ Hệ thống nhắc việc Timeline Logistics.</p>
      <p>${new Date().toLocaleDateString('vi-VN')}</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export async function sendEmail(html, result) {
  const transporter = createTransporter();
  const recipients = getRecipients();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  const dueCount = result.dueToday.length;
  const upcomingCount = result.upcoming.length;
  const overdueCount = result.overdue.length;

  let subject = `[Timeline Logistics] Báo cáo công việc - ${formatDate(new Date(), 'DD/MM/YYYY')}`;
  if (overdueCount > 0) {
    subject = `[CẢNH BÁO] ${subject} - ${overdueCount} việc quá hạn`;
  } else if (dueCount > 0 || upcomingCount > 0) {
    subject = `[NHẮC VIỆC] ${subject} - ${dueCount} việc hết hạn, ${upcomingCount} việc sắp hết hạn`;
  }

  const mailOptions = {
    from: `"Timeline Logistics" <${from}>`,
    to: recipients.join(', '),
    subject,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent successfully to ${recipients.join(', ')}: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error(`Failed to send email: ${error.message}`);
    throw error;
  }
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
