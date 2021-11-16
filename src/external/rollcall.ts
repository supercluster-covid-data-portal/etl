/*
 * Copyright (c) 2020 The Ontario Institute for Cancer Research. All rights reserved
 *
 * This program and the accompanying materials are made available under the terms of
 * the GNU Affero General Public License v3.0. You should have received a copy of the
 * GNU Affero General Public License along with this program.
 *  If not, see <http://www.gnu.org/licenses/>.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 * OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT
 * SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
 * INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
 * TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
 * OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER
 * IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN
 * ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import fetch from 'node-fetch';
import urljoin from 'url-join';

import Logger from '../logger';
import config from '../config';
import { getClient } from './elasticsearch';
import indexMapping from '../resources/sequence-centric-mapping.json';
const logger = Logger('Rollcall');

export type IndexReleaseRequest = {
  alias: string;
  release: string;
  shards: string[];
};

export type Index = {
  indexName: string;
  entity: string;
  type: string;
  shardPrefix: string;
  shard: string;
  releasePrefix: string;
  release: string;
  valid: boolean;
};

const configureIndex = async (index: Index): Promise<void> => {
  const client = await getClient();
  try {
    await client.indices.close({ index: index.indexName });

    await client.indices.putMapping({
      index: index.indexName,
      body: indexMapping.mappings,
    });
    await client.indices.open({ index: index.indexName });
  } catch (e) {
    console.error(JSON.stringify(e));
  }
};

export const fetchNextIndex = async (): Promise<Index> => {
  logger.info(`Fetching next index...`);
  const url = urljoin(config.rollcall.host, `/indices/create`);

  const req = {
    entity: config.rollcall.entity,
    type: 'centric',
    shardPrefix: 'source',
    shard: 'dnastack',
    releasePrefix: 're',

    cloneFromReleasedIndex: false,
  };
  try {
    const newIndex = (await fetch(url, {
      method: 'POST',
      body: JSON.stringify(req),
      headers: { 'Content-Type': 'application/json' },
    }).then((res) => res.json())) as Index;

    // Set the mapping and update settings
    await configureIndex(newIndex);

    logger.info(`New index: ${newIndex.indexName}`);
    return newIndex;
  } catch (err) {
    logger.error('Failed to get new index', err);
    throw err;
  }
};

export const release = async (index: Index): Promise<boolean> => {
  logger.info(`Releasing ${index.indexName}`);

  const url = urljoin(config.rollcall.host, `/aliases/release`);
  const req = await convertResolvedIndexToIndexReleaseRequest(index);

  const acknowledged = (await fetch(url, {
    method: 'POST',
    body: JSON.stringify(req),
    headers: { 'Content-Type': 'application/json' },
  }).then((res) => res.json())) as boolean;

  return acknowledged;
};

const convertResolvedIndexToIndexReleaseRequest = async (resovledIndex: Index): Promise<IndexReleaseRequest> => {
  const alias = config.rollcall.alias;
  const shard = resovledIndex.shardPrefix + '_' + resovledIndex.shard;
  const release = resovledIndex.releasePrefix + '_' + resovledIndex.release;

  return { alias, release, shards: [shard] };
};
