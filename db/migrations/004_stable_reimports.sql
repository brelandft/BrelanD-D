-- Migration: stable re-imports
-- Adds a unique (name, source) constraint to every reference table, so the
-- loader can upsert (update existing rows in place) instead of deleting
-- and reinserting — which breaks the moment real gameplay data (characters,
-- deployed monster tokens) references those rows by foreign key.
-- Additive and safe — doesn't touch existing data, just adds a constraint.
-- If this fails with a duplicate-name error, it means two rows already
-- share a name within the same source — tell me and we'll sort out which
-- one to rename before re-running this.

alter table races add constraint races_name_source_unique unique (name, source);
alter table classes add constraint classes_name_source_unique unique (name, source);
alter table subclasses add constraint subclasses_name_source_unique unique (name, source);
alter table feats add constraint feats_name_source_unique unique (name, source);
alter table backgrounds add constraint backgrounds_name_source_unique unique (name, source);
alter table items add constraint items_name_source_unique unique (name, source);
alter table spells add constraint spells_name_source_unique unique (name, source);
alter table monsters add constraint monsters_name_source_unique unique (name, source);
