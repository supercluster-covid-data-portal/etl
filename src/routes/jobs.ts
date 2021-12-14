import { CronJob } from 'cron';
import { Router } from 'express';
import config from '../config';

import * as allStagesJob from '../cronjobs/allStagesJob';
import Logger from '../utils/logger';
const logger = Logger('Router:Jobs');

const router: Router = Router();

const getStatus = (job?: CronJob) => {
  if (job) {
    return {
      active: job.running,
      init: true,
      last: job.lastDate() || 'Not run since ETL last restarted.',
      next: job.nextDate(),
      nextEST: job.nextDate().toDate().toLocaleString(),
      schedule: config.cron.schedule,
    };
  } else {
    return {
      init: false,
    };
  }
};

router.get('/', (_, res) => {
  const etlJob = allStagesJob.get();
  res.status(200).json(getStatus(etlJob));
});

router.post('/activate', (_, res) => {
  logger.info('Activating AllStages cron job...');
  const etlJob = allStagesJob.get();
  etlJob?.start();
  res.status(200).json(getStatus(etlJob));
  logger.info('AllStages cron job activated.');
});
router.post('/deactivate', (_, res) => {
  logger.info('Deactivating AllStages cron job...');
  const etlJob = allStagesJob.get();
  etlJob?.stop();
  res.status(200).json(getStatus(etlJob));
  logger.info('AllStages cron job deactivated.');
});

export default router;
