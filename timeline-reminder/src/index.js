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

function logEnv() {
  const envVars = {
    GOOGLE_DRIVE_CSV_URL: process.env.GOOGLE_DRIVE_CSV_URL || '(not set)',
    LOCAL_CSV_PATH: process.env.LOCAL_CSV_PATH || '(not set)',
    SMTP_HOST: process.env.SMTP_HOST || '(not set)',
    SMTP_PORT: process.env.SMTP_PORT || '(not set)',
    SMTP_USER: process.env.SMTP_USER || '(not set)',
    SMTP_PASSWORD: process.env.SMTP_PASSWORD ? '********' : '(not set)',
    SMTP_FROM: process.env.SMTP_FROM || '(not set)',
    NOTIFICATION_EMAILS: process.env.NOTIFICATION_EMAILS || '(not set)',
    CRON_SCHEDULE: process.env.CRON_SCHEDULE || '(default: 15 2 * * *)',
    TZ: process.env.TZ || '(default: Asia/Ho_Chi_Minh)',
    LOG_LEVEL: process.env.LOG_LEVEL || '(default: INFO)',
  };

  console.log('=== Environment Configuration ===');
  for (const [key, value] of Object.entries(envVars)) {
    console.log(`  ${key}: ${value}`);
  }
  console.log('================================\n');
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
  logEnv();

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

    logger.info('Running initial check to verify connectivity...');
    runCheck()
      .then(() => {
        logger.info('Initial check completed successfully.');
        logger.info('Service is running. Press Ctrl+C to stop.');
      })
      .catch((error) => {
        logger.error(`Initial check failed: ${error.message}`);
        logger.info('Service continues running. Cron job will retry at scheduled time.');
        logger.info('Service is running. Press Ctrl+C to stop.');
      });
  }
}

main();
