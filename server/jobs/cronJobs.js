import { initSchedulers } from '../scripts/scheduler.js';

export const initCronJobs = () => {
  console.log('[CRON] Initializing all scheduled jobs...');
  initSchedulers();
};
