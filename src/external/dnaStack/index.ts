import fetch from 'node-fetch';

import config from '../../config';
import { Collection, DataSource, File, Host, Sample, Sequence } from './types';

const buildDataTableUrl = (tableName: string) =>
  `${config.dnastack.host}/table/viralai2.oicr_covidcloud.${tableName}_table/data`;

const DATACONNECT_URLS = {
  collection: buildDataTableUrl('collection'),
  dataSource: buildDataTableUrl('data_source'),
  file: buildDataTableUrl('sequence_file'),
  host: buildDataTableUrl('host'),
  sample: buildDataTableUrl('sample'),
  sequence: buildDataTableUrl('sequence'),
};

interface DataConnectResponse<T> {
  data: T[];
  pagination: {
    next_page_url?: string;
  };
}

export const fetchCollections = () => fetchData<Collection>(DATACONNECT_URLS.collection);
export const fetchDataSources = () => fetchData<DataSource>(DATACONNECT_URLS.dataSource);
export const fetchFiles = () => fetchData<File>(DATACONNECT_URLS.file);
export const fetchHosts = () => fetchData<Host>(DATACONNECT_URLS.host);
export const fetchSamples = () => fetchData<Sample>(DATACONNECT_URLS.sample);
export const fetchSequences = () => fetchData<Sequence>(DATACONNECT_URLS.sequence);

/**
 * Async generator that will loop through every page of a table from the Data Connect API
 * and yield the data from that page after every request.
 * @param url Root URL for a table from the Data Connect API
 * @returns
 */
async function* fetchData<T>(url: string): AsyncGenerator<T[], void, void> {
  let response = await fetch(url).then((res: any) => res.json() as DataConnectResponse<T>);
  yield response.data;
  while (response.pagination.next_page_url) {
    response = await fetch(response.pagination.next_page_url).then((res: any) => res.json() as DataConnectResponse<T>);
    yield response.data;
  }
  return;
}
