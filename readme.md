# Rexer

Утилита для Windows которая автоматически обрабатывает replay buffer из OBS Studio - переименовывает клипы по шаблону, раскладывает по папкам и уведомляет звуком.

## Что делает

- Следит за папкой куда OBS сохраняет реплеи
- При появлении нового файла определяет активное окно/игру
- Переименовывает файл по настраиваемому шаблону (`{window} {day}-{month}-{year}` и т.д.)
- Перемещает в папку назначения с сортировкой по игре или дате
- Воспроизводит звуковое уведомление
- Показывает новые клипы в интерфейсе в реальном времени.

## Настройки

При первом запуске создаётся `config.json` с настройками по умолчанию, который хранится рядом с `Rexer.exe`. Все параметры можно изменить через интерфейс приложения или в `config.json`:

- Папка с реплеями OBS (`watch_folder`)
- Папка назначения для клипов (`dest_folder`)
- Шаблон имени файла (`filename_template`)
- Режим сортировки (по игре / по дате / без сортировки) (`sort_mode`)
- Шаблон сортировки по дате (`sort_date_format`)
- Звуковое уведомление и громкость (`sound_enabled, sound_volume, sound_file`)
- Автозапуск с Windows (`autostart`)

## Требования системы

- Windows 10 / 11
- OBS Studio с включённым Replay Buffer
- WebView2 Runtime (обычно уже установлен на Windows 11)

## TODO

- [ ] Превью клипа (извлечение первого кадра через ffmpeg)
- [ ] Превью при наведении на клип
- [ ] Превью на таймлайне плеера (спрайты через ffmpeg)
- [ ] Обработка дубликатов файлов
- [ ] Пользовательский словарь игр (games.json)
- [ ] Автоочистка по лимиту размера папки
- [ ] Интеграция с OBS WebSocket (скрытый запуск OBS)
- [ ] Обрезка клипов

## Стек

**Бэкенд:** Python 3.11, FastAPI, watchdog, pywin32, psutil, pystray, loguru, pywebview, ffmpeg-python

**Фронтенд:** React, TypeScript, Vite, Tailwind CSS, shadcn/ui, vidstack, react-virtuoso

## Структура

```
Rexer/
├── backend/
│   ├── main.py           # точка входа
│   ├── api.py            # FastAPI + WebSocket
│   ├── monitor.py        # слежка за папкой
│   ├── fileProcessor.py  # переименование и перемещение
│   ├── windowHandler.py  # определение активного окна
│   ├── settings.py       # настройки приложения
│   ├── paths.py          # пути файловой системы
│   ├── logger.py         # логирование
│   ├── tray.py           # иконка в трее
│   └── utils.py          # вспомогательные функции
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
release/
├──_internal
├── Rexer.exe
└── resources/
    └── done.wav
```

