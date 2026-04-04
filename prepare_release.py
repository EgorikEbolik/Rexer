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
    content = PYPROJECT.read_text(encoding="utf-8")
    new_content = re.sub(
        r'(?<=^version = )".*?"', f'"{version}"', content, flags=re.MULTILINE
    )
    PYPROJECT.write_text(new_content, encoding="utf-8")


def get_previous_tag(version):
    tags = subprocess.check_output(
        ["git", "tag", "--sort=-v:refname"], text=True
    ).splitlines()
    current = f"v{version}"
    for tag in tags:
        if tag != current:
            return tag
    return None


def get_commits_since(prev_tag):
    if prev_tag:
        cmd = ["git", "log", "--pretty=format:%s", f"{prev_tag}..HEAD"]
    else:
        cmd = ["git", "log", "--pretty=format:%s"]
    out = subprocess.check_output(cmd, text=True).strip()
    return [line for line in out.splitlines() if line]


def generate_changelog(version, commits):
    lines = [f"## {version}"]
    groups = {"FEAT": "Новое", "FIX": "Исправлено", "BUILD": "Сборка", "MISC": "Прочее"}
    grouped = {k: [] for k in groups}
    for subject in commits:
        matched = False
        for prefix in groups:
            if subject.upper().startswith(prefix + ":"):
                clean = subject[len(prefix) + 1 :].strip()
                grouped[prefix].append(clean)
                matched = True
                break
        if not matched:
            grouped["MISC"].append(subject)
    for cat, label in groups.items():
        if grouped[cat]:
            lines.append(f"\n### {label}")
            lines.extend(f"- {msg}" for msg in grouped[cat])
    if len(lines) == 1:
        lines.append("\n*Нет изменений*")
    return "\n".join(lines)


if __name__ == "__main__":
    version = get_version()
    update_pyproject(version)
    prev = get_previous_tag(version)
    commits = get_commits_since(prev)
    changelog = generate_changelog(version, commits)
    (ROOT / "release_notes.md").write_text(changelog, encoding="utf-8")
    print(f"Created {len(commits)} entries in version {version} changelog")
