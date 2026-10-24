#!/usr/bin/env python3
"""Create Crossbow's labels, milestones and backlog issues on GitHub.

Dry run by default; pass --apply to make changes. Needs an authenticated `gh` CLI.
Re-running is safe: existing labels are updated, existing milestones and issues
(matched by title) are skipped.

    python3 .github/backlog/seed_github.py --repo OWNER/crossbow          # preview
    python3 .github/backlog/seed_github.py --repo OWNER/crossbow --apply  # create
"""
import argparse
import json
import subprocess
from pathlib import Path

HERE = Path(__file__).parent


def gh(*args, input_json=None):
    cmd = ["gh", "api", *args]
    if input_json is not None:
        cmd += ["--input", "-"]
    out = subprocess.run(cmd, input=json.dumps(input_json) if input_json is not None else None,
                         capture_output=True, text=True, check=True).stdout
    return json.loads(out) if out.strip() else None


def load(name):
    return json.loads((HERE / name).read_text(encoding="utf-8"))


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--repo", required=True, help="OWNER/NAME")
    p.add_argument("--apply", action="store_true", help="actually create (default: dry run)")
    a = p.parse_args()
    base = f"repos/{a.repo}"

    labels, milestones, issues = load("labels.json"), load("milestones.json"), load("issues.json")

    existing_labels = {l["name"] for l in gh(f"{base}/labels?per_page=100", "--paginate")} if a.apply else set()
    for l in labels:
        print(("update" if l["name"] in existing_labels else "create"), "label:", l["name"])
        if a.apply:
            if l["name"] in existing_labels:
                gh("-X", "PATCH", f"{base}/labels/{l['name']}", input_json=l)
            else:
                gh("-X", "POST", f"{base}/labels", input_json=l)

    ms_numbers = {}
    if a.apply:
        ms_numbers = {m["title"]: m["number"] for m in gh(f"{base}/milestones?state=all&per_page=100")}
    for m in milestones:
        if m["title"] in ms_numbers:
            print("skip milestone (exists):", m["title"])
            continue
        print("create milestone:", m["title"], m.get("due_on", "(no due date)"))
        if a.apply:
            if "due_on" in m:
                m = {**m, "due_on": m["due_on"] + "T23:59:59Z"}
            created = gh("-X", "POST", f"{base}/milestones", input_json=m)
            ms_numbers[m["title"]] = created["number"]

    existing_issues = set()
    if a.apply:
        existing_issues = {i["title"] for i in gh(f"{base}/issues?state=all&per_page=100", "--paginate")}
    for i in issues:
        if i["title"] in existing_issues:
            print("skip issue (exists):", i["title"])
            continue
        print(f"create issue [{i['milestone']}]:", i["title"])
        if a.apply:
            gh("-X", "POST", f"{base}/issues", input_json={
                "title": i["title"], "body": i["body"].replace("../blob/main/", f"https://github.com/{a.repo}/blob/main/"), "labels": i["labels"],
                "milestone": ms_numbers[i["milestone"]],
            })

    if not a.apply:
        print(f"\nDry run: {len(labels)} labels, {len(milestones)} milestones, {len(issues)} issues. Re-run with --apply.")


if __name__ == "__main__":
    main()
