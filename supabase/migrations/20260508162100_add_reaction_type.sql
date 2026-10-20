alter table public.aggregate_reactions
add column if not exists reaction_type text not null default '❤️';

create index if not exists aggregate_reactions_target_reaction_idx
on public.aggregate_reactions(target_type, target_id, reaction_type);

create index if not exists aggregate_reactions_user_target_idx
on public.aggregate_reactions(user_id, target_type, target_id);
