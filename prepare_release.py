import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).parent
PYPROJECT = ROOT / "pyproject.toml"


def get_version():
    tag = subprocess.check_output(
        ["git", "describe", "--tags", "--abbrev=0"], text=True
    ).strip()
    if tag.startswith("v"):
        tag = tag[1:]
    return tag


def update_pyproject(version):
    content = PYPROJECT.read_text()
    new_content = re.sub(
        r'(?<=^version = )".*?"', f'"{version}"', content, flags=re.MULTILINE
    )
    PYPROJECT.write_text(new_content)


def get_previous_tag():
    tags = subprocess.check_output(
        ["git", "tag", "--sort=-v:refname"], text=True
    ).splitlines()
    current = f"v{version}" if "version" in locals() else None
    for tag in tags:
        if tag != current:
            return tag
    return None


def get_commits_since(prev_tag):
    cmd = (
        ["git", "log", "--pretty=format:%s", f"{prev_tag}..HEAD"]
        if prev_tag
        else ["git", "log", "--pretty=format:%s"]
    )
    out = subprocess.check_output(cmd, text=True).strip()
    return [line for line in out.splitlines() if line]


def generate_changelog(version, commits):
    lines = [f"## {version}"]
    groups = {"FEAT": "Новое", "FIX": "Исправлено", "BUILD": "Сборка", "MISC": "Прочее"}
    grouped = {k: [] for k in groups}
    for subject in commits:
        for prefix in groups:
            if subject.upper().startswith(prefix + ":"):
                clean = subject[len(prefix) + 1 :].strip()
                grouped[prefix].append(clean)
                break
        else:
            grouped["MISC"].append(subject)
    for cat, label in groups.items():
        if grouped[cat]:
            lines.append(f"\n### {label}")
            lines.extend(f"- {msg}" for msg in grouped[cat])
    return "\n".join(lines)


if __name__ == "__main__":
    version = get_version()
    update_pyproject(version)
    prev = get_previous_tag()
    commits = get_commits_since(prev)
    changelog = generate_changelog(version, commits)
    (ROOT / "release_notes.md").write_text(changelog)
    print(f"Для версии {version} готово {len(commits)} записей в changelog ")
