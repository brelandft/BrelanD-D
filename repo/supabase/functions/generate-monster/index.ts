// supabase/functions/generate-monster/index.ts
//
// Deno Edge Function. Deploy with:
//   supabase functions deploy generate-monster
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//   supabase secrets set APP_SHARED_SECRET=<pick something random>
//
// The frontend calls this function (never the Anthropic API directly),
// sending the APP_SHARED_SECRET as a header. This isn't user-level auth
// — it's just enough friction that a scraped/public function URL can't
// be hit by randoms on the internet. Combined with the generation_log
// rate limit below, it keeps API costs bounded even if the URL leaks.

import { createClient } from "npm:@supabase/supabase-js@2";

const RATE_LIMIT_PER_HOUR = 20;

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const appSecret = req.headers.get("x-app-secret");
  if (appSecret !== Deno.env.get("APP_SHARED_SECRET")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // --- rate limit check ---
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error: countErr } = await supabaseAdmin
    .from("generation_log")
    .select("*", { count: "exact", head: true })
    .gte("created_at", oneHourAgo);

  if (countErr) {
    return new Response(JSON.stringify({ error: countErr.message }), { status: 500 });
  }
  if ((count ?? 0) >= RATE_LIMIT_PER_HOUR) {
    return new Response(
      JSON.stringify({ error: "Rate limit reached. Try again later." }),
      { status: 429 }
    );
  }

  const { description } = await req.json();
  if (!description || typeof description !== "string") {
    return new Response(JSON.stringify({ error: "Missing 'description' string in body" }), {
      status: 400,
    });
  }

  // --- log this request before calling Claude, so a burst of concurrent
  //     requests can't all slip through before the count updates ---
  await supabaseAdmin.from("generation_log").insert({
    request_ip: req.headers.get("x-forwarded-for") ?? "unknown",
  });

  const systemPrompt = `You generate D&D 5e-style monster stat blocks as JSON only, no prose, no markdown fences.
Return an object with exactly these keys, matching this app's monsters table:
name (string), challenge_rating (number), size (string), type (string), alignment (string),
ac (number), hp_average (number), hp_dice (string, e.g. "9d8+9"), speed (object, e.g. {"walk":30}),
abilities (object with str/dex/con/int/wis/cha as numbers),
damage_resistances (string or null), damage_immunities (string or null), condition_immunities (string or null),
senses (string), languages (string),
traits (array of {name, description}), actions (array of {name, description}), legendary_actions (array),
description (string, 1-2 sentences of flavor text).
Balance the stat block reasonably for the requested concept. Output ONLY the JSON object.`;

  const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": Deno.env.get("ANTHROPIC_API_KEY")!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: "user", content: description }],
    }),
  });

  if (!claudeRes.ok) {
    const errText = await claudeRes.text();
    return new Response(JSON.stringify({ error: `Claude API error: ${errText}` }), {
      status: 502,
    });
  }

  const claudeData = await claudeRes.json();
  const textBlock = claudeData.content?.find((b: any) => b.type === "text");
  if (!textBlock) {
    return new Response(JSON.stringify({ error: "No text in Claude response" }), { status: 502 });
  }

  let monster;
  try {
    monster = JSON.parse(textBlock.text.trim());
  } catch {
    return new Response(
      JSON.stringify({ error: "Claude didn't return valid JSON", raw: textBlock.text }),
      { status: 502 }
    );
  }

  monster.source = "homebrew";
  monster.generated_by_claude = true;

  const { data: inserted, error: insertErr } = await supabaseAdmin
    .from("monsters")
    .insert(monster)
    .select()
    .single();

  if (insertErr) {
    return new Response(JSON.stringify({ error: insertErr.message, monster }), { status: 500 });
  }

  return new Response(JSON.stringify({ monster: inserted }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
