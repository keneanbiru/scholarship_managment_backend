import { ExpireScholarships } from '../usecases/scholarships/ExpireScholarships.js';
import { env } from '../config/env.js';

let timer = null;

const runExpiry = async () => {
  try {
    const usecase = new ExpireScholarships();
    const result = await usecase.execute(new Date());
    if (result.expiredCount > 0) {
      console.log(`🕒 Scholarship expiry job: expired ${result.expiredCount} scholarship(s)`);
    }
  } catch (error) {
    console.error('Scholarship expiry job failed:', error.message);
  }
};

export const startScholarshipExpiryJob = () => {
  if (timer) {
    return;
  }

  runExpiry();
  timer = setInterval(runExpiry, env.SCHOLARSHIP_EXPIRY_JOB_INTERVAL_MS);
  console.log(`🕒 Scholarship expiry job scheduled every ${env.SCHOLARSHIP_EXPIRY_JOB_INTERVAL_MS}ms`);
};

export const stopScholarshipExpiryJob = () => {
  if (!timer) {
    return;
  }
  clearInterval(timer);
  timer = null;
};

