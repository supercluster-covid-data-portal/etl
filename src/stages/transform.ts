import PromisePool from '@supercharge/promise-pool';
import _ from 'lodash';
import { Collection as MongoCollection, Db, Document } from 'mongodb';

import { collections, getDb } from '../external/mongo';
import { Collection, DataSource, File, Host, Sample, Sequence } from '../external/dnaStack/types';
import Timer from '../utils/timer';
import {
  SequenceCentric,
  SequenceCentric_DataSource,
  SequenceCentric_File,
  SequenceCentric_Host,
  SequenceCentric_Sample,
} from './types';
import Logger from '../utils/logger';

const timer = Timer();
const logger = Logger('Transform', timer);

type TransferSummary = { documentsCreated: number; duration: number };

let sequenceCount = 0;

const collectionDocs: Collection[] = [];
const dataSourceDocs: DataSource[] = [];

const findFiles = async (sequenceId: string) => {
  const sourceFiles: File[] = [];
  for await (const doc of (collections.source.files as MongoCollection).find({
    sequence_id: sequenceId,
  })) {
    sourceFiles.push(doc as File);
  }
  return sourceFiles;
};

const findSample = async (sampleId: string) => {
  return await (collections.source.samples as MongoCollection).findOne({
    sample_id: sampleId,
  });
};

const findHost = async (hostId: string) => {
  return await (collections.source.hosts as MongoCollection).findOne({
    host_id: hostId,
  });
};

const toInteger = (value?: string): number | undefined => {
  if (value) {
    const parsed = parseInt(value);
    if (!isNaN(parsed)) {
      return parsed;
    }
  }
};

/**
 * Formatting of the extracted values includes removing fields that are not needed in ES (ex. Mongo IDs, duplicate property IDs)
 * and converting values from string to the type the index requires (so far this is converting some to integer)
 * @param doc
 * @returns
 */
const formatCentricDocument = (doc: SequenceCentric): SequenceCentric => {
  // Clone to output and remove sequence doc properties
  const output = _.omit(doc, ['_id', 'sample_id']) as SequenceCentric;

  // Force numeric values to integer
  output.consensus_genome_length = toInteger(output.consensus_genome_length);
  output.number_base_pairs_sequenced = toInteger(output.number_base_pairs_sequenced);

  // Files
  output.files = doc.files.map((file) => _.omit(file, ['_id', 'sequence_id'])) as SequenceCentric_File[];

  // Sample
  output.sample = _.omit(doc.sample, ['_id', 'host_id']) as SequenceCentric_Sample;

  // Host
  const formattedHost = _.omit(doc.host, ['_id', 'collection_ids', 'data_source_id']);
  formattedHost.number_of_vaccine_doses_received = toInteger(formattedHost.number_of_vaccine_doses_received);
  output.host = formattedHost as SequenceCentric_Host;

  return output;
};

/**
 * Build a sequence centric document from a given sequence, save it to db
 */
const buildSequenceCentric = async (sourceSequence: Sequence, centricCollection: MongoCollection): Promise<void> => {
  /*
   * Find all Files and attach to source
   * Find Sample and attach
   * Find Host and attach
   * - Find Data Source and attach
   * - Find Collections and attach
   *
   * Write document to sequence_centric index
   */

  sequenceCount++;
  if (sequenceCount % 10000 === 0) logger.debug(`Processed ${sequenceCount} in ${timer.step()}... `);

  // Get files
  const sourceFiles: File[] = await findFiles(sourceSequence.sequence_id);

  // Get Sample then Host
  const sampleDoc = await findSample(sourceSequence.sample_id);
  if (!sampleDoc) return;
  const sample = sampleDoc as Sample;

  const hostDoc = await findHost(sample.host_id);
  if (!hostDoc) return;
  const host = hostDoc as Host;

  // Get Collections and Data Source from stored lists
  const sequenceCollections = collectionDocs.filter((doc) => host.collection_ids.includes(doc.collection_id));
  const dataSource = dataSourceDocs.find(
    (doc) => doc.data_source_id === host.data_source_id,
  ) as SequenceCentric_DataSource;

  const centricDocument: SequenceCentric = {
    files: sourceFiles,
    sample,
    host,
    collections: sequenceCollections,
    data_source: dataSource,
    ...sourceSequence,
  };

  const formattedDocument = formatCentricDocument(centricDocument);
  await centricCollection.insertOne(formattedDocument);
};

async function readCollection(collection: MongoCollection): Promise<Document[]> {
  const cursor = collection.find();
  const output: Document[] = [];
  for await (let doc of cursor) {
    output.push(doc);
  }
  return output;
}

/**
 * ### ----- Transform Stage ----- ###
 *
 * Steps:
 * 1. Clear all data from sequence centric collection
 * 2. Fetch all Collections and DataSources (small data sets) for reference during transform
 * 3. Load all sequences into memory
 * 4. Build documents concurrently (pooled) and write them to mongo
 *
 * Approx completion time: 30 mins
 */
async function transform(): Promise<TransferSummary> {
  timer.start();
  logger.info('###', 'STARTING TRANSFER');

  const db = await getDb();
  const centricCollection = db.collection('sequencecentric');

  // ----- Clear sequence centric collection
  logger.info('Removing existing sequence-centric documents...');
  await centricCollection.deleteMany({});
  logger.info('Centric collection cleared.');

  // ----- Get all the small data sets (collections, datasources)
  for await (const doc of (collections.source.collections as MongoCollection).find({})) {
    collectionDocs.push(_.omit(doc, ['_id']) as Collection);
  }
  for await (const doc of (collections.source.datasources as MongoCollection).find({})) {
    dataSourceDocs.push(_.omit(doc, ['_id']) as DataSource);
  }

  // ----- Load all sequences into memory
  logger.info(`Loading all sequence documents...`);
  const sequences = await readCollection(collections.source.sequences as MongoCollection);
  logger.info(`Total sequence documents: ${sequences.length}`);

  // ----- Build centric documents and save
  logger.info('Building all centric documents...');
  await PromisePool.withConcurrency(10)
    .for(sequences)
    .process(async (doc) => await buildSequenceCentric(doc as Sequence, centricCollection));
  logger.info('All documents build.');

  const output: TransferSummary = { documentsCreated: sequenceCount, duration: timer.time() };
  logger.info('Transfer Summary', output);
  logger.info('###', 'FINISHED TRANSFER');
  return output;
}

export default transform;
