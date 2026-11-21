#!/usr/bin/env python3
"""Flag obvious error-handling anti-patterns introduced by a PR or main push.

This lightweight heuristic complements (and does not replace) human review and tests.
It checks added lines only to avoid blocking changes for legacy code outside the patch.
"""

from __future__ import annotations

import os
import re
import subprocess
import sys
from pathlib import Path

CHECKS = (
    (
        "silent exception handler",
        re.compile(r"^\s*(?:except\b[^:]*|catch\s*(?:\([^)]*\))?)\s*:\s*(?:pass|\{\s*\})\s*(?:#.*)?$"),
    ),
    (
        "raw exception returned to a client",
        re.compile(r"\b(?:detail|message|error)\s*=\s*(?:str\s*\(\s*)?(?:exc|exception|err)\b"),
    ),
    (
        "exception printed directly (may expose internals)",
        re.compile(r"\bprint\s*\(\s*(?:exc|exception|err)\b"),
    ),
    (
        "raw error object rendered in frontend",
        re.compile(r"\{\s*(?:error|err)\s*\.\s*message\s*\}"),
    ),
)


def added_lines(base: str, head: str) -> list[tuple[str, int, str]]:
    changed = subprocess.run(
        ["git", "diff", "--no-ext-diff", "--unified=0", f"{base}...{head}"],
        check=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
    ).stdout
    results: list[tuple[str, int, str]] = []
    current_file = ""
    new_line = 0
    for line in changed.splitlines():
        if line.startswith("+++ b/"):
            current_file = line[6:]
        elif line.startswith("@@"):
            match = re.search(r"\+(\d+)(?:,(\d+))?", line)
            if match:
                new_line = int(match.group(1))
        elif line.startswith("+") and not line.startswith("+++"):
            results.append((current_file, new_line, line[1:]))
            new_line += 1
        elif line.startswith(" "):
            new_line += 1
    return results


def findings_from_lines(lines: list[tuple[str, int, str]]) -> list[str]:
    findings: list[str] = []
    code_suffixes = {".py", ".js", ".jsx", ".ts", ".tsx"}
    by_file: dict[str, list[tuple[int, str]]] = {}
    for path, number, text in lines:
        if Path(path).suffix.lower() in code_suffixes:
            by_file.setdefault(path, []).append((number, text))

    for path, file_lines in by_file.items():
        for index, (number, text) in enumerate(file_lines):
            if re.match(r"^\s*except\b[^:]*:\s*(?:#.*)?$", text):
                following = file_lines[index + 1:index + 4]
                body = [line.strip() for _, line in following if line.strip() and not line.lstrip().startswith("#")]
                if body and body[0] == "pass":
                    findings.append(f"- `{path}:{number}` - silent exception handler")
                    continue
            for label, pattern in CHECKS[1:]:
                if pattern.search(text):
                    findings.append(f"- `{path}:{number}` - {label}")
    return findings


def main() -> int:
    if len(sys.argv) != 3:
        print("Usage: error_handling_audit.py BASE_SHA HEAD_SHA", file=sys.stderr)
        return 2

    try:
        lines = added_lines(sys.argv[1], sys.argv[2])
    except (OSError, subprocess.CalledProcessError) as error:
        print(f"Could not inspect the change range: {error}", file=sys.stderr)
        return 2

    findings = findings_from_lines(lines)
    summary = Path(".github/scripts/audit-checklist.md").read_text(encoding="utf-8")
    summary_path = os.environ.get("GITHUB_STEP_SUMMARY")
    if findings:
        report = "## Error-handling audit: findings\n\n" + "\n".join(findings)
        report += "\n\nResolve findings in the PR branch, or document why a finding is a false positive."
        print(report)
        if summary_path:
            with open(summary_path, "a", encoding="utf-8") as output:
                output.write(report + "\n\n" + summary)
        return 1

    report = (
        "## Error-handling audit: no high-confidence pattern flagged\n\n"
        "This heuristic is not proof that the changes are error-free. Complete the reviewer checklist below."
    )
    print(report)
    if summary_path:
        with open(summary_path, "a", encoding="utf-8") as output:
            output.write(report + "\n\n" + summary)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
