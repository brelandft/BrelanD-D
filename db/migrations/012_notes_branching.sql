-- Migration: branching session notes
-- Additive — safe on an existing project with live data.
--
-- Lets a note nest under a parent note (e.g. a "Phandalin" hub note with
-- child notes for each quest branch), so DMs prepping a hub-and-branches
-- adventure (like a town with a quest board) can lay out the whole tree
-- ahead of time and expand only the branch the players actually pick.
-- order_index controls display order among siblings.

alter table campaign_notes add column parent_id uuid references campaign_notes(id) on delete cascade;
alter table campaign_notes add column order_index int not null default 0;
create index idx_campaign_notes_parent on campaign_notes(parent_id);
