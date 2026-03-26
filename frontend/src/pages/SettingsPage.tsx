import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Folder, Volume2, FileVideo, SortAsc, Play, Save, RotateCcw, BrainCircuit } from "lucide-react";
import { type Settings } from "@/hooks/useSettings"
import { useSettings } from "@/hooks/useSettings";
import PathInput from "@/components/PathInput";

const API = "http://localhost:8765";


const TOKENS = [
  { token: "{window}", desc: "Название окна" },
  { token: "{day}", desc: "День" },
  { token: "{month}", desc: "Месяц" },
  { token: "{year}", desc: "Год" },
  { token: "{hour}", desc: "Часы" },
  { token: "{min}", desc: "Минуты" },
  { token: "{sec}", desc: "Секунды" },
];

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [defaults, setDefaults] = useState<Settings | null>(null);
  const { reloadSettings } = useSettings();

  useEffect(() => {
    Promise.all([
      fetch(`${API}/settings`).then(r => r.json()),
      fetch(`${API}/settings/defaults`).then(r => r.json()),
    ]).then(([data, defs]) => {
      setSettings(data);
      setDefaults(defs);
      setLoading(false);
    })
  }, []);

  const update = (key: keyof Settings, value: unknown) => {
    setSettings((prev) => prev ? { ...prev, [key]: value } : prev);
  };

  const save = async () => {
    if (!settings) return;
    await fetch(`${API}/settings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    reloadSettings()
  };

  const insertToken = (token: string) => {
    if (!settings) return;
    update("filename_template", settings.filename_template + token);
  };

  const browseFolder = async (key: keyof Settings) => {
    const r = await fetch(`${API}/browse/folder`)
    const { path } = await r.json()
    if (path) update(key, path)
  }

  const browseFile = async (key: keyof Settings) => {
    const r = await fetch(`${API}/browse/file`)
    const { path } = await r.json()
    if (path) update(key, path)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-full text-muted-foreground">
      Загрузка настроек...
    </div>
  );

  if (!settings) return (
    <div className="flex items-center justify-center h-full text-destructive">
      Не удалось загрузить настройки.
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <h1 className="text-2xl font-bold">Настройки</h1>

      {/* Папки */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Folder className="h-4 w-4" />
            Папки
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <PathInput
            label="Папка OBS (откуда брать реплеи)"
            value={settings.watch_folder}
            onChange={(v) => update("watch_folder", v)}
            onBrowse={() => browseFolder("watch_folder")}
            onReset={() => update("watch_folder", defaults?.watch_folder ?? "")}
            mode="folder"
            placeholder="C:/Videos/Recordings"
          />
          <PathInput
            label="Папка назначения (куда сохранять клипы)"
            value={settings.dest_folder}
            onChange={(v) => update("dest_folder", v)}
            onBrowse={() => browseFolder("dest_folder")}
            onReset={() => update("dest_folder", defaults?.dest_folder ?? "")}
            mode="folder"
            placeholder="C:/Videos/Clips"
          />
          <p className="text-xs text-muted-foreground mt-2!">
            Подсказка: если хотите хранить клипы в одной папке без перемещения - укажите одинаковые папки OBS и назначения, и выберите режим сортировки "Без сортировки".
          </p>
        </CardContent>
      </Card>

      {/* Сортировка */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <SortAsc className="h-4 w-4" />
            Сортировка
          </CardTitle>
          <CardDescription>Как организовывать клипы по подпапкам</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Режим сортировки</Label>
            <Select
              value={settings.sort_mode}
              onValueChange={(v) => update("sort_mode", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="game">По игре</SelectItem>
                <SelectItem value="date">По дате</SelectItem>
                <SelectItem value="none">Без сортировки</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {settings.sort_mode === "date" && (
            <div className="space-y-1.5">
              <Label>Формат папки по дате</Label>
              <div className="flex gap-2">
                <Input
                  value={settings.sort_date_format}
                  onChange={(e) => update("sort_date_format", e.target.value)}
                  placeholder="{year}-{month}"
                />
                <Button variant="ghost" size="icon" onClick={() => update("sort_date_format", defaults?.sort_date_format ?? "")}>
                  <RotateCcw className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Предпросмотр:{" "}
                <span className="text-foreground font-mono">
                  {settings.sort_date_format
                    .replaceAll("{window}", "Cyberpunk 2077")
                    .replaceAll("{day}", "19")
                    .replaceAll("{month}", "03")
                    .replaceAll("{year}", "2026")
                    .replaceAll("{hour}", "15")
                    .replaceAll("{min}", "30")
                    .replaceAll("{sec}", "22")}
                </span>
              </p>
              <p className="text-xs text-muted-foreground mt-2!">
                Пример: <code>{"{year}/{month}"}</code> создаст 2 папки, клип сохранится в последнюю из них : <code>2026/03</code>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Шаблон имени файла */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileVideo className="h-4 w-4" />
            Имя файла
          </CardTitle>
          <CardDescription>Как называть сохранённые клипы</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label>Шаблон</Label>
            <div className="flex gap-2">
              <Input
                value={settings.filename_template}
                onChange={(e) => update("filename_template", e.target.value)}
                placeholder="{window} {day}-{month}-{year}"
              />
              <Button variant="ghost" size="icon" onClick={() => update("filename_template", defaults?.filename_template ?? "")}>
                <RotateCcw className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Вставить токен</Label>
            <div className="flex flex-wrap gap-1.5">
              {TOKENS.map(({ token, desc }) => (
                <Button
                  key={token}
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs font-mono"
                  onClick={() => insertToken(token)}
                  title={desc}
                >
                  {token}
                </Button>
              ))}
            </div>
          </div>
          {settings.filename_template && (
            <p className="text-xs text-muted-foreground">
              Предпросмотр:{" "}
              <span className="text-foreground font-mono">
                {settings.filename_template
                  .replaceAll("{window}", "Cyberpunk 2077")
                  .replaceAll("{day}", "19")
                  .replaceAll("{month}", "03")
                  .replaceAll("{year}", "2026")
                  .replaceAll("{hour}", "15")
                  .replaceAll("{min}", "30")
                  .replaceAll("{sec}", "22")}
                .mp4
              </span>
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-2!">
            Подсказка: вы можете вписать свои слова в строку
          </p>
        </CardContent>
      </Card>

      {/* Звук */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Volume2 className="h-4 w-4" />
            Звук
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Звуковое уведомление</Label>
            <Switch
              checked={settings.sound_enabled}
              onCheckedChange={(v) => update("sound_enabled", v)}
            />
          </div>

          {settings.sound_enabled && (
            <>
              <PathInput
                label="Путь к файлу звука"
                value={settings.sound_file}
                onChange={(v) => update("sound_file", v)}
                onBrowse={() => browseFile("sound_file")}
                onReset={() => update("sound_file", defaults?.sound_file ?? "")}
                mode="file"
                placeholder="C:/sounds/done.wav"
              />
              <p className="text-xs text-muted-foreground mt-2!">
                Поддерживаемые форматы: .flac, .wav, .ogg
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Громкость уведомления</Label>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(settings.notification_volume * 100)}%
                  </span>
                </div>
                <Slider
                  min={0}
                  max={1}
                  step={0.01}
                  value={[settings.notification_volume]}
                  onValueChange={([v]) => update("notification_volume", v)}
                />
              </div>
            </>
          )}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Громкость воспроизведения видео по умолчанию</Label>
              <span className="text-sm text-muted-foreground">
                {Math.round(settings.player_default_volume * 100)}%
              </span>
            </div>
            <Slider
              min={0}
              max={1}
              step={0.01}
              value={[settings.player_default_volume]}
              onValueChange={([v]) => update("player_default_volume", v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Система */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Play className="h-4 w-4" />
            Система
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Автозапуск с Windows</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Запускать Rexer при входе в систему
              </p>
            </div>
            <Switch
              checked={settings.autostart}
              onCheckedChange={(v) => update("autostart", v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Автопроигрывание видео</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Воспроизводить видео в сетке при наведении мышью
              </p>
            </div>
            <Switch
              checked={settings.hover_playback}
              onCheckedChange={(v) => update("hover_playback", v)}
            />
          </div>
        </CardContent>
      </Card>
      {/* Расширенные настройки */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BrainCircuit className="h-4 w-4" />
            Расширенные настройки
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col justify-between gap-5">
            <div className="text-left">
              <Label>Качество кэша картинок на таймлайне</Label>
              <div className="text-xs text-muted-foreground mt-0.5">
                <p>Определяет качество картинок, которые вы видите при наведении на таймлайн при просмотре видео. Чем больше число - тем хуже качество. Значение по умолчанию - 10, этого достаточно для большинства случаев. Полезно повысить и пересоздать кэш, если у вас много клипов и жалко места.
                  <br /><br />1 - лучшее качество, наибольший размер
                  <br />31 - худшее качество, маленький размер
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Slider
                min={1}
                max={31}
                step={1}
                value={[settings.tileset_quality]}
                onValueChange={([v]) => update("tileset_quality", v)}
              />
              <span className="text-sm text-muted-foreground ml-auto">
                {settings.tileset_quality}
              </span>
              <Button variant="ghost" size="icon" onClick={() => update("tileset_quality", defaults?.tileset_quality ?? "")}>
                <RotateCcw className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="fixed bottom-6 right-20">
        <Button onClick={save} size="lg" className="gap-2 shadow-lg">
          <Save className="h-4 w-4" />
          {saved ? "Сохранено!" : "Сохранить"}
        </Button>
      </div>

    </div>
  );
};

export default SettingsPage;