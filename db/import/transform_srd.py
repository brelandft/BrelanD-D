"""
transform_srd.py

Transforms the open-source 5e SRD dataset (5e-bits/5e-database, CC-BY-4.0
content) into JSON files matching our app's schema (see db/schema.sql).

Usage:
    git clone --depth 1 https://github.com/5e-bits/5e-database.git
    python3 transform_srd.py ./5e-database/src/2014/en ./output_dir

Output: races.json, classes.json, subclasses.json, feats.json,
        backgrounds.json, items.json, spells.json, monsters.json
        — each an array of rows ready to upsert into the matching table.

Re-run this whenever the source dataset updates, or to regenerate after
schema changes. Homebrew content is added separately (never touched by
this script) — see db/import/load_to_supabase.mjs for how both get pushed
into Supabase.
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


def transform_races(src_dir):
    races = load(src_dir, "5e-SRD-Races.json")
    subraces = load(src_dir, "5e-SRD-Subraces.json")
    traits = {t["index"]: t for t in load(src_dir, "5e-SRD-Traits.json")}

    subraces_by_race = defaultdict(list)
    for sr in subraces:
        subraces_by_race[sr["race"]["index"]].append({
            "name": sr["name"],
            "description": joined_desc(sr.get("desc")),
            "ability_score_bonuses": {
                b["ability_score"]["index"]: b["bonus"]
                for b in sr.get("ability_bonuses", [])
            },
            "traits": [
                {
                    "name": t["name"],
                    "description": joined_desc(
                        traits.get(t["index"], {}).get("desc")
                    ),
                }
                for t in sr.get("racial_traits", [])
            ],
        })

    out = []
    for r in races:
        out.append({
            "name": r["name"],
            "source": "srd",
            "size": r.get("size"),
            "speed": r.get("speed"),
            "ability_score_bonuses": {
                b["ability_score"]["index"]: b["bonus"]
                for b in r.get("ability_bonuses", [])
            },
            "traits": [
                {
                    "name": t["name"],
                    "description": joined_desc(
                        traits.get(t["index"], {}).get("desc")
                    ),
                }
                for t in r.get("traits", [])
            ],
            "languages": [l["name"] for l in r.get("languages", [])],
            "darkvision_range": 60 if any(
                t["index"] == "darkvision" for t in r.get("traits", [])
            ) else 0,
            "subraces": subraces_by_race.get(r["index"], []),
            "description": r.get("size_description"),
        })
    return out


def transform_classes_and_subclasses(src_dir):
    classes = load(src_dir, "5e-SRD-Classes.json")
    levels = load(src_dir, "5e-SRD-Levels.json")
    features = {f["index"]: f for f in load(src_dir, "5e-SRD-Features.json")}
    prof_types = {p["index"]: p["type"] for p in load(src_dir, "5e-SRD-Proficiencies.json")}

    # class features_by_level, keyed by class index -> {level: [features]}
    class_features = defaultdict(lambda: defaultdict(list))
    subclass_features = defaultdict(lambda: defaultdict(list))
    for lvl in levels:
        class_idx = lvl["class"]["index"]
        for f_ref in lvl.get("features", []):
            f = features.get(f_ref["index"])
            if not f:
                continue
            entry = {"name": f["name"], "description": joined_desc(f.get("desc"))}
            if "subclass" in f:
                subclass_features[f["subclass"]["index"]][f["level"]].append(entry)
            else:
                class_features[class_idx][lvl["level"]].append(entry)

    classes_out = []
    subclasses_out = []
    for c in classes:
        classes_out.append({
            "name": c["name"],
            "source": "srd",
            "hit_die": f"d{c['hit_die']}",
            "primary_ability": [],  # not modeled explicitly in SRD data; leave for manual annotation
            "saving_throw_proficiencies": [s["index"] for s in c.get("saving_throws", [])],
            "armor_proficiencies": [
                p["name"] for p in c.get("proficiencies", [])
                if prof_types.get(p["index"]) == "Armor"
            ],
            "weapon_proficiencies": [
                p["name"] for p in c.get("proficiencies", [])
                if prof_types.get(p["index"]) == "Weapons"
            ],
            "skill_choices": {
                "choose": c["proficiency_choices"][0]["choose"],
                "from": [
                    opt["item"]["name"].replace("Skill: ", "")
                    for opt in c["proficiency_choices"][0]["from"].get("options", [])
                    if opt.get("option_type") == "reference"
                ],
            } if c.get("proficiency_choices") else {},
            "features_by_level": {
                str(lvl): feats for lvl, feats in sorted(class_features[c["index"]].items())
            },
            "spellcasting": bool(c.get("spellcasting")) or None,
            "description": None,
        })

        for sc_ref in c.get("subclasses", []):
            pass  # filled in below from Subclasses.json for descriptions

    subclasses_src = load(src_dir, "5e-SRD-Subclasses.json")
    for sc in subclasses_src:
        sc_features = subclass_features.get(sc["index"], {})
        unlocked_at = min(sc_features.keys()) if sc_features else 3
        subclasses_out.append({
            "class_name": sc["class"]["name"],  # resolved to class_id at load time
            "name": sc["name"],
            "source": "srd",
            "unlocked_at_level": unlocked_at,
            "features_by_level": {
                str(lvl): feats for lvl, feats in sorted(sc_features.items())
            },
            "description": joined_desc(sc.get("desc")),
        })

    return classes_out, subclasses_out


def transform_feats(src_dir):
    feats = load(src_dir, "5e-SRD-Feats.json")
    out = []
    for f in feats:
        prereq = None
        if f.get("prerequisites"):
            p = f["prerequisites"][0]
            if "ability_score" in p:
                prereq = f"{p['ability_score']['name']} {p['minimum_score']}+"
        out.append({
            "name": f["name"],
            "source": "srd",
            "prerequisite": prereq,
            "description": joined_desc(f.get("desc")),
            "benefits": f.get("desc", []),
        })
    return out


def transform_backgrounds(src_dir):
    backgrounds = load(src_dir, "5e-SRD-Backgrounds.json")
    out = []
    for b in backgrounds:
        out.append({
            "name": b["name"],
            "source": "srd",
            "skill_proficiencies": [
                p["name"].replace("Skill: ", "")
                for p in b.get("starting_proficiencies", [])
                if p["index"].startswith("skill-")
            ],
            "tool_proficiencies": [
                p["name"] for p in b.get("starting_proficiencies", [])
                if not p["index"].startswith("skill-")
            ],
            "languages": [],  # SRD backgrounds use language *choices*, not fixed languages
            "starting_equipment": [
                f"{e['quantity']}x {e['equipment']['name']}"
                for e in b.get("starting_equipment", [])
            ],
            "feature_name": b.get("feature", {}).get("name"),
            "feature_description": joined_desc(b.get("feature", {}).get("desc")),
            "description": None,
        })
    return out


def classify_item_type(e):
    cat = e.get("equipment_category", {}).get("index", "")
    if "weapon_category" in e:
        return "weapon"
    if "armor_category" in e:
        return "shield" if cat == "shields" or e.get("armor_category") == "Shield" else "armor"
    if cat in ("artisans-tools", "gaming-sets", "musical-instruments", "other-tools", "kits", "tools"):
        return "tool"
    return "gear"


def transform_items(src_dir):
    equipment = load(src_dir, "5e-SRD-Equipment.json")
    magic_items = load(src_dir, "5e-SRD-Magic-Items.json")
    out = []
    for e in equipment:
        damage = None
        if e.get("damage"):
            damage = {"dice": e["damage"]["damage_dice"], "type": e["damage"]["damage_type"]["name"].lower()}
        armor_class = e.get("armor_class")
        out.append({
            "name": e["name"],
            "source": "srd",
            "item_type": classify_item_type(e),
            "subtype": e.get("weapon_category") or e.get("armor_category") or e.get("equipment_category", {}).get("name"),
            "cost_gp": e.get("cost", {}).get("quantity"),
            "weight_lb": e.get("weight"),
            "damage": damage,
            "armor_class": armor_class,
            "properties": [p["name"] for p in e.get("properties", [])],
            "requires_attunement": False,
            "description": None,
        })
    for m in magic_items:
        out.append({
            "name": m["name"],
            "source": "srd",
            "item_type": "magic_item",
            "subtype": m.get("equipment_category", {}).get("name"),
            "cost_gp": None,
            "weight_lb": None,
            "damage": None,
            "armor_class": None,
            "properties": [],
            "requires_attunement": "attunement" in joined_desc(m.get("desc", [])).lower() if m.get("desc") else False,
            "description": joined_desc(m.get("desc")),
        })
    return out


def transform_spells(src_dir):
    spells = load(src_dir, "5e-SRD-Spells.json")
    out = []
    for s in spells:
        out.append({
            "name": s["name"],
            "source": "srd",
            "level": s["level"],
            "school": s.get("school", {}).get("name"),
            "casting_time": s.get("casting_time"),
            "range": s.get("range"),
            "components": s.get("components", []),
            "material": s.get("material"),
            "duration": s.get("duration"),
            "concentration": s.get("concentration", False),
            "ritual": s.get("ritual", False),
            "classes": [c["name"] for c in s.get("classes", [])],
            "description": joined_desc(s.get("desc")),
            "higher_levels": joined_desc(s.get("higher_level")),
        })
    return out


def sprite_key_for_monster_type(monster_type):
    """Maps the SRD's free-text 'type' field (e.g. 'humanoid (goblinoid)')
    to one of our 8 sprite archetypes. SRD types not covered by a dedicated
    icon get a reasonable visual fallback rather than the default."""
    if not monster_type:
        return "beast"
    t = monster_type.lower()
    direct = ["beast", "humanoid", "undead", "dragon", "fiend", "ooze", "construct", "monstrosity"]
    for key in direct:
        if key in t:
            return key
    fallbacks = {
        "giant": "humanoid", "celestial": "humanoid",
        "plant": "monstrosity", "aberration": "monstrosity",
        "elemental": "construct", "swarm": "beast",
    }
    for keyword, key in fallbacks.items():
        if keyword in t:
            return key
    return "beast"


def transform_monsters(src_dir):
    monsters = load(src_dir, "5e-SRD-Monsters.json")
    out = []
    for m in monsters:
        out.append({
            "name": m["name"],
            "source": "srd",
            "generated_by_claude": False,
            "challenge_rating": m.get("challenge_rating"),
            "size": m.get("size"),
            "type": m.get("type"),
            "sprite_key": sprite_key_for_monster_type(m.get("type")),
            "alignment": m.get("alignment"),
            "ac": (m.get("armor_class") or [{}])[0].get("value"),
            "hp_average": m.get("hit_points"),
            "hp_dice": m.get("hit_points_roll"),
            "speed": m.get("speed", {}),
            "abilities": {
                "str": m.get("strength"), "dex": m.get("dexterity"), "con": m.get("constitution"),
                "int": m.get("intelligence"), "wis": m.get("wisdom"), "cha": m.get("charisma"),
            },
            "saving_throws": {
                p["proficiency"]["index"].replace("saving-throw-", ""): p["value"]
                for p in m.get("proficiencies", [])
                if p["proficiency"]["index"].startswith("saving-throw-")
            },
            "skills": {
                p["proficiency"]["name"].replace("Skill: ", ""): p["value"]
                for p in m.get("proficiencies", [])
                if p["proficiency"]["index"].startswith("skill-")
            },
            "damage_resistances": ", ".join(m.get("damage_resistances", [])) or None,
            "damage_immunities": ", ".join(m.get("damage_immunities", [])) or None,
            "condition_immunities": ", ".join(c["name"] for c in m.get("condition_immunities", [])) or None,
            "senses": ", ".join(f"{k} {v}" for k, v in m.get("senses", {}).items()) or None,
            "languages": m.get("languages"),
            "traits": [
                {"name": a["name"], "description": joined_desc(a.get("desc"))}
                for a in m.get("special_abilities", [])
            ],
            "actions": [
                {"name": a["name"], "description": joined_desc(a.get("desc"))}
                for a in m.get("actions", [])
            ],
            "legendary_actions": [],
            "description": None,
        })
    return out


def dedupe_by_name(rows):
    """Guards against duplicate names in the upstream source data (this has
    happened — the underlying dataset has two separate index entries for
    'Potion of Healing' that both display with the same name). Keeps the
    first occurrence, drops the rest. Applied to every table since any of
    them could hit this on a future dataset update, not just items."""
    seen = set()
    out = []
    for row in rows:
        key = row["name"]
        if key in seen:
            continue
        seen.add(key)
        out.append(row)
    return out


def main():
    if len(sys.argv) != 3:
        print("Usage: python3 transform_srd.py <path-to-5e-database/src/2014/en> <output_dir>")
        sys.exit(1)

    src_dir, out_dir = sys.argv[1], sys.argv[2]
    os.makedirs(out_dir, exist_ok=True)

    datasets = {
        "races.json": transform_races(src_dir),
        "feats.json": transform_feats(src_dir),
        "backgrounds.json": transform_backgrounds(src_dir),
        "items.json": transform_items(src_dir),
        "spells.json": transform_spells(src_dir),
        "monsters.json": transform_monsters(src_dir),
    }
    classes_out, subclasses_out = transform_classes_and_subclasses(src_dir)
    datasets["classes.json"] = classes_out
    datasets["subclasses.json"] = subclasses_out

    for filename, data in datasets.items():
        deduped = dedupe_by_name(data)
        dropped = len(data) - len(deduped)
        path = os.path.join(out_dir, filename)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(deduped, f, indent=2)
        note = f" ({dropped} duplicate name(s) dropped)" if dropped else ""
        print(f"{filename}: {len(deduped)} rows{note}")


if __name__ == "__main__":
    main()
