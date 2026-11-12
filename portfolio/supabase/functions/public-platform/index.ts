import { withSupabase } from "npm:@supabase/server";

const ORIGIN = "https://ahmadou-lamine-diouf.pages.dev";
const ALLOWED_ORIGINS = new Set([ORIGIN, "http://localhost:8788", "http://127.0.0.1:8788"]);
const BUCKET = "public-portfolios-media";
const SESSION_HOURS = 8;
const encoder = new TextEncoder();
let db: any;

const PROFILE_FIELDS = "slug,full_name,title_en,title_fr,bio_en,bio_fr,organization,location,photo_url,whatsapp,linkedin_url,email,is_demo,is_public,created_at,updated_at";
const COLLECTIONS = {
  experiences: { table: "public_experiences", fields: ["title_en","title_fr","organization","location","start_date","end_date","is_current","description_en","description_fr","skills","image_urls","sort_order","is_published"] },
  diplomas: { table: "public_diplomas", fields: ["title_en","title_fr","institution","year","details_en","details_fr","image_url","sort_order","is_published"] },
  events: { table: "public_events", fields: ["title_en","title_fr","location","country","start_date","end_date","status","role_en","role_fr","summary_en","summary_fr","cover_image","gallery_urls","sort_order","is_published"] },
  initiatives: { table: "public_initiatives", fields: ["title_en","title_fr","category","status","start_date","end_date","description_en","description_fr","image_urls","link_url","sort_order","is_published"] }
};

function corsHeaders(origin: string) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "apikey, content-type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}
function json(req: Request, payload: unknown, status = 200) {
  const origin = req.headers.get("origin") || ORIGIN;
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
  });
}
function fail(req: Request, message: string, status = 400) {
  return json(req, { ok: false, error: message }, status);
}
function str(value: unknown, max: number, required = false): string | null {
  if (value === undefined || value === null || String(value).trim() === "") {
    if (required) throw new Error("Please complete all required fields.");
    return null;
  }
  const result = String(value).trim();
  if (result.length > max) throw new Error("One of the fields is too long.");
  return result;
}
function validSlug(value: unknown): string {
  const slug = String(value || "").trim().toLowerCase();
  if (!/^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])$/.test(slug)) {
    throw new Error("Choose an identifier of 3–32 characters using lowercase letters, numbers and hyphens.");
  }
  return slug;
}
function validPin(value: unknown): string {
  const pin = String(value || "").trim();
  if (!/^\d{6}$/.test(pin)) throw new Error("Your security code must contain exactly 6 digits.");
  return pin;
}
function validEmail(value: unknown): string | null {
  const email = str(value, 254);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email address.");
  return email;
}
function validUrl(value: unknown): string | null {
  const valueText = str(value, 500);
  if (!valueText) return null;
  let url: URL;
  try { url = new URL(valueText); } catch { throw new Error("Enter a complete URL beginning with https://."); }
  if (!["https:", "http:"].includes(url.protocol)) throw new Error("Only web links are accepted.");
  return url.toString();
}
function randomHex(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
}
function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}
async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("");
}
async function pinDigest(pin: string, saltHex: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(pin), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: hexToBytes(saltHex), iterations: 150000, hash: "SHA-256" }, key, 256
  );
  return Array.from(new Uint8Array(bits), b => b.toString(16).padStart(2, "0")).join("");
}
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
function requestIp(req: Request): string {
  return (req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim().slice(0, 80);
}
async function checkRateLimit(req: Request, action: "login" | "create" | "contact" | "recover", identity: string, max: number, seconds: number) {
  const key = await sha256([action, requestIp(req), identity].join("|"));
  const { data, error } = await db.rpc("consume_public_platform_rate_limit", {
    p_rate_key: key, p_action: action, p_max_attempts: max, p_window_seconds: seconds
  });
  if (error) throw new Error("Rate limiting is temporarily unavailable. Please try again later.");
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || !row.allowed) {
    const mins = Math.max(1, Math.ceil(Number(row?.retry_after_seconds || seconds) / 60));
    throw new Error("Too many attempts. Please try again in about " + mins + " minute(s).");
  }
  return key;
}
async function resetRateLimit(key: string) {
  await db.from("public_rate_limits").delete().eq("rate_key", key);
}
async function safeProfile(slug: string) {
  const { data, error } = await db.from("public_profiles").select(PROFILE_FIELDS).eq("slug", slug).eq("is_public", true).maybeSingle();
  if (error) throw error;
  return data;
}
async function issueSession(slug: string) {
  const token = randomHex(32);
  const tokenHash = await sha256(token);
  const expiresAt = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000).toISOString();
  const { error } = await db.from("public_sessions").insert({ token_hash: tokenHash, owner_slug: slug, expires_at: expiresAt });
  if (error) throw error;
  return { token, expiresAt };
}
async function authenticate(tokenValue: unknown) {
  const token = String(tokenValue || "");
  if (!/^[a-f0-9]{64}$/.test(token)) throw new Error("Your session has expired. Please sign in again.");
  const tokenHash = await sha256(token);
  const { data: session, error } = await db.from("public_sessions").select("owner_slug,expires_at")
    .eq("token_hash", tokenHash).gt("expires_at", new Date().toISOString()).maybeSingle();
  if (error || !session) throw new Error("Your session has expired. Please sign in again.");
  const { data: profile, error: profileError } = await db.from("public_profiles").select(PROFILE_FIELDS)
    .eq("slug", session.owner_slug).eq("is_demo", false).maybeSingle();
  if (profileError || !profile) throw new Error("This portfolio is no longer available.");
  return { slug: session.owner_slug, profile, tokenHash };
}
function parsePhotoData(value: unknown) {
  if (!value) return null;
  const raw = String(value);
  const match = raw.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) throw new Error("Use a JPEG, PNG or WebP portrait.");
  if (match[2].length > 7000000) throw new Error("The portrait is too large. Please choose an image under 5 MB.");
  const binary = atob(match[2]);
  if (binary.length > 5 * 1024 * 1024) throw new Error("The portrait must be under 5 MB.");
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return { bytes, mime: match[1], extension: match[1] === "image/jpeg" ? "jpg" : match[1] === "image/png" ? "png" : "webp" };
}
async function savePortrait(slug: string, value: unknown, previousUrl?: string | null) {
  const photo = parsePhotoData(value);
  if (!photo) return previousUrl || null;
  const path = slug + "/portrait." + photo.extension;
  const { error } = await db.storage.from(BUCKET).upload(path, photo.bytes, {
    contentType: photo.mime, cacheControl: "3600", upsert: true
  });
  if (error) throw new Error("The portrait could not be uploaded. Please try another image.");
  const { data } = db.storage.from(BUCKET).getPublicUrl(path);
  if (previousUrl && previousUrl !== data.publicUrl) {
    const marker = "/storage/v1/object/public/" + BUCKET + "/";
    const oldPath = previousUrl.includes(marker) ? previousUrl.split(marker)[1] : null;
    if (oldPath) await db.storage.from(BUCKET).remove([decodeURIComponent(oldPath)]);
  }
  return data.publicUrl;
}
async function createProfile(req: Request, body: Record<string, unknown>) {
  await checkRateLimit(req, "create", "all", 3, 86400);
  const slug = validSlug(body.slug);
  const pin = validPin(body.pin);
  const full_name = str(body.full_name, 160, true)!;
  const title_en = str(body.title_en, 180, true)!;
  const bio_en = str(body.bio_en, 2400, true)!;
  const bio_fr = str(body.bio_fr, 2400, true)!;
  if (bio_en.length < 10 || bio_fr.length < 10) throw new Error("Each biography must contain at least 10 characters.");
  const salt = randomHex(16);
  const pin_hash = await pinDigest(pin, salt);
  const recovery_code = randomHex(32);
  const recovery_hash = await sha256("BioPage recovery code v1|" + recovery_code);
  const existing = await db.from("public_profiles").select("slug").eq("slug", slug).maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) throw new Error("This identifier is already in use. Please choose another one.");
  const profile = {
    slug, full_name, title_en, title_fr: str(body.title_fr, 180),
    bio_en, bio_fr, organization: str(body.organization, 180), location: str(body.location, 160),
    whatsapp: str(body.whatsapp, 40), linkedin_url: validUrl(body.linkedin_url), email: validEmail(body.email),
    pin_salt: salt, pin_hash, recovery_hash, is_demo: false, is_public: true
  };
  const { error } = await db.from("public_profiles").insert(profile);
  if (error) {
    if (error.code === "23505") throw new Error("This identifier is already in use. Please choose another one.");
    throw error;
  }
  try {
    const photoUrl = await savePortrait(slug, body.photo_data);
    if (photoUrl) {
      const { error: photoError } = await db.from("public_profiles").update({ photo_url: photoUrl }).eq("slug", slug);
      if (photoError) throw photoError;
    }
  } catch (error) {
    await db.from("public_profiles").delete().eq("slug", slug);
    throw error;
  }
  const session = await issueSession(slug);
  return { profile: await safeProfile(slug), recovery_code, ...session };
}
async function login(req: Request, body: Record<string, unknown>) {
  const slug = validSlug(body.slug);
  const pin = validPin(body.pin);
  const rateKey = await checkRateLimit(req, "login", slug, 5, 900);
  const { data: profile, error } = await db.from("public_profiles").select("slug,pin_salt,pin_hash,is_demo,is_public")
    .eq("slug", slug).maybeSingle();
  if (error) throw error;
  const salt = profile?.pin_salt || "c0ffee1234567890abcdef1234567890";
  const candidate = await pinDigest(pin, salt);
  const valid = !!profile && !profile.is_demo && profile.is_public && !!profile.pin_hash && constantTimeEqual(candidate, profile.pin_hash);
  if (!valid) throw new Error("Identifier or security code is incorrect.");
  await resetRateLimit(rateKey);
  const session = await issueSession(slug);
  return { profile: await safeProfile(slug), ...session };
}
async function generateRecoveryCode(slug: string) {
  const recovery_code = randomHex(32);
  const recovery_hash = await sha256("BioPage recovery code v1|" + recovery_code);
  const { error } = await db.from("public_profiles").update({
    recovery_hash, updated_at: new Date().toISOString()
  }).eq("slug", slug).eq("is_demo", false);
  if (error) throw error;
  return { slug, recovery_code };
}

async function recoverAccount(req: Request, body: Record<string, unknown>) {
  const rateKey = await checkRateLimit(req, "recover", "all", 5, 3600);
  const recoveryCode = String(body.recovery_code || "").trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(recoveryCode)) throw new Error("The recovery code is invalid.");
  const newPin = validPin(body.new_pin);
  const recoveryHash = await sha256("BioPage recovery code v1|" + recoveryCode);
  const { data: profile, error: lookupError } = await db.from("public_profiles")
    .select("slug,is_demo,is_public").eq("recovery_hash", recoveryHash).maybeSingle();
  if (lookupError) throw lookupError;
  if (!profile || profile.is_demo || !profile.is_public) {
    throw new Error("This recovery code is invalid or has already been used. Check your saved recovery file.");
  }

  const pinSalt = randomHex(16);
  const pinHash = await pinDigest(newPin, pinSalt);
  const nextRecoveryCode = randomHex(32);
  const nextRecoveryHash = await sha256("BioPage recovery code v1|" + nextRecoveryCode);
  const { error: updateError } = await db.from("public_profiles").update({
    pin_salt: pinSalt, pin_hash: pinHash, recovery_hash: nextRecoveryHash, updated_at: new Date().toISOString()
  }).eq("slug", profile.slug);
  if (updateError) throw updateError;

  const { error: revokeError } = await db.from("public_sessions").delete().eq("owner_slug", profile.slug);
  if (revokeError) throw revokeError;
  await resetRateLimit(rateKey);
  const session = await issueSession(profile.slug);
  return { slug: profile.slug, recovery_code: nextRecoveryCode, ...session };
}

async function loadAllContacts(slug: string) {
  const all: any[] = [];
  const pageSize = 1000;
  let offset = 0;
  while (true) {
    const { data, error } = await db.from("public_contacts").select("*")
      .eq("owner_slug", slug).order("created_at", { ascending: false })
      .range(offset, offset + pageSize - 1);
    if (error) throw error;
    const batch = data || [];
    all.push(...batch);
    if (batch.length < pageSize) break;
    offset += pageSize;
  }
  return all;
}

async function loadStudio(slug: string) {
  const [profile, experiences, diplomas, events, initiatives, contacts] = await Promise.all([
    db.from("public_profiles").select(PROFILE_FIELDS).eq("slug", slug).single(),
    db.from("public_experiences").select("*").eq("slug", slug).order("sort_order").order("start_date", { ascending: false }),
    db.from("public_diplomas").select("*").eq("slug", slug).order("sort_order").order("year", { ascending: false }),
    db.from("public_events").select("*").eq("slug", slug).order("sort_order").order("start_date", { ascending: false }),
    db.from("public_initiatives").select("*").eq("slug", slug).order("sort_order").order("created_at", { ascending: false }),
    loadAllContacts(slug)
  ]);
  for (const result of [profile, experiences, diplomas, events, initiatives]) if (result.error) throw result.error;
  return {
    profile: profile.data, experiences: experiences.data || [], diplomas: diplomas.data || [],
    events: events.data || [], initiatives: initiatives.data || [], contacts
  };
}

async function loadPublic(slug: string) {
  const profile = await safeProfile(slug);
  if (!profile) throw new Error("This portfolio could not be found.");
  const [experiences, diplomas, events, initiatives] = await Promise.all([
    db.from("public_experiences").select("*").eq("slug", slug).eq("is_published", true).order("sort_order").order("start_date", { ascending: false }),
    db.from("public_diplomas").select("*").eq("slug", slug).eq("is_published", true).order("sort_order").order("year", { ascending: false }),
    db.from("public_events").select("*").eq("slug", slug).eq("is_published", true).order("sort_order").order("start_date", { ascending: false }),
    db.from("public_initiatives").select("*").eq("slug", slug).eq("is_published", true).order("sort_order").order("created_at", { ascending: false })
  ]);
  for (const result of [experiences, diplomas, events, initiatives]) if (result.error) throw result.error;
  return { profile, experiences: experiences.data || [], diplomas: diplomas.data || [], events: events.data || [], initiatives: initiatives.data || [] };
}
async function updateProfile(slug: string, body: Record<string, unknown>) {
  const fields = ["full_name","title_en","title_fr","bio_en","bio_fr","organization","location","whatsapp","email","linkedin_url"];
  const payload: Record<string, unknown> = {};
  for (const field of fields) {
    if (!(field in body)) continue;
    if (field === "linkedin_url") payload[field] = validUrl(body[field]);
    else if (field === "email") payload[field] = validEmail(body[field]);
    else payload[field] = str(body[field], field.startsWith("bio_") ? 2400 : field === "full_name" ? 160 : 500, ["full_name","title_en","bio_en","bio_fr"].includes(field));
  }
  if (body.photo_data) {
    const current = await db.from("public_profiles").select("photo_url").eq("slug", slug).single();
    if (current.error) throw current.error;
    payload.photo_url = await savePortrait(slug, body.photo_data, current.data.photo_url);
  }
  payload.updated_at = new Date().toISOString();
  const { data, error } = await db.from("public_profiles").update(payload).eq("slug", slug).select(PROFILE_FIELDS).single();
  if (error) throw error;
  return data;
}
async function saveEntry(slug: string, body: Record<string, unknown>) {
  const kind = String(body.kind || "");
  const config = COLLECTIONS[kind as keyof typeof COLLECTIONS];
  if (!config) throw new Error("Unknown content section.");
  const source = body.item && typeof body.item === "object" ? body.item as Record<string, unknown> : {};
  const payload: Record<string, unknown> = { slug, updated_at: new Date().toISOString() };
  for (const field of config.fields) {
    if (!(field in source)) continue;
    const value = source[field];
    if (field === "sort_order") payload[field] = value === "" || value == null ? 0 : Number(value);
    else if (field === "year") payload[field] = value === "" || value == null ? null : Number(value);
    else if (["is_current","is_published"].includes(field)) payload[field] = value === true || value === "true";
    else if (["skills","image_urls","gallery_urls"].includes(field)) payload[field] = Array.isArray(value) ? value.map(x => String(x).trim()).filter(Boolean).slice(0, 20) : [];
    else if (["link_url","cover_image","image_url"].includes(field)) payload[field] = field === "link_url" ? validUrl(value) : str(value, 500);
    else payload[field] = str(value, field.startsWith("description_") || field.startsWith("summary_") || field.startsWith("details_") ? 3000 : 500);
  }
  if (!payload.title_en || String(payload.title_en).trim().length < 2) throw new Error("Please enter the English title.");
  if (source.id) {
    const { data, error } = await db.from(config.table).update(payload).eq("id", String(source.id)).eq("slug", slug).select("*").single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await db.from(config.table).insert(payload).select("*").single();
  if (error) throw error;
  return data;
}
async function deleteEntry(slug: string, body: Record<string, unknown>) {
  const kind = String(body.kind || "");
  const config = COLLECTIONS[kind as keyof typeof COLLECTIONS];
  const id = String(body.id || "");
  if (!config || !/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Invalid item.");
  const { error } = await db.from(config.table).delete().eq("id", id).eq("slug", slug);
  if (error) throw error;
  return { deleted: true };
}
async function shareContact(req: Request, body: Record<string, unknown>) {
  const slug = validSlug(body.slug);
  const profile = await safeProfile(slug);
  if (!profile) throw new Error("This portfolio could not be found.");
  await checkRateLimit(req, "contact", slug, 25, 3600);
  if (body.consent !== true) throw new Error("You must confirm that you consent to share these contact details.");
  const full_name = str(body.full_name, 160, true)!;
  const phone = str(body.phone, 40);
  const email = validEmail(body.email);
  const organization = str(body.organization, 180);
  if (full_name.length < 2) throw new Error("Please enter your name.");
  if (!phone && !email) throw new Error("Enter at least a phone number or an email address.");
  if (phone && !/^[0-9+(). -]{7,40}$/.test(phone)) throw new Error("Enter a valid phone number.");
  const share_method = body.share_method === "contact_picker" ? "contact_picker" : "autofill";
  const { error } = await db.from("public_contacts").insert({ owner_slug: slug, full_name, phone, email, organization, share_method });
  if (error) throw error;
  return { shared: true, owner_name: profile.full_name };
}

const securedHandler = withSupabase({ auth: "publishable" }, async (req: Request, ctx: any) => {
  db = ctx.supabaseAdmin;
  if (req.method !== "POST") return fail(req, "Method not allowed.", 405);
  try {
    const length = Number(req.headers.get("content-length") || 0);
    if (length > 8 * 1024 * 1024) return fail(req, "Request is too large.", 413);
    const body = await req.json() as Record<string, unknown>;
    let result: unknown;
    switch (String(body.action || "")) {
      case "create": result = await createProfile(req, body); break;
      case "login": result = await login(req, body); break;
      case "recover-account": result = await recoverAccount(req, body); break;
      case "rotate-recovery-code": {
        const auth = await authenticate(body.token);
        result = await generateRecoveryCode(auth.slug);
        break;
      }
      case "public-profile": result = await loadPublic(validSlug(body.slug)); break;
      case "studio-load": {
        const auth = await authenticate(body.token);
        result = await loadStudio(auth.slug);
        break;
      }
      case "profile-update": {
        const auth = await authenticate(body.token);
        result = { profile: await updateProfile(auth.slug, body) };
        break;
      }
      case "save-entry": {
        const auth = await authenticate(body.token);
        result = { item: await saveEntry(auth.slug, body) };
        break;
      }
      case "delete-entry": {
        const auth = await authenticate(body.token);
        result = await deleteEntry(auth.slug, body);
        break;
      }
      case "share-contact": result = await shareContact(req, body); break;
      case "logout": {
        const token = String(body.token || "");
        if (/^[a-f0-9]{64}$/.test(token)) await db.from("public_sessions").delete().eq("token_hash", await sha256(token));
        result = { signed_out: true };
        break;
      }
      default: return fail(req, "Unknown action.", 400);
    }
    return json(req, { ok: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error.";
    const status = message.includes("incorrect") || message.includes("expired") ? 401 :
      message.includes("could not be found") ? 404 :
      message.includes("Too many attempts") ? 429 :
      message.includes("already in use") ? 409 : 400;
    console.error("public-platform request failed:", message);
    return fail(req, message, status);
  }
});

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin") || "";
  if (!ALLOWED_ORIGINS.has(origin)) return new Response("Forbidden origin.", { status: 403 });
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(origin) });
  const response = await securedHandler(req);
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders(origin))) headers.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
});