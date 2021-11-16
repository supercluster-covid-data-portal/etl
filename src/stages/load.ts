import { Collection as MongoCollection, Db, Document } from 'mongodb';
import _ from 'lodash';
import * as Rollcall from '../external/rollcall';
import { collections } from '../external/mongo';
import { getClient } from '../external/elasticsearch';
import Timer from '../timer';
import Logger from '../logger';
import { Client } from '@elastic/elasticsearch';
const timer = Timer();
const logger = Logger('Load');

const ES_BATCH_SIZE = 50;

type LoadSummary = {
  index: string;
  duration: number;
};

const bulkIndex = async (docs: any, index: string, esClient: Client): Promise<void> => {
  const body = docs.flatMap((doc: any) => [{ index: { _id: doc.sequence_id } }, doc]);
  await esClient.bulk({ index, body });
};

/**
 * ### ----- Load Stage ----- ###
 *
 * Steps:
 * 1. Get next index from Rollcall
 * 2. Stream all sequence-centric documents
 *    - Batch documents into groups of 50
 *    - Upload each batch to elastic search
 * 3. Release index to search alias
 *
 * Approx completion time: 10 mins
 */
const load = async (): Promise<LoadSummary> => {
  timer.start();
  logger.info('###', 'STARTING LOAD');

  // ----- Get index
  const nextIndex = await Rollcall.fetchNextIndex();
  const index = nextIndex.indexName;
  logger.info('Uploading documents to next index', index);

  // ----- Stream sequence-centric documents, batch, upload
  let batch: Document[] = [];
  let docCount = 0;
  let batchCount = 1;
  const esClient = await getClient();
  for await (const doc of (collections.sequenceCentric as MongoCollection).find()) {
    docCount++;
    batch.push(_.omit(doc, ['_id']));

    if (batch.length >= ES_BATCH_SIZE) {
      if (batchCount % 25 === 0) {
        logger.debug('Releasing batch:', batchCount, 'Total docs indexed:', docCount);
      }
      await bulkIndex(batch, index, esClient);

      batch = [];
      batchCount++;
    }
  }
  // Send final batch
  await bulkIndex(batch, index, esClient);
  logger.info('Done uploading centric documents.');

  Rollcall.release(nextIndex);
  logger.info('Index released to search alias');

  const output: LoadSummary = { index, duration: timer.time() };
  logger.info('Load Summary', output);
  logger.info('###', 'FINISHED LOAD');
  return output;
};
export default load;
