-- 007 — Customer/admin chat with participant-only access.

create table if not exists public.chat_conversations (
  conversation_id uuid primary key default gen_random_uuid(),
  customer_id uuid not null unique references public.customer(customer_id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  message_id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.chat_conversations(conversation_id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index if not exists idx_chat_messages_conversation_created
  on public.chat_messages (conversation_id, created_at);

create or replace function public.chat_customer_for_user(p_user_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select c.customer_id
  from public.customer c
  where c.user_id = p_user_id;
$$;

create or replace function public.get_or_create_chat_conversation(p_customer_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  conversation uuid;
begin
  if not (public.is_admin() or p_customer_id = public.chat_customer_for_user(auth.uid())) then
    raise exception 'You are not allowed to access this conversation';
  end if;

  insert into public.chat_conversations (customer_id)
  values (p_customer_id)
  on conflict (customer_id) do update set updated_at = now()
  returning conversation_id into conversation;

  return conversation;
end;
$$;

create or replace function public.send_chat_message(
  p_conversation_id uuid,
  p_body text
)
returns table (
  message_id uuid,
  conversation_id uuid,
  sender_id uuid,
  body text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  conversation_customer_id uuid;
  recipient_id uuid;
  clean_body text := btrim(p_body);
begin
  select c.customer_id
    into conversation_customer_id
  from public.chat_conversations c
  where c.conversation_id = p_conversation_id;

  if conversation_customer_id is null then
    raise exception 'Conversation not found';
  end if;

  if not (public.is_admin() or conversation_customer_id = public.chat_customer_for_user(auth.uid())) then
    raise exception 'You are not allowed to send messages in this conversation';
  end if;

  if char_length(clean_body) < 1 or char_length(clean_body) > 4000 then
    raise exception 'Message must be between 1 and 4000 characters';
  end if;

  insert into public.chat_messages (conversation_id, sender_id, body)
  values (p_conversation_id, auth.uid(), clean_body)
  returning chat_messages.message_id, chat_messages.conversation_id,
    chat_messages.sender_id, chat_messages.body, chat_messages.created_at
  into message_id, conversation_id, sender_id, body, created_at;

  update public.chat_conversations
  set updated_at = now()
  where chat_conversations.conversation_id = p_conversation_id;

  if public.is_admin() then
    select c.user_id into recipient_id
    from public.customer c
    where c.customer_id = conversation_customer_id;

    if recipient_id is not null then
      insert into public.notifications (user_id, sender_id, title, message, category, link_url)
      values (recipient_id, auth.uid(), 'New message from Mlangeni', left(clean_body, 140), 'general', '/dashboard/customer/chat');
    end if;
  else
    insert into public.notifications (user_id, sender_id, title, message, category, link_url)
    select a.user_id, auth.uid(), 'New customer message', left(clean_body, 140), 'general',
      '/dashboard/admin/chat?customerId=' || conversation_customer_id::text
    from public.admin a
    where a.user_id is not null;
  end if;

  return next;
end;
$$;

create or replace function public.get_chat_recipient_emails(p_conversation_id uuid)
returns table (email text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  conversation_customer_id uuid;
begin
  select c.customer_id into conversation_customer_id
  from public.chat_conversations c
  where c.conversation_id = p_conversation_id;

  if conversation_customer_id is null then
    raise exception 'Conversation not found';
  end if;

  if public.is_admin() then
    return query
      select c.email from public.customer c
      where c.customer_id = conversation_customer_id and c.email is not null;
  elsif conversation_customer_id = public.chat_customer_for_user(auth.uid()) then
    return query
      select a.email from public.admin a
      where a.email is not null;
  else
    raise exception 'You are not allowed to access this conversation';
  end if;
end;
$$;

alter table public.chat_conversations enable row level security;
alter table public.chat_messages enable row level security;

drop policy if exists "chat participants can view conversations" on public.chat_conversations;
create policy "chat participants can view conversations"
on public.chat_conversations for select to authenticated
using (
  public.is_admin()
  or customer_id = public.chat_customer_for_user(auth.uid())
);

drop policy if exists "chat participants can view messages" on public.chat_messages;
create policy "chat participants can view messages"
on public.chat_messages for select to authenticated
using (
  exists (
    select 1 from public.chat_conversations c
    where c.conversation_id = chat_messages.conversation_id
      and (public.is_admin() or c.customer_id = public.chat_customer_for_user(auth.uid()))
  )
);

grant select on public.chat_conversations, public.chat_messages to authenticated;
revoke all on function public.chat_customer_for_user(uuid) from public, anon;
revoke all on function public.get_or_create_chat_conversation(uuid) from public, anon;
revoke all on function public.send_chat_message(uuid, text) from public, anon;
revoke all on function public.get_chat_recipient_emails(uuid) from public, anon;
grant execute on function public.chat_customer_for_user(uuid) to authenticated;
grant execute on function public.get_or_create_chat_conversation(uuid) to authenticated;
grant execute on function public.send_chat_message(uuid, text) to authenticated;
grant execute on function public.get_chat_recipient_emails(uuid) to authenticated;

drop trigger if exists set_chat_conversations_updated_at on public.chat_conversations;
create trigger set_chat_conversations_updated_at
before update on public.chat_conversations
for each row execute function public.set_updated_at();

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'chat_messages'
  ) then
    alter publication supabase_realtime add table public.chat_messages;
  end if;
end
$$;