import { Router } from 'express';
import { STAGE } from '../types';
import runStages from '../stages';

import Logger from '../utils/logger';
const logger = Logger('Router:ETL');

const router: Router = Router();

router.post('/all', (_, res) => {
  logger.info('Starting ETL for all stages...');
  runStages([STAGE.EXTRACT, STAGE.TRANSFORM, STAGE.LOAD]);

  res.status(200).json({
    status: 'started',
    stages: [STAGE.EXTRACT, STAGE.TRANSFORM, STAGE.LOAD],
  });
});
router.post('/extract', (_, res) => {
  logger.info(`Starting ETL for ${STAGE.EXTRACT} stage...`);
  runStages([STAGE.EXTRACT]);

  res.status(200).json({
    status: 'started',
    stages: [STAGE.EXTRACT],
  });
});
router.post('/transform', (_, res) => {
  logger.info(`Starting ETL for ${STAGE.TRANSFORM} stage...`);
  runStages([STAGE.TRANSFORM]);

  res.status(200).json({
    status: 'started',
    stages: [STAGE.TRANSFORM],
  });
});
router.post('/load', (_, res) => {
  logger.info(`Starting ETL for ${STAGE.LOAD} stage...`);
  runStages([STAGE.LOAD]);

  res.status(200).json({
    status: 'started',
    stages: [STAGE.LOAD],
  });
});

export default router;
