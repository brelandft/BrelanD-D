// frontend/src/lib/generateMonster.js
//
// Calls the generate-monster Edge Function (Claude proxy). Server-side
// rate limit: 20/hour (see supabase/functions/generate-monster).
// Requires the shared secret as a header -- this is "enough friction to
// stop a scraped URL from being hit by strangers," not real auth. The
// Anthropic key and Supabase service_role key never appear here.
//
// NOTE: this repo/site is public, so this value is visible to anyone
// who inspects the built JS bundle. See README security note.

const APP_SHARED_SECRET = "2bdcf0068380523c378dd16195f0526c808134c6764a6fcd";

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-monster`;

export async function generateMonster(description) {
  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-app-secret": APP_SHARED_SECRET,
    },
    body: JSON.stringify({ description }),
  });

const data = await res.json();

if (!res.ok) {
  throw new Error(data.error || `Request failed with status ${res.status}`);
}

return data.monster;
}
