import cron from 'node-cron';
import dotenv from 'dotenv';

dotenv.config();

import logger from './logger.js';
import { fetchCSV } from './csv-reader.js';
import { checkTasks } from './task-checker.js';
import { buildEmailHtml, sendEmail } from './email-sender.js';

export async function runCheck() {
  logger.info('=== Starting daily task check ===');

  try {
    const tasks = await fetchCSV();
    const result = checkTasks(tasks);

    const { dueToday, upcoming, overdue } = result;

    if (dueToday.length === 0 && upcoming.length === 0 && overdue.length === 0) {
      logger.info('No tasks due today or in the next 3 days. Sending empty report.');
    }

    const html = buildEmailHtml(result);
    await sendEmail(html, result);

    logger.info('=== Daily task check completed successfully ===');
    return result;
  } catch (error) {
    logger.error(`Daily task check failed: ${error.message}`);
    logger.error(error.stack);
    throw error;
  }
}

function scheduleJob() {
  const cronExpression = process.env.CRON_SCHEDULE || '15 2 * * *';
  const timezone = process.env.TZ || 'Asia/Ho_Chi_Minh';

  logger.info(`Scheduling cron job: "${cronExpression}" (${timezone})`);

  const isValid = cron.validate(cronExpression);
  if (!isValid) {
    logger.error(`Invalid cron expression: ${cronExpression}`);
    process.exit(1);
  }

  cron.schedule(cronExpression, async () => {
    logger.info('Cron job triggered');
    try {
      await runCheck();
    } catch (error) {
      logger.error(`Cron job failed: ${error.message}`);
    }
  }, {
    scheduled: true,
    timezone,
  });

  logger.info(`Cron job scheduled. Next run at configured time (${cronExpression} ${timezone})`);
}

function main() {
  logger.info('=== Timeline Logistics Reminder Service ===');
  logger.info(`Timezone: ${process.env.TZ || 'Asia/Ho_Chi_Minh'}`);

  if (process.env.RUN_ONCE === 'true') {
    logger.info('Running once (RUN_ONCE=true)');
    runCheck()
      .then(() => {
        logger.info('Run completed.');
        process.exit(0);
      })
      .catch(() => {
        process.exit(1);
      });
  } else {
    scheduleJob();
    logger.info('Service is running. Press Ctrl+C to stop.');
  }
}

main();
