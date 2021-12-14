import { Command } from 'commander';
import _ from 'lodash';

import { STAGE } from './types';
import enqueue from './stages';
import * as allStagesJob from './cronjobs/allStagesJob';
import initServer from './server';

import Logger from './utils/logger';
const logger = Logger('ETL');

/*
 * ##### Define CLI arguments using Commander
 */
const program = new Command();
program
  .option('--extract', 'include EXTRACT stage')
  .option('--transform', 'include TRANSFORM stage')
  .option('--load', 'include LOAD stage')
  .option('--all', 'run all stages')
  .option(
    '--cron',
    'run application as recurring cron job that will run all stages on schedule defined in env variables',
  )
  .option(
    '--server',
    'run express server to interact with cron job via web API - includes health check needed for Kubernetes liveness probe',
  )
  .parse();

/*
 * ##### Transform provided arguments into the stages to run
 */
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

/*
 * ##### Send selected stages to the main program
 */
if (stages.size > 0) {
  // If any stages were requested, lets run the main program
  enqueue(Array.from(stages));
} else if (!options.cron && !options.server) {
  // Otherwise shut it down
  logger.error('No stages or instructions provided. Nothing will run.');
}

/*
 * ##### When run with cron job flag
 */
if (options.cron) {
  allStagesJob.init();
}

/*
 * ##### When run with server flag
 */
if (options.server) {
  initServer();
}
