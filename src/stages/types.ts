export type SequenceCentric_Sample = {
  sample_id: string;
  [key: string]: any;
};
export type SequenceCentric_Host = {
  host_id: string;
  [key: string]: any;
};
export type SequenceCentric_File = {
  file_id: string;
  [key: string]: any;
};
export type SequenceCentric_DataSource = {
  data_source_id: string;
  [key: string]: any;
};
export type SequenceCentric_Collection = {
  collection_id: string;
  [key: string]: any;
};
export type SequenceCentric = {
  sequence_id: string;
  sample: SequenceCentric_Sample;
  host: SequenceCentric_Host;
  files: SequenceCentric_File[];
  data_source: SequenceCentric_DataSource;
  collections: SequenceCentric_Collection[];
  [key: string]: any;
};
