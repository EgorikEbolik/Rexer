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
    "--onefile",
    "--windowed",
    "--icon=resources/icon.ico",
    "--add-data", "resources/icon.ico;resources",
    "--add-data", "frontend/dist;static",
    "--name", "Rexer",
    "backend/main.py"
], check=True, shell=True)

output = Path("release")
if output.exists():
    shutil.rmtree(output)
output.mkdir()

shutil.copy("dist/Rexer.exe", output / "Rexer.exe")

resources = output / "resources"
resources.mkdir()
shutil.copy("resources/done.wav", resources / "done.wav")

print(f"Готово! Папка: {output.absolute()}")