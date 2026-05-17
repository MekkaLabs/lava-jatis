-- Lava-jatos (businesses)
create table if not exists lava_jatos (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references auth.users(id) on delete cascade,
  nome text not null,
  cidade text,
  whatsapp text,
  horario_abertura time default '08:00',
  horario_fechamento time default '18:00',
  plano text default 'starter' check (plano in ('starter','pro','enterprise')),
  ativo boolean default true,
  created_at timestamptz default now()
);

-- Servicos
create table if not exists servicos (
  id uuid default gen_random_uuid() primary key,
  lava_jato_id uuid references lava_jatos(id) on delete cascade,
  nome text not null,
  preco decimal(10,2) not null,
  duracao_min int default 30,
  ativo boolean default true
);

-- Clientes
create table if not exists clientes (
  id uuid default gen_random_uuid() primary key,
  lava_jato_id uuid references lava_jatos(id) on delete cascade,
  nome text not null,
  telefone text,
  placa text,
  pontos int default 0,
  nivel text default 'bronze',
  created_at timestamptz default now()
);

-- Fila / Atendimentos
create table if not exists atendimentos (
  id uuid default gen_random_uuid() primary key,
  lava_jato_id uuid references lava_jatos(id) on delete cascade,
  cliente_id uuid references clientes(id),
  cliente_nome text not null,
  placa text not null,
  servico_id uuid references servicos(id),
  servico_nome text not null,
  preco decimal(10,2) not null,
  status text default 'aguardando' check (status in ('aguardando','em_andamento','concluido','cancelado')),
  funcionario text,
  forma_pagamento text check (forma_pagamento in ('pix','cartao_credito','cartao_debito','dinheiro')),
  created_at timestamptz default now(),
  concluido_at timestamptz
);

-- Despesas
create table if not exists despesas (
  id uuid default gen_random_uuid() primary key,
  lava_jato_id uuid references lava_jatos(id) on delete cascade,
  descricao text not null,
  valor decimal(10,2) not null,
  categoria text check (categoria in ('produto','funcionario','energia','manutencao','outro')),
  data date default current_date
);

-- Funcionarios
create table if not exists funcionarios (
  id uuid default gen_random_uuid() primary key,
  lava_jato_id uuid references lava_jatos(id) on delete cascade,
  nome text not null,
  cargo text default 'lavador',
  ativo boolean default true,
  created_at timestamptz default now()
);

-- RLS (Row Level Security)
alter table lava_jatos enable row level security;
alter table servicos enable row level security;
alter table clientes enable row level security;
alter table atendimentos enable row level security;
alter table despesas enable row level security;
alter table funcionarios enable row level security;

-- Policies: owner can do everything
create policy "Owner full access" on lava_jatos for all using (owner_id = auth.uid());
create policy "Owner full access" on servicos for all using (lava_jato_id in (select id from lava_jatos where owner_id = auth.uid()));
create policy "Owner full access" on clientes for all using (lava_jato_id in (select id from lava_jatos where owner_id = auth.uid()));
create policy "Owner full access" on atendimentos for all using (lava_jato_id in (select id from lava_jatos where owner_id = auth.uid()));
create policy "Owner full access" on despesas for all using (lava_jato_id in (select id from lava_jatos where owner_id = auth.uid()));
create policy "Owner full access" on funcionarios for all using (lava_jato_id in (select id from lava_jatos where owner_id = auth.uid()));
