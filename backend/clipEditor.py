import os
import shutil
import tempfile
from loguru import logger
import ffmpeg
from pathlib import Path

from fileProcessor import get_available_filename
from ffmpegManager import run_ffmpeg
from thumbnailsManager import get_thumbnail_path, delete_video_cache
from settings import settings


def trim_video(
    path: str | Path,
    start_time: int | float,
    end_time: int | float,
    rewrite: bool = None,
) -> Path | None:
    try:
        if not rewrite:
            rewrite = settings.data.get("rewrite_trim")

        path = Path(path)
        start_time = float(start_time)
        end_time = float(end_time)
        if not path.exists():
            logger.error(f"Файл по пути '{path}' не существует")
            return None
        logger.debug(f"Начало обрезки, rewrite = {rewrite}")

        original_stat = path.stat()
        original_mtime = original_stat.st_mtime
        original_atime = original_stat.st_atime

        if rewrite:
            with tempfile.NamedTemporaryFile(
                suffix=path.suffix, delete=False
            ) as tmp_file:
                tmp = Path(tmp_file.name)
            tmp.unlink()

            command = ffmpeg.input(
                str(path),
                ss=start_time,
                to=end_time,
            ).output(str(tmp), c="copy")

            try:
                run_ffmpeg(command)
                shutil.move(tmp, path)
                delete_video_cache(path)
            except Exception:
                tmp.unlink(missing_ok=True)
                raise
            result_path = path
        else:
            new_path = get_available_filename(path.with_stem(f"{path.stem}_trimmed"))

            command = ffmpeg.input(
                str(path),
                ss=start_time,
                to=end_time,
            ).output(str(new_path), c="copy")

            run_ffmpeg(command)
            result_path = new_path

        try:
            os.utime(result_path, (original_atime, original_mtime))
        except Exception as e:
            logger.warning(f"Не удалось восстановить время файла {result_path}: {e}")

        logger.info(f"Обрезано видео {path}")
        return result_path
    except Exception as e:
        logger.error(f"Не удалось обрезать видео {path}, ошибка: \n{e}")
        return None
