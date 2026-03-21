import subprocess
import shutil
from pathlib import Path

print("removing old builds") 
for folder in ["dist", "build", "frontend/dist", "release"]:
    if Path(folder).exists():
        shutil.rmtree(folder)
        print(f"  Deleted: {folder}")

print("frontend") 
subprocess.run(["npm", "run", "build"], cwd="frontend", check=True, shell=True)

print(".exe") 
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

output = Path("release")
if output.exists():
    shutil.rmtree(output)

src = Path("dist/Rexer")
shutil.copytree(src, output)

print(f"Done! {output.absolute()}") 