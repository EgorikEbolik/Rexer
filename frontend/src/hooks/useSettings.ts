import { useState, useEffect } from 'react';

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
}

let cachedSettings: Settings | null = null;

export const useSettings = () => {
  const [settings, setSettings] = useState<Settings | null>(cachedSettings);
  const [loading, setLoading] = useState(!cachedSettings);

  useEffect(() => {
    if (!cachedSettings) {
      fetch(`${API}/settings`)
        .then(res => res.json())
        .then((data: Settings) => {
          cachedSettings = data;
          setSettings(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Не получилось загрузить настройки:', err);
          setLoading(false);
        });
    }
  }, []);

  const reloadSettings = () => {
    setLoading(true);
    fetch(`${API}/settings`)
      .then(res => res.json())
      .then((data: Settings) => {
        cachedSettings = data;
        setSettings(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load settings:', err);
        setLoading(false);
      });
  };

  return { settings, loading, reloadSettings };
}