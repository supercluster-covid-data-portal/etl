import { Command } from 'commander';
import _ from 'lodash';

import * as mongo from './external/mongo';
import extract from './stages/extract';
import transform from './stages/transform';
import load from './stages/load';
import main from './main';
import Logger from './logger';
const logger = Logger('ETL');

export enum STAGE {
  EXTRACT = 'EXTRACT',
  TRANSFORM = 'TRANSFORM',
  LOAD = 'LOAD',
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
