# Rexer

Утилита для Windows которая автоматически обрабатывает replay buffer из OBS Studio - переименовывает клипы по шаблону, раскладывает по папкам и уведомляет звуком.

<img width="1280" height="747" alt="Rexer_k59fUEbn3V" src="https://github.com/user-attachments/assets/c5620a29-bb80-4473-bbbe-2af69a0a2949" />
<img width="580" height="408" alt="Rexer_RTFsFyFFqt" src="https://github.com/user-attachments/assets/d2670190-b3e2-4b1b-9a0d-171a960e1ce2" />

## Что делает

- Следит за папкой куда OBS сохраняет реплеи
- При появлении нового файла определяет активное окно/игру
- Переименовывает файл по настраиваемому шаблону (`{window} {day}-{month}-{year}` и т.д.)
- Перемещает в папку назначения с сортировкой по игре или дате
- Воспроизводит звуковое уведомление
- Показывает новые клипы в интерфейсе в реальном времени.
![Rexer_ZEhoSBSssJ](https://github.com/user-attachments/assets/324b29f2-a4d0-4384-a64a-d4bd6ef51904)
![Rexer_9rK5IjfaCA](https://github.com/user-attachments/assets/c2b3f4bc-870f-47aa-9252-b104eea8c094)
<img width="261" height="247" alt="Rexer_q8fNKKN684" src="https://github.com/user-attachments/assets/162c11ae-c0a7-47a0-baaf-dc3ce755c86f" />


## Настройки

При первом запуске создаётся `config.json` с настройками по умолчанию, который хранится рядом с `Rexer.exe`. Все параметры можно изменить через интерфейс приложения или в `config.json`:

- Папка с реплеями OBS (`watch_folder`) — каталог, в котором OBS сохраняет записи. По умолчанию `%USERPROFILE%\Videos\Recordings`.
- Папка назначения для клипов (`dest_folder`) — куда будут перемещаться обработанные клипы. По умолчанию` %USERPROFILE%\Videos\Clips`.
- Шаблон имени файла (`filename_template`) — формат имени создаваемого клипа. Доступные переменные: `{window}`, `{day}`, `{month}`, `{year}`,`{hour}`, `{min}`, `{sec}`. По умолчанию: "{window} {day}-{month}-{year} {hour}-{min}-{sec}".
- Режим сортировки (`sort_mode`) — как группировать клипы в интерфейсе: "date" (по дате), "game" (по названию окна) или "none" (без сортировки). По - умолчанию "date".
- Шаблон сортировки по дате (`sort_date_format`) — формат для группировки по дате. По умолчанию "{year}-{month}".
- Звуковое уведомление (`sound_enabled`) — включить/выключить звук после обработки клипа. По умолчанию `true`.
- Файл звука (`sound_file`) — путь к WAV-файлу уведомления. По умолчанию используется встроенный `done.wav`.
- Громкость уведомления (`notification_volume`) — от 0.0 до 1.0. По умолчанию `0.5`.
- Громкость по умолчанию в плеере (`player_default_volume`) — начальная громкость при воспроизведении клипа. По умолчанию `0.5`.
- Автозапуск с Windows (`autostart`) — добавлять ли программу в автозагрузку. По умолчанию `false`.
- Воспроизведение при наведении (`hover_playback`) — запускать ли предпросмотр клипа при наведении мыши на миниатюру. По умолчанию `true`.
- Качество миниатюр (`tileset_quality`) — степень сжатия JPEG для превью на таймлайне (1 — наилучшее, 31 — наихудшее). По умолчанию `10`.

<img width="1280" height="747" alt="Rexer_OhUShsEnk9" src="https://github.com/user-attachments/assets/d203a531-60ff-4eab-9562-1921a4e7203f" />
<img width="1280" height="747" alt="Rexer_3jZEDzA1s2" src="https://github.com/user-attachments/assets/b9143f0b-b255-47db-b185-059ebcabac9d" />


## Требования системы

- Windows 10 / 11
- OBS Studio с включённым Replay Buffer
- WebView2 Runtime (обычно уже установлен на Windows 11)

## TODO

- [x] Превью клипа (извлечение первого кадра через ffmpeg)
- [x] Превью при наведении на клип
- [x] Превью на таймлайне плеера (спрайты через ffmpeg)
- [x] Обработка дубликатов файлов
- [ ] Пользовательский словарь игр (games.json)
- [ ] Автоочистка по лимиту размера папки
- [ ] Интеграция с OBS WebSocket (скрытый запуск OBS)
- [x] Обрезка клипов

## Стек

**Бэкенд:** Python 3.11, FastAPI, watchdog, pywin32, psutil, pystray, loguru, pywebview, ffmpeg-python

**Фронтенд:** React, TypeScript, Vite, Tailwind CSS, shadcn/ui, vidstack, react-virtuoso, Vercel useSWR

## Структура

```
Rexer/
├── backend/
│   ├── main.py               # точка входа
│   ├── api.py                # FastAPI + WebSocket
│   ├── monitor.py            # слежка за папкой
│   ├── fileProcessor.py      # переименование и перемещение
│   ├── windowHandler.py      # определение активного окна
│   ├── settings.py           # настройки приложения
│   ├── paths.py              # пути файловой системы
│   ├── logger.py             # логирование
│   ├── tray.py               # иконка в трее
│   ├── utils.py              # вспомогательные функции
│   ├── ffmpegManager.py      # проверка и скачивание ffmpeg
│   ├── clipEditor.py         # действия с видео
│   └── thumbnailsManager.py  # создание и очистка обложек 
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── ClipsPage.tsx
│       │   └── SettingsPage.tsx
│       └── components/
├── resources/
│   ├── icon.ico
│   └── done.wav
└── build.py              # скрипт сборки
```

## Установка для разработки

**Требования:** Python 3.11+, Node.js 18+, uv

```bash
# Клонировать репозиторий
git clone https://github.com/EgorikEbolik/Rexer
cd rexer

# Установить зависимости бэкенда
uv sync

# Установить зависимости фронтенда
cd frontend
npm install
```

**Запуск:**

```bash
# Бэкенд
uv run backend/main.py

# Фронтенд
cd frontend
npm run dev
```

## Сборка

```bash
python build.py
```

Результат появится в папке `release/`:

```
├── _internal/
│   └── resources/
│       └── done.wav
└── Rexer.exe
```

