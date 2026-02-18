// Supabase Edge Function (Deno)
// 部署前请在 Supabase 设置以下密钥：
// 1) WEBHOOK_SECRET
// 2) RESEND_API_KEY
// 3) OWNER_EMAIL (默认可设为 1459713776@qq.com)

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET") ?? "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const OWNER_EMAIL = Deno.env.get("OWNER_EMAIL") ?? "1459713776@qq.com";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const secret = req.headers.get("x-webhook-secret") ?? "";
  if (!WEBHOOK_SECRET || secret !== WEBHOOK_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!RESEND_API_KEY) {
    return new Response("RESEND_API_KEY not set", { status: 500 });
  }

  const payload = await req.json();

  const subject = `【导师直投】${payload.mentor_name ?? "未知导师"} - ${payload.student_name ?? "未知学生"}`;
  const html = `
    <h3>新简历直投</h3>
    <p><b>导师：</b>${payload.mentor_name ?? ""} (${payload.mentor_id ?? ""})</p>
    <p><b>方向：</b>${payload.mentor_direction ?? ""}</p>
    <p><b>学生：</b>${payload.student_name ?? ""}</p>
    <p><b>手机：</b>${payload.student_phone ?? ""}</p>
    <p><b>邮箱：</b>${payload.student_email ?? ""}</p>
    <p><b>自述：</b>${payload.intro ?? ""}</p>
    <p><b>文件桶：</b>${payload.resume_bucket ?? ""}</p>
    <p><b>文件路径：</b>${payload.resume_path ?? ""}</p>
    <p><b>提交时间：</b>${payload.submitted_at ?? ""}</p>
    <hr />
    <p>请登录 Supabase 后台查看并下载简历文件。</p>
  `;

  const resendResp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: "mentor-h5 <onboarding@resend.dev>",
      to: [OWNER_EMAIL],
      subject,
      html
    })
  });

  if (!resendResp.ok) {
    const txt = await resendResp.text();
    return new Response(`Resend error: ${txt}`, { status: 500 });
  }

  return Response.json({ ok: true });
});
