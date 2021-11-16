import _ from 'lodash';

import * as mongo from './external/mongo';
import extract from './stages/extract';
import transform from './stages/transform';
import load from './stages/load';
import { STAGE } from './index';
import Timer from './timer';
import Logger from './logger';

const timer = Timer();
const logger = Logger('Main', timer);

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

async function main(stages: STAGE[]) {
  timer.start();

  const summary: ETLSummary = { stages, errors: [] };
  let activeStage;
  try {
    logger.info('#####', 'STARTING ETL');
    logger.info('Stages to run:', ...stages);

    if (stages.includes(STAGE.EXTRACT) && stages.includes(STAGE.LOAD) && !stages.includes(STAGE.TRANSFORM)) {
      throw new Error(
        'EXTRACT and LOAD requested without TRANSFORM stage. Stopping this run to protect against accidentally loading different data than was extracted. You likely meant to use --all to run all stages.',
      );
    }

    await mongo.connect();

    if (stages.includes(STAGE.EXTRACT)) {
      activeStage = STAGE.EXTRACT;
      const extractSummary = await extract();
      summary.extract = extractSummary;
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
    logger.info('#####', 'FINISHED ETL');
  }
}

export default main;
