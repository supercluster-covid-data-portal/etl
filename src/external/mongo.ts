import * as mongodb from 'mongodb';

import config from '../config';
import Logger from '../logger';
const logger = Logger('Mongo');

const CREDENTIALS = config.mongo.user && config.mongo.password ? `${config.mongo.user}:${config.mongo.password}@` : '';
const CONNECTION = `mongodb://${CREDENTIALS}${config.mongo.host}/${config.mongo.db}`;
const DB = config.mongo.db;

const client = new mongodb.MongoClient(CONNECTION, { maxPoolSize: 100 });

let connected = false;

export const collections: {
  source: {
    collections?: mongodb.Collection;
    datasources?: mongodb.Collection;
    files?: mongodb.Collection;
    hosts?: mongodb.Collection;
    samples?: mongodb.Collection;
    sequences?: mongodb.Collection;
  };
  sequenceCentric?: mongodb.Collection;
  runs?: mongodb.Collection;
} = { source: {} };

export const getDb = async () => {
  if (!connected) {
    throw new Error('DB Not Connected! Connect to mongo before requesting the database.');
  }
  return client.db(DB);
};

export const connect = async () => {
  if (!connected) {
    await client.connect();
    logger.info('DB Connection Open');
    connected = true;
  }

  const db = await getDb();
  collections.source.collections = db.collection('collections');
  collections.source.datasources = db.collection('datasources');
  collections.source.files = db.collection('files');
  collections.source.hosts = db.collection('hosts');
  collections.source.samples = db.collection('samples');
  collections.source.sequences = db.collection('sequences');
  collections.sequenceCentric = db.collection('sequencecentric');
  collections.runs = db.collection('runs');

  return client;
};

export const close = async () => {
  if (connected) {
    await client.close();
    logger.info('DB Connection Closed');
  } else {
    logger.warn('DB close was requested, but there is no active connection. No action taken.');
  }
};
