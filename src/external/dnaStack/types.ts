export interface Host {
  host_id: string;
  host_subject_id: string;
  data_source_id: string;
  collection_ids: string[];
  host_common_name: string;
  host_scientific_name: string;
  host_health_state: string;
  host_health_status_details: string;
  host_disease: string;
  host_disease_outcome: string;
  host_age: number;
  host_age_unit: string;
  host_age_bin: string;
  host_gender: string;
  host_ethnicity: string;
  host_residence_geo_loc_name_country: string;
  host_residence_geo_loc_name_state_province_territory: string;
  host_residence_geo_loc_name_county_region: string;
  host_residence_geo_loc_name_city: string;
  host_residence_geo_loc_postal_code: string;
  symptom_onset_date: string;
  signs_and_symptoms: string;
  preexisting_conditions_risk_factors: string;
  complications: string;
  location_of_exposure_geo_loc_name_country: string;
  location_of_exposure_geo_loc_name_state_province_territory: string;
  location_of_exposure_geo_loc_name_county_region: string;
  location_of_exposure_geo_loc_name_city: string;
  location_of_exposure_geo_loc_postal_code: string;
  exposure_event: string;
  exposure_contact_level: string;
  host_role: string;
  exposure_setting: string;
  exposure_details: string;
  destination_of_most_recent_travel_country: string;
  destination_of_most_recent_travel_state_province_territory: string;
  destination_of_most_recent_travel_county_region: string;
  destination_of_most_recent_travel_city: string;
  destination_of_most_recent_travel_postal_code: string;
  most_recent_travel_departure_date: string;
  most_recent_travel_return_date: string;
  travel_history: string;
  host_vaccination_status: string;
  vaccine_name: string;
  number_of_vaccine_doses_received: number;
  first_dose_vaccination_date: string;
  last_dose_vaccination_date: string;
  prior_sarscov2_infection: string;
  prior_sarscov2_infection_isolate: string;
  prior_sarscov2_infection_date: string;
  prior_sarscov2_antiviral_treatment: string;
  prior_sarscov2_antiviral_treatment_agent: string;
  prior_sarscov2_antiviral_treatment_date: string;
}

export interface DataSource {
  data_source_id: string;
  data_source_name: string;
}

export interface Collection {
  collection_id: string;
  collection_name: string;
}

export interface Sample {
  sample_id: string;
  bioproject_umbrella_accession: string;
  bioproject_accession: string;
  biosample_accession: string;
  host_id: string;
  host_specimen_voucher: string;
  specimen_collector_sample_id: string;
  culture_collection: string;
  sample_collected_by: string;
  sample_collector_contact_email: string;
  sample_collector_contact_address: string;
  sample_collection_date: string;
  sample_received_date: string;
  sequencing_date: string;
  geo_loc_name_country: string;
  geo_loc_name_state_province_territory: string;
  geo_loc_name_county_region: string;
  geo_loc_name_city: string;
  geo_loc_postal_code: string;
  geo_loc_latitude: string;
  geo_loc_longitude: string;
  organism: string;
  isolate: string;
  purpose_of_sampling: string;
  purpose_of_sample_details: string;
  sample_plan_name: string;
  sample_collected_in_quarantine: string;
  anatomical_material: string;
  anatomical_part: string;
  body_product: string;
  environmental_material: string;
  environmental_site: string;
  collection_device: string;
  collection_method: string;
  collection_protocol: string;
  specimen_processing: string;
  lab_host: string;
  passage_number: number;
  passage_method: string;
  biomaterial_extracted: string;
  data_abstraction_details: string;
  gene_name_1: string;
  diagnostic_pcr_protocol_1: string;
  diagnostic_pcr_ct_value_1: string;
  gene_name_2: string;
  diagnostic_pcr_protocol_2: string;
  diagnostic_pcr_ct_value_2: string;
  authors: string;
}

export interface Sequence {
  sequence_id: string;
  sra_accession: string;
  genbank_ena_ddbj_accession: string;
  gisaid_accession: string;
  sample_id: string;
  sequence_submitted_by: string;
  sequence_submitter_contact_email: string;
  sequence_submitter_contact_address: string;
  sequence_submitted_date: string;
  sequence_release_date: string;
  purpose_of_sequencing: string;
  purpose_of_sequencing_details: string;
  library_id: string;
  amplicon_size: string;
  library_preparation_kit: string;
  flow_cell_barcode: string;
  sequencing_instrument: string;
  sequencing_protocol_name: string;
  sequencing_protocol: string;
  sequencing_kit_number: string;
  amplicon_pcr_primer_scheme: string;
  raw_sequence_data_processing_method: string;
  dehosting_method: string;
  breadth_of_coverage_value: {
    format: 'decimal';
    type: 'string';
    $comment: 'decimal';
  };
  depth_of_coverage_value: string;
  depth_of_coverage_threshold: string;
  r1_fastq_filename: string;
  r1_fast_filepath: string;
  r2_fastq_filename: string;
  r2_fastq_filepath: string;
  fast5_filename: string;
  fast5_filepath: string;
  number_base_pairs_sequenced: number;
  consensus_genome_length: number;
  ns_per_100_kbp: number;
  nucleotide_completeness: string;
  reference_genome_accession: string;
  consensus_sequence_name: string;
  consensus_sequence_filename: string;
  consensus_sequence_filepath: string;
  consensus_sequence_software_name: string;
  consensus_sequence_software_version: string;
  bioinformatics_protocol: string;
  gisaid_virus_name: string;
  lineage_clade_name: string;
  lineage_clade_analysis_software_name: string;
  lineage_clade_analysis_software_version: string;
  variant_designation: string;
  variant_evidence: string;
  publications: string;
}

export interface File {
  file_id: string;
  sequence_id: string;
  file_type: string;
  drs_filename: string;
  drs_filepath: string;
}
