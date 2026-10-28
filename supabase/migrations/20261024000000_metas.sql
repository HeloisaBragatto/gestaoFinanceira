-- Metas financeiras (porquinho de economias): controle MANUAL de objetivos.
--
-- IMPORTANTE: estas tabelas são independentes da tabela `extratos`.
-- Nenhuma contribuição cria receita, despesa ou transferência, e não há
-- chaves estrangeiras nem gatilhos ligando metas às movimentações.
--
-- Como aplicar: Supabase > SQL Editor > cole este arquivo > Run.
-- O script é idempotente (pode ser executado mais de uma vez).

create table if not exists public.metas (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome           text not null check (char_length(btrim(nome)) between 1 and 80),
  valor_alvo     numeric(14,2) not null check (valor_alvo > 0),
  valor_inicial  numeric(14,2) not null default 0 check (valor_inicial >= 0),
  data_criacao   date not null default current_date,
  data_prevista  date check (data_prevista is null or data_prevista >= data_criacao),
  categoria      text check (categoria is null or char_length(categoria) <= 40),
  descricao      text check (descricao is null or char_length(descricao) <= 500),
  criado_em      timestamptz not null default now()
);

create table if not exists public.metas_contribuicoes (
  id          uuid primary key default gen_random_uuid(),
  meta_id     uuid not null references public.metas (id) on delete cascade,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  valor       numeric(14,2) not null check (valor > 0),
  data        date not null default current_date,
  observacao  text check (observacao is null or char_length(observacao) <= 300),
  criado_em   timestamptz not null default now()
);

create index if not exists metas_user_id_idx on public.metas (user_id);
create index if not exists metas_contribuicoes_meta_id_idx on public.metas_contribuicoes (meta_id);
create index if not exists metas_contribuicoes_user_id_idx on public.metas_contribuicoes (user_id);

-- Segurança: cada usuário só enxerga e altera os próprios registros.
alter table public.metas enable row level security;
alter table public.metas_contribuicoes enable row level security;

drop policy if exists metas_select on public.metas;
drop policy if exists metas_insert on public.metas;
drop policy if exists metas_update on public.metas;
drop policy if exists metas_delete on public.metas;

create policy metas_select on public.metas
  for select to authenticated using (user_id = auth.uid());
create policy metas_insert on public.metas
  for insert to authenticated with check (user_id = auth.uid());
create policy metas_update on public.metas
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy metas_delete on public.metas
  for delete to authenticated using (user_id = auth.uid());

drop policy if exists metas_contrib_select on public.metas_contribuicoes;
drop policy if exists metas_contrib_insert on public.metas_contribuicoes;
drop policy if exists metas_contrib_update on public.metas_contribuicoes;
drop policy if exists metas_contrib_delete on public.metas_contribuicoes;

create policy metas_contrib_select on public.metas_contribuicoes
  for select to authenticated using (user_id = auth.uid());
-- A contribuição só pode ser criada/movida para uma meta do próprio usuário.
create policy metas_contrib_insert on public.metas_contribuicoes
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.metas m where m.id = meta_id and m.user_id = auth.uid())
  );
create policy metas_contrib_update on public.metas_contribuicoes
  for update to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.metas m where m.id = meta_id and m.user_id = auth.uid())
  );
create policy metas_contrib_delete on public.metas_contribuicoes
  for delete to authenticated using (user_id = auth.uid());

grant select, insert, update, delete on public.metas to authenticated;
grant select, insert, update, delete on public.metas_contribuicoes to authenticated;
