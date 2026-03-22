import { useState, useEffect } from 'react';

const API = "http://127.0.0.1:8765";

export interface Settings {
  watch_folder: string;
  dest_folder: string;
  sort_mode: "game" | "date" | "none";
  sort_date_format: string;
  sound_enabled: boolean;
  sound_file: string;
  sound_volume: number;
  filename_template: string;
  autostart: boolean;
}

let cachedSettings: Settings | null = null;

export const useSettings = (): Settings | null => {
  const [settings, setSettings] = useState<Settings | null>(cachedSettings);

  useEffect(() => {
    if (!cachedSettings) {
      fetch(`${API}/settings`)
        .then(res => res.json())
        .then((data: Settings) => {
          cachedSettings = data;
          setSettings(data);
        })
        .catch(err => console.error('Failed to load settings:', err));
    }
  }, []);

  return settings;
};