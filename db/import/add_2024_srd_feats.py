"""
add_2024_srd_feats.py

Adds feats from SRD 5.2 (the 2024 Player's Handbook's CC-BY-licensed open
content) to db/seed/srd/feats.json, alongside whatever's already there from
the 2014 SRD import (which only ever included one feat, Grappler — the 2014
SRD barely covered feats at all). Same-named entries update in place via the
upsert-based loader; everything else is added as new rows.

Usage:
    python3 add_2024_srd_feats.py <path-to-5e-database/src/2024/en> <seed_dir>
"""

import json
import sys
import os

TYPE_LABELS = {
    "origin": "Origin",
    "general": "General",
    "fighting-style": "Fighting Style",
    "epic-boon": "Epic Boon",
}


def load(src_dir, filename):
    with open(os.path.join(src_dir, filename), encoding="utf-8") as f:
        return json.load(f)


def prerequisite_text(feat):
    opts = feat.get("prerequisite_options")
    if opts and opts.get("desc"):
        return opts["desc"]
    prereqs = feat.get("prerequisites") or {}
    if prereqs.get("minimum_level"):
        return f"Level {prereqs['minimum_level']}+"
    if prereqs.get("feature_named"):
        return f"{prereqs['feature_named']} feature"
    return None


def transform_feats_2024(src_dir):
    feats = load(src_dir, "5e-SRD-Feats.json")
    out = []
    for f in feats:
        description = f.get("description") or ""
        type_label = TYPE_LABELS.get(f.get("type"))
        if type_label:
            description = f"({type_label} feat) {description}"
        if f.get("repeatable"):
            description = f"{description}\n{f['repeatable']}"

        out.append({
            "name": f["name"],
            "source": "srd",
            "prerequisite": prerequisite_text(f),
            "description": description,
            "benefits": [line for line in description.split("\n") if line.strip()],
        })
    return out


def merge_by_name(existing, new_rows):
    """Existing 2014 entries stay; 2024 entries with a matching name update
    in place, everything else gets appended as new."""
    by_name = {row["name"]: row for row in existing}
    for row in new_rows:
        by_name[row["name"]] = row  # 2024 data wins on exact name collision
    return list(by_name.values())


def main():
    if len(sys.argv) != 3:
        print("Usage: python3 add_2024_srd_feats.py <path-to-5e-database/src/2024/en> <seed_dir>")
        sys.exit(1)

    src_dir, seed_dir = sys.argv[1], sys.argv[2]
    feats_path = os.path.join(seed_dir, "feats.json")

    existing_feats = json.load(open(feats_path, encoding="utf-8")) if os.path.exists(feats_path) else []
    new_feats = transform_feats_2024(src_dir)
    merged_feats = merge_by_name(existing_feats, new_feats)

    with open(feats_path, "w", encoding="utf-8") as f:
        json.dump(merged_feats, f, indent=2)

    print(f"feats.json: {len(existing_feats)} existing + {len(new_feats)} from 2024 SRD -> {len(merged_feats)} total")


if __name__ == "__main__":
    main()
