from utils import VIDEO_EXTENSIONS
from paths import get_cache_dir
from ffmpegManager import get_ffmpeg_bin
from settings import settings

from hashlib import md5 
from pathlib import Path
from shutil import rmtree
import ffmpeg
from loguru import logger


def get_thumbnail_path(clip_path: Path) -> Path:
  md5_hash = md5(str(clip_path).encode()).hexdigest()
  path_hash = get_cache_dir() / md5_hash / "thumbnail.jpg"
  return path_hash

def generate_thumbnail(clip_path:Path):
  clip_path = Path(clip_path)
  try:
    thumbnail_path = get_thumbnail_path(clip_path)
    if thumbnail_path.exists():
      logger.debug(f"Обложка для видео {clip_path.stem} уже существует")
      return thumbnail_path
    
    thumbnail_path.parent.mkdir(parents=True, exist_ok=True)
    (
      ffmpeg
      .input(clip_path)
      .output(str(thumbnail_path), vframes=1)
      .run(cmd=get_ffmpeg_bin(),quiet=True)
    )
    logger.debug(f"Создана обложка {thumbnail_path} для видео {clip_path.stem}")
    return thumbnail_path
  except Exception as e:
    logger.error(f"Не удалось создать обложку для видео {clip_path}, ошибка: \n{e}")
    return None

def clean_thumbnails():
  dest_folder = settings.data["dest_folder"]
  hash_set = set()
  deleted_set = set()

  for extension in VIDEO_EXTENSIONS:
    for file_path in Path(dest_folder).rglob(extension):
      hash_set.add(get_thumbnail_path(file_path).parent.name)

  for dir in get_cache_dir().iterdir():
    if dir.name not in hash_set:
      rmtree(dir)
      deleted_set.add(dir)

  logger.debug(f"Очищен кэш от {len(deleted_set)} удаленных видео, список удаленного: {deleted_set}")
  return deleted_set
