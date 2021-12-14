import { Router } from 'express';
import { STAGE } from '../types';
import enqueue from '../stages';

import Logger from '../utils/logger';
const logger = Logger('Router:ETL');

const router: Router = Router();

router.post('/all', (_, res) => {
  logger.info('Starting ETL for all stages...');
  enqueue([STAGE.EXTRACT, STAGE.TRANSFORM, STAGE.LOAD]);

  res.status(200).json({
    status: 'started',
    stages: [STAGE.EXTRACT, STAGE.TRANSFORM, STAGE.LOAD],
  });
});
router.post('/extract', (_, res) => {
  logger.info(`Starting ETL for ${STAGE.EXTRACT} stage...`);
  enqueue([STAGE.EXTRACT]);

  res.status(200).json({
    status: 'started',
    stages: [STAGE.EXTRACT],
  });
});
router.post('/transform', (_, res) => {
  logger.info(`Starting ETL for ${STAGE.TRANSFORM} stage...`);
  enqueue([STAGE.TRANSFORM]);

  res.status(200).json({
    status: 'started',
    stages: [STAGE.TRANSFORM],
  });
});
router.post('/load', (_, res) => {
  logger.info(`Starting ETL for ${STAGE.LOAD} stage...`);
  enqueue([STAGE.LOAD]);

  res.status(200).json({
    status: 'started',
    stages: [STAGE.LOAD],
  });
});

export default router;
