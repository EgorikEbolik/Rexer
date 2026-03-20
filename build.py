import subprocess
import shutil
from pathlib import Path

print("Чистим старые сборки...")
for folder in ["dist", "build", "frontend/dist", "release"]:
    if Path(folder).exists():
        shutil.rmtree(folder)
        print(f"  Удалено: {folder}")

print("Собираем фронт...")
subprocess.run(["npm", "run", "build"], cwd="frontend", check=True, shell=True)

print("Собираем .exe...")
subprocess.run([
    "uv", "run", "pyinstaller",
    "--onedir",
    "--windowed",
    "--icon=resources/icon.ico",
    "--add-data", "resources;resources",
    "--add-data", "frontend/dist;static",
    "--name", "Rexer",
    "backend/main.py"
], check=True, shell=True)

# Копируем всю папку сборки
output = Path("release")
if output.exists():
    shutil.rmtree(output)

# Исходная папка после сборки: dist/Rexer/
src = Path("dist/Rexer")
shutil.copytree(src, output)

print(f"Готово! Папка: {output.absolute()}")