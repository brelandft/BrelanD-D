-- Migration: origin feat link + tracked abilities
-- Additive — safe on an existing project with live data.

-- Structured link from a 2024-rules background to the feat it grants
-- (previously only existed as a sentence inside backgrounds.description,
-- e.g. "...Origin feat: Alert."). Nullable — SRD 5.1 backgrounds and
-- homebrew backgrounds won't have one.
alter table backgrounds add column origin_feat_name text;

-- Per-character freeform tracked abilities (Rage, Second Wind, Bardic
-- Inspiration, homebrew class features, etc.) — there's no catalog for
-- these (would require modeling every class's features_by_level), so
-- players enter their own: [{name, description, uses_max, uses_current,
-- recharge}].
alter table characters add column abilities_known jsonb default '[]';
