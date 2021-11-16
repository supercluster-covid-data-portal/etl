import { Client } from '@elastic/elasticsearch';

import config from '../config';

let esClient: Client;

export async function getClient(): Promise<Client> {
  if (esClient) {
    return esClient;
  }
  // define auth for client, if set in env
  const auth =
    config.elasticsearch.user && config.elasticsearch.password
      ? { username: config.elasticsearch.user, password: config.elasticsearch.password }
      : undefined;

  esClient = new Client({
    node: config.elasticsearch.host,
    auth,
  });
  await esClient.ping();
  return esClient;
}
