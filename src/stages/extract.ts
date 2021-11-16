import { Collection as MongoCollection, Db } from 'mongodb';
import _ from 'lodash';

import * as Fetcher from '../external/dnaStack';
import { collections } from '../external/mongo';
import Timer from '../timer';
import Logger from '../logger';

const timer = Timer();
const logger = Logger('Extract', timer);

type ExtractSummary = { counts: Record<string, number>; duration: number };

const OBJECT_COUNT: Record<string, number> = {};
const addToCount = (name: string, count: number) => {
  if (OBJECT_COUNT[name]) {
    OBJECT_COUNT[name] += count;
  } else {
    OBJECT_COUNT[name] = count;
  }
};

/**
 * Record a single page of records into Mongo
 */
async function saveData(name: string, data: any, collection: MongoCollection): Promise<void> {
  if (data && data.length) {
    addToCount(name, data.length);
    logger.debug(`[${name}] Total: ${OBJECT_COUNT[name]} - Adding ${data.length} `);
    await collection.insertMany(data);
  }
}

/**
 * Listen to every page response from a DNAStack Fetcher's async generator, and pass the results on to be saved to mongo
 * @param name
 * @param fetcher
 * @param collection
 */
async function fetchAndSave(name: string, fetcher: () => AsyncGenerator, collection: MongoCollection) {
  for await (let res of fetcher()) {
    await saveData(name, res, collection);
  }
}

/**
 * Remove all documents from all data connect table collections
 *   This is everything provided in mongo.collections, excluding `sequencecentric` collection (owned by transform)
 */
async function clearAllCollections() {
  await Promise.all(Object.entries(collections.source).map((entry) => entry[1].deleteMany({})));
}

/**
 * ### ----- Extract Stage ----- ###
 *
 * Steps:
 * 1. Clear all data from extract collections
 * 2. In parallel, fetch data from all DNA Stack data end points. Each table downloads one page at a time.
 *
 * Approx completion time: 20 mins
 */
async function extract(): Promise<ExtractSummary> {
  timer.start();
  logger.info('###', 'STARTING EXTRACT');

  // ----- Remove all existing data
  logger.info('Clearing stored data...');
  await clearAllCollections();
  logger.info('Data from previous run removed.');

  // ----- Fetch from each data connect table into its own collection
  logger.info('Fetching source data...');
  await Promise.all([
    fetchAndSave('collections', Fetcher.fetchCollections, collections.source.collections as MongoCollection),
    fetchAndSave('data sources', Fetcher.fetchDataSources, collections.source.datasources as MongoCollection),
    fetchAndSave('files', Fetcher.fetchFiles, collections.source.files as MongoCollection),
    fetchAndSave('hosts', Fetcher.fetchHosts, collections.source.hosts as MongoCollection),
    fetchAndSave('samples', Fetcher.fetchSamples, collections.source.samples as MongoCollection),
    fetchAndSave('sequences', Fetcher.fetchSequences, collections.source.sequences as MongoCollection),
  ]);
  logger.info('All pages collected.');

  // ----- Summarize
  const output = { counts: OBJECT_COUNT, duration: timer.time() };
  logger.info('Extract Summary', output);
  logger.info('###', 'FINISHED EXTRACT');
  return output;
}

export default extract;
