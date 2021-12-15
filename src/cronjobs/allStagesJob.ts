import { CronJob } from 'cron';

import { STAGE } from '../types';
import config from '../config';
import runStages from '../stages';
import Logger from '../utils/logger';

const logger = Logger('All Stages Job');

let job: CronJob;

export const get = (): CronJob | undefined => {
  return job;
};

export const init = () => {
  logger.info('Initializing job...');
  // Start node process that will run
  job = new CronJob(
    config.cron.schedule,
    function () {
      runStages([STAGE.EXTRACT, STAGE.TRANSFORM, STAGE.LOAD], 'AllStages CronJob');
    },
    null,
    true,
    'America/Toronto',
  );
  job.start();
};
