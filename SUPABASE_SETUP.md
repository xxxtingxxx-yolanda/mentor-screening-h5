# Supabase 接入说明（简历直投）

## 1. 前端配置
编辑 `docs/config.js`（本地调试可同步改 `app/src/main/assets/h5/config.js`）：

```js
window.__SUPABASE_URL__ = "https://你的项目ref.supabase.co";
window.__SUPABASE_ANON_KEY__ = "你的anon key";
window.__SUPABASE_BUCKET__ = "resume_uploads";
window.__SUPABASE_TABLE__ = "direct_applications";

// 可选：通知 webhook（建议用 Supabase Edge Function）
window.__NOTIFY_WEBHOOK_URL__ = "https://你的项目ref.supabase.co/functions/v1/notify-owner";
window.__NOTIFY_WEBHOOK_SECRET__ = "你自己设置的密钥";
window.__OWNER_EMAIL__ = "1459713776@qq.com";
```

## 2. 建表与存储桶
在 Supabase SQL Editor 执行：

```sql
create table if not exists public.direct_applications (
  id bigint generated always as identity primary key,
  mentor_id text not null,
  mentor_name text not null,
  mentor_direction text,
  student_name text not null,
  student_phone text not null,
  student_email text not null,
  intro text,
  resume_bucket text not null default 'resume_uploads',
  resume_path text not null,
  resume_name text not null,
  submit_source text default 'h5',
  status text default 'submitted',
  created_at timestamptz not null default now()
);

alter table public.direct_applications enable row level security;

drop policy if exists "anon_insert_direct_applications" on public.direct_applications;
create policy "anon_insert_direct_applications"
on public.direct_applications
for insert
to anon
with check (true);

drop policy if exists "anon_no_select_direct_applications" on public.direct_applications;
create policy "anon_no_select_direct_applications"
on public.direct_applications
for select
to anon
using (false);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'resume_uploads',
  'resume_uploads',
  false,
  10485760,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do nothing;

drop policy if exists "anon_insert_resume_uploads" on storage.objects;
create policy "anon_insert_resume_uploads"
on storage.objects
for insert
to anon
with check (bucket_id = 'resume_uploads');

drop policy if exists "anon_no_select_resume_uploads" on storage.objects;
create policy "anon_no_select_resume_uploads"
on storage.objects
for select
to anon
using (false);
```

说明：这样可以保证“任何人可上传”，但匿名用户不能读取简历文件和投递记录；你可在 Supabase 后台查看。

## 3. 邮件通知（可选）
你可以用 Supabase Edge Function 做通知。前端提交成功后会请求 `__NOTIFY_WEBHOOK_URL__`。

最小流程：
1. 创建函数 `notify-owner`
2. 校验 `x-webhook-secret`
3. 用邮件服务（Resend/SMTP）发给 `1459713776@qq.com`

项目里已预留函数示例文件：`supabase/functions/notify-owner/index.ts`。

## 4. 只给两位老师直投
当前前端已限定只有 `田飞` 和 `何铭锋` 显示“简历直投”按钮，其他导师仅“复制邮箱”。
