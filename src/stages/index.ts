import _ from 'lodash';

import * as mongo from '../external/mongo';
import extract from './extract';
import transform from './transform';
import load from './load';
import { STAGE } from '../types';
import Timer from '../utils/timer';
import Logger from '../utils/logger';

const timer = Timer();
const logger = Logger('ETL Executor', timer);

type ETLSummary = {
  extract?: any;
  transform?: any;
  load?: any;
  duration?: number;
  errors: string[];
  stages: STAGE[];
  start: Date;
  end?: Date;
  trigger: string;
};

async function recordSummary(summary: ETLSummary) {
  if (mongo.collections.runs) {
    await mongo.collections.runs.insertOne(_.clone(summary));
  }
}

async function runStages(stages: STAGE[], trigger: string) {
  timer.start();

  const summary: ETLSummary = { stages, errors: [], trigger, start: new Date() };
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
    summary.end = new Date();
    await recordSummary(summary);
    await mongo.close();

    logger.info('Summary', summary);
    logger.info('#####', 'FINISHED');
  }
}

export default runStages;
