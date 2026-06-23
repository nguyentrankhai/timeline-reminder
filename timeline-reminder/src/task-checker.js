import logger from './logger.js';

export function checkTasks(tasks) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const today = new Date(now);
  const threeDaysLater = new Date(now);
  threeDaysLater.setDate(threeDaysLater.getDate() + 3);

  logger.info(`Checking tasks from ${formatDate(today)} to ${formatDate(threeDaysLater)}`);

  const activeTasks = tasks.filter(t => t.status !== 'Hoàn thành');
  const tasksWithEndDate = activeTasks.filter(t => t.endDate !== null);

  const dueToday = tasksWithEndDate.filter(t => {
    const end = normalizeDate(t.endDate);
    return end.getTime() === today.getTime();
  });

  const upcoming = tasksWithEndDate.filter(t => {
    const end = normalizeDate(t.endDate);
    return end.getTime() > today.getTime() && end.getTime() <= threeDaysLater.getTime();
  });

  const overdue = tasksWithEndDate.filter(t => {
    const end = normalizeDate(t.endDate);
    return end.getTime() < today.getTime();
  });

  logger.info(`Found ${dueToday.length} tasks due today, ${upcoming.length} upcoming, ${overdue.length} overdue`);

  return {
    dueToday: dueToday.map(t => enrichTask(t, today)),
    upcoming: upcoming.map(t => enrichTask(t, today)),
    overdue: overdue.map(t => enrichTask(t, today)),
    today: formatDate(today, 'DD/MM/YYYY'),
    threeDaysLater: formatDate(threeDaysLater, 'DD/MM/YYYY'),
  };
}

function enrichTask(task, today) {
  const daysRemaining = task.endDate
    ? Math.ceil((normalizeDate(task.endDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return {
    ...task,
    daysRemaining,
  };
}

function normalizeDate(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function formatDate(date, format = 'DD/MM/YYYY') {
  if (!date) return '';

  const d = date instanceof Date ? date : new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  if (format === 'DD/MM/YYYY') {
    return `${day}/${month}/${year}`;
  }

  return `${day}/${month}/${year}`;
}
