import _ from 'lodash';

import * as mongo from '../external/mongo';
import extract from './extract';
import transform from './transform';
import load from './load';
import { STAGE } from '../types';
import Timer from '../utils/timer';
import Logger from '../utils/logger';
import Queue from 'promise-queue';

const timer = Timer();
const logger = Logger('ETL Executor', timer);

type ETLSummary = {
  extract?: any;
  transform?: any;
  load?: any;
  duration?: number;
  errors: string[];
  stages: STAGE[];
};

async function recordSummary(summary: ETLSummary) {
  if (mongo.collections.runs) {
    await mongo.collections.runs.insertOne(_.clone(summary));
  }
}

export const inMemoryQueue = new Queue(1);

async function run(stages: STAGE[]) {
  timer.start();

  const summary: ETLSummary = { stages, errors: [] };
  let activeStage;
  try {
    logger.info('#####', 'STARTING');
    logger.info('Stages to run:', ...stages);

    if (stages.includes(STAGE.EXTRACT) && stages.includes(STAGE.LOAD) && !stages.includes(STAGE.TRANSFORM)) {
      throw new Error(
        'EXTRACT and LOAD requested without TRANSFORM stage. Stopping this run to protect against accidentally loading different data than was extracted. You likely meant to use --all to run all stages.',
      );
    }

    await mongo.connect();

    if (stages.includes(STAGE.EXTRACT)) {
      activeStage = STAGE.EXTRACT;
      summary.extract = await extract();
    }
    if (stages.includes(STAGE.TRANSFORM)) {
      activeStage = STAGE.TRANSFORM;
      summary.transform = await transform();
    }
    if (stages.includes(STAGE.LOAD)) {
      activeStage = STAGE.LOAD;
      summary.load = await load();
    }
  } catch (e) {
    if (activeStage) {
      logger.error(`ETL threw an error during ${activeStage}:`, e);
    } else {
      logger.error(`ETL threw an error:`, e);
    }
    summary.errors.push((e as Error).message);
  } finally {
    summary.duration = timer.time();
    await recordSummary(summary);
    await mongo.close();

    logger.info('Summary', summary);
    logger.info('#####', 'FINISHED');
  }
}

async function runStages(stages: STAGE[]) {
  logger.info('===== enqueued new task =====');
  await inMemoryQueue.add(async () => {
    await run(stages);
  });
}

export default runStages;
