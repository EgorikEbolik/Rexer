// import { useState, useEffect } from 'react';
import useSWR from "swr"

const API = "http://localhost:8765";

export interface Settings {
  watch_folder: string;
  dest_folder: string;
  sort_mode: "game" | "date" | "none";
  sort_date_format: string;
  sound_enabled: boolean;
  sound_file: string;
  notification_volume: number;
  player_default_volume: number;
  filename_template: string;
  autostart: boolean;
  hover_playback: boolean;
  tileset_quality: number;
  rewrite_files: boolean,
  rewrite_trim: boolean,
  debug: boolean,
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

export const useSettings = () => {
  const { data, isLoading, mutate } = useSWR<Settings>(
    `${API}/settings`,
    fetcher,
    { revalidateOnFocus: false, revalidateIfStale: false }
  );

  return {
    settings: data ?? null,
    loading: isLoading,
    reloadSettings: () => mutate()
  };
}