import { Context } from 'grammy';
import { I18nFlavor } from '@grammyjs/i18n';

export type MyContext = Context & I18nFlavor;

export interface Document {
  mime_type: string;
  file_id: string;
  file_unique_id: string;
  file_size: number;
  file_name?: string;
}

interface FFprobeDisposition {
  default?: number;
  dub?: number;
  original?: number;
  comment?: number;
  lyrics?: number;
  karaoke?: number;
  forced?: number;
  hearing_impaired?: number;
  visual_impaired?: number;
  clean_effects?: number;
  attached_pic?: number;
  timed_thumbnails?: number;
  non_diegetic?: number;
  captions?: number;
  descriptions?: number;
  metadata?: number;
  dependent?: number;
  still_image?: number;
}

interface FFprobeStream {
  index: number;
  codec_name: string;
  codec_long_name: string;
  codec_type: string;
  codec_tag_string: string;
  codec_tag: string;
  sample_fmt: string;
  sample_rate: string;
  channels: number;
  channel_layout: string;
  bits_per_sample: number;
  initial_padding: number;
  r_frame_rate: string;
  avg_frame_rate: string;
  time_base: string;
  start_pts: number;
  start_time: string;
  duration_ts: number;
  duration: string;
  extradata_size?: number; // Дополнительный параметр, если существует
  disposition: FFprobeDisposition;
}

interface FFprobeFormat {
  filename: string;
  nb_streams: number;
  nb_programs: number;
  format_name: string;
  format_long_name: string;
  start_time: string;
  duration: string;
  size: string;
  bit_rate?: string;
  probe_score: number;
}

export interface FFprobeResult {
  stream: FFprobeStream;
  format: FFprobeFormat;
}
