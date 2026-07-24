"""
add_2024_srd_backgrounds_subclasses.py

Adds backgrounds and subclasses from SRD 5.2 (the 2024 Player's Handbook's
CC-BY-licensed open content) to the existing db/seed/srd/*.json files,
alongside whatever's already there from the 2014 SRD import. Same-named
entries (e.g. "Champion" appears in both eras for Fighter, "Acolyte" for
background) will just update in place via the upsert-based loader —
everything else is added as new rows.

Usage:
    python3 add_2024_srd_backgrounds_subclasses.py <path-to-5e-database/src/2024/en> <seed_dir>
"""

import json
import sys
import os
from collections import defaultdict


def load(src_dir, filename):
    with open(os.path.join(src_dir, filename), encoding="utf-8") as f:
        return json.load(f)


def joined_desc(desc):
    if desc is None:
        return None
    if isinstance(desc, list):
        return "\n".join(desc)
    return desc


def transform_backgrounds_2024(src_dir):
    backgrounds = load(src_dir, "5e-SRD-Backgrounds.json")
    out = []
    for b in backgrounds:
        abilities = ", ".join(a["name"].upper() for a in b.get("ability_scores", []))
        feat = b.get("feat", {})
        feat_desc = f"{feat.get('name')}" + (f" ({feat['note']})" if feat.get("note") else "") if feat else None

        equipment_desc = []
        for opt in b.get("equipment_options", []):
            if opt.get("desc"):
                equipment_desc.append(opt["desc"])

        description_parts = []
        if abilities:
            description_parts.append(f"Eligible ability scores: {abilities}.")
        if feat_desc:
            description_parts.append(f"Origin feat: {feat_desc}.")

        out.append({
            "name": b["name"],
            "source": "srd",
            "skill_proficiencies": [
                p["name"].replace("Skill: ", "") for p in b.get("proficiencies", [])
                if p["index"].startswith("skill-")
            ],
            "tool_proficiencies": [
                p["name"].replace("Tool: ", "") for p in b.get("proficiencies", [])
                if p["index"].startswith("tool-")
            ],
            "languages": [],
            "starting_equipment": equipment_desc,
            "feature_name": None,
            "feature_description": None,
            "description": " ".join(description_parts) or None,
        })
    return out


def transform_subclasses_2024(src_dir):
    subclasses = load(src_dir, "5e-SRD-Subclasses.json")
    out = []
    for sc in subclasses:
        features = sc.get("features", [])
        by_level = defaultdict(list)
        for f in features:
            by_level[f["level"]].append({"name": f["name"], "description": joined_desc(f.get("description"))})
        unlocked_at = min(by_level.keys()) if by_level else 3

        out.append({
            "class_name": sc["class"]["name"],
            "name": sc["name"],
            "source": "srd",
            "unlocked_at_level": unlocked_at,
            "features_by_level": {str(lvl): feats for lvl, feats in sorted(by_level.items())},
            "description": sc.get("description") or sc.get("summary"),
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
        print("Usage: python3 add_2024_srd_backgrounds_subclasses.py <path-to-5e-database/src/2024/en> <seed_dir>")
        sys.exit(1)

    src_dir, seed_dir = sys.argv[1], sys.argv[2]

    backgrounds_path = os.path.join(seed_dir, "backgrounds.json")
    subclasses_path = os.path.join(seed_dir, "subclasses.json")

    existing_backgrounds = json.load(open(backgrounds_path)) if os.path.exists(backgrounds_path) else []
    existing_subclasses = json.load(open(subclasses_path)) if os.path.exists(subclasses_path) else []

    new_backgrounds = transform_backgrounds_2024(src_dir)
    new_subclasses = transform_subclasses_2024(src_dir)

    merged_backgrounds = merge_by_name(existing_backgrounds, new_backgrounds)
    merged_subclasses = merge_by_name(existing_subclasses, new_subclasses)

    with open(backgrounds_path, "w") as f:
        json.dump(merged_backgrounds, f, indent=2)
    with open(subclasses_path, "w") as f:
        json.dump(merged_subclasses, f, indent=2)

    print(f"backgrounds.json: {len(existing_backgrounds)} existing + {len(new_backgrounds)} from 2024 SRD -> {len(merged_backgrounds)} total")
    print(f"subclasses.json: {len(existing_subclasses)} existing + {len(new_subclasses)} from 2024 SRD -> {len(merged_subclasses)} total")


if __name__ == "__main__":
    main()
