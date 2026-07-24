"""
add_2024_srd_species.py

Merges SRD 5.2 (2024) species/subspecies data into db/seed/srd/races.json:
- Existing races (Dwarf, Elf, Halfling, Gnome, Dragonborn, Tiefling) get
  their subraces list expanded with 2024 lineages/ancestries, matched
  in alongside whatever 2014 SRD subraces are already there.
- Two new races 2024 rules introduced (Goliath, Orc) get added outright.
- Human, Half-Elf, Half-Orc are untouched (Half-Elf/Half-Orc don't exist
  as distinct species in 2024 rules; Human has no subraces in either era).

Note: 2024 rules moved ability score increases from race to background,
so these merged/new races and subraces don't carry ability_score_bonuses
— that's not missing data, it's the actual 2024 rule.

Usage:
    python3 add_2024_srd_species.py <path-to-5e-database/src/2024/en> <seed_dir>
"""

import json
import re
import sys
import os


def load(src_dir, filename):
    with open(os.path.join(src_dir, filename), encoding="utf-8") as f:
        return json.load(f)


def darkvision_range(traits):
    for t in traits:
        m = re.search(r"Darkvision \((\d+) ft\.\)", t.get("name", ""))
        if m:
            return int(m.group(1))
    return 0


def main():
    if len(sys.argv) != 3:
        print("Usage: python3 add_2024_srd_species.py <path-to-5e-database/src/2024/en> <seed_dir>")
        sys.exit(1)

    src_dir, seed_dir = sys.argv[1], sys.argv[2]
    races_path = os.path.join(seed_dir, "races.json")

    species = load(src_dir, "5e-SRD-Species.json")
    subspecies = load(src_dir, "5e-SRD-Subspecies.json")
    traits_by_index = {t["index"]: t for t in load(src_dir, "5e-SRD-Traits.json")}

    def resolve_traits(trait_refs):
        out = []
        for t in trait_refs:
            full = traits_by_index.get(t["index"], {})
            out.append({"name": t["name"], "description": full.get("description")})
        return out

    # Build subrace entries per species name
    subraces_by_species = {}
    for sub in subspecies:
        species_name = sub["species"]["name"]
        resolved = resolve_traits(sub.get("traits", []))
        desc = " ".join(f"{t['name']}." for t in resolved if t["name"])
        subraces_by_species.setdefault(species_name, []).append({
            "name": sub["name"],
            "description": desc or None,
            "ability_score_bonuses": {},  # 2024 rules: abilities come from background, not species
            "traits": resolved,
        })

    existing = json.load(open(races_path)) if os.path.exists(races_path) else []
    existing_by_name = {r["name"]: r for r in existing}

    updated_count = 0
    added_count = 0

    for sp in species:
        name = sp["name"]
        resolved_traits = resolve_traits(sp.get("traits", []))
        new_subraces = subraces_by_species.get(name, [])

        if name in existing_by_name:
            race = existing_by_name[name]
            existing_subrace_names = {s["name"] for s in race.get("subraces", [])}
            for ns in new_subraces:
                if ns["name"] not in existing_subrace_names:
                    race.setdefault("subraces", []).append(ns)
                    updated_count += 1
        else:
            # New race entirely (Goliath, Orc)
            existing_by_name[name] = {
                "name": name,
                "source": "srd",
                "size": sp.get("size"),
                "speed": sp.get("speed"),
                "ability_score_bonuses": {},  # 2024 rules
                "traits": resolved_traits,
                "languages": ["Common"],
                "darkvision_range": darkvision_range(resolved_traits),
                "subraces": new_subraces,
                "description": None,
            }
            added_count += 1

    merged = list(existing_by_name.values())
    with open(races_path, "w") as f:
        json.dump(merged, f, indent=2)

    print(f"{updated_count} new subraces merged into existing races")
    print(f"{added_count} new races added (Goliath, Orc)")
    print(f"races.json now has {len(merged)} races total")


if __name__ == "__main__":
    main()
