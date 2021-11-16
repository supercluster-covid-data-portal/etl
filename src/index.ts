import { Command } from 'commander';
import _ from 'lodash';

import * as mongo from './external/mongo';
import extract from './stages/extract';
import transform from './stages/transform';
import load from './stages/load';
import Timer from './timer';
import Logger from './logger';

const timer = Timer();
const logger = Logger('Main', timer);

enum STAGE {
  EXTRACT = 'EXTRACT',
  TRANSFORM = 'TRANSFORM',
  LOAD = 'LOAD',
}

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

/*
 * ##### Define CLI arguments using Commander
 */

const program = new Command();
program
  .option('--extract', 'include EXTRACT stage')
  .option('--transform', 'include TRANSFORM stage')
  .option('--load', 'include LOAD stage')
  .option('--all', 'run all stages')
  .parse();
const options = program.opts();
const stages: Set<STAGE> = new Set<STAGE>();
if (options.all) {
  stages.add(STAGE.EXTRACT);
  stages.add(STAGE.TRANSFORM);
  stages.add(STAGE.LOAD);
}
if (options.extract) {
  stages.add(STAGE.EXTRACT);
}
if (options.transform) {
  stages.add(STAGE.TRANSFORM);
}
if (options.load) {
  stages.add(STAGE.LOAD);
}

if (stages.size > 0) {
  // If any stages were requested, lets run the main program
  main(Array.from(stages));
} else {
  // Otherwise shut it down
  logger.error('No stages provided.');
}
