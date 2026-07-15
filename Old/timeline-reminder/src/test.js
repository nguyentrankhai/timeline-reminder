import dotenv from 'dotenv';
dotenv.config();

import { fetchCSV } from './csv-reader.js';
import { checkTasks } from './task-checker.js';

async function main() {
  console.log('=== Testing CSV Reader ===');
  try {
    const tasks = await fetchCSV();
    console.log(`Total tasks parsed: ${tasks.length}`);

    const withEndDate = tasks.filter(t => t.endDate !== null);
    console.log(`Tasks with end date: ${withEndDate.length}`);

    if (withEndDate.length > 0) {
      console.log('\nSample tasks with dates:');
      withEndDate.slice(0, 5).forEach(t => {
        console.log(`  - ${t.taskName} | Assignee: ${t.assignee} | Start: ${t.startDateStr} | End: ${t.endDateStr} | Status: ${t.status}`);
      });
    }

    console.log('\n=== Testing Task Checker ===');
    const result = checkTasks(tasks);

    console.log(`\nDue today (${result.today}): ${result.dueToday.length} tasks`);
    result.dueToday.forEach(t => {
      console.log(`  - ${t.taskName} (${t.assignee || 'N/A'}) - hết hạn: ${t.endDateStr}`);
    });

    console.log(`\nUpcoming (next 3 days): ${result.upcoming.length} tasks`);
    result.upcoming.forEach(t => {
      console.log(`  - ${t.taskName} (${t.assignee || 'N/A'}) - hết hạn: ${t.endDateStr} (${t.daysRemaining} ngày)`);
    });

    console.log(`\nOverdue: ${result.overdue.length} tasks`);
    result.overdue.slice(0, 10).forEach(t => {
      console.log(`  - ${t.taskName} (${t.assignee || 'N/A'}) - hết hạn: ${t.endDateStr} (quá ${Math.abs(t.daysRemaining)} ngày)`);
    });

  } catch (error) {
    console.error('Test failed:', error.message);
    process.exit(1);
  }
}

main();
