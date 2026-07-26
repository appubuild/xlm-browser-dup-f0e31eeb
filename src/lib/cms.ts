import { supabase } from "@/integrations/supabase/client";

export interface SitePage {
  id: string;
  slug: string;
  title: string;
  body: string;
  metaDescription: string;
  published: boolean;
  showInFooter: boolean;
  footerGroupId: string | null;
  sortOrder: number;
  updatedAt: string;
}

export interface ContactReason {
  id: string;
  label: string;
  sortOrder: number;
  visible: boolean;
}

export interface ContactMessage {
  id: string;
  userId: string | null;
  name: string;
  email: string;
  reason: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
}

export interface ContactReply {
  id: string;
  messageId: string;
  authorId: string | null;
  authorRole: string;
  body: string;
  createdAt: string;
}

type Row = Record<string, unknown>;

const mapPage = (r: Row): SitePage => ({
  id: String(r.id),
  slug: String(r.slug),
  title: String(r.title),
  body: String(r.body ?? ""),
  metaDescription: String(r.meta_description ?? ""),
  published: Boolean(r.published),
  showInFooter: Boolean(r.show_in_footer),
  sortOrder: Number(r.sort_order ?? 0),
  updatedAt: String(r.updated_at ?? ""),
});

const mapMessage = (r: Row): ContactMessage => ({
  id: String(r.id),
  userId: (r.user_id as string) ?? null,
  name: String(r.name ?? ""),
  email: String(r.email ?? ""),
  reason: String(r.reason ?? ""),
  subject: String(r.subject ?? ""),
  message: String(r.message ?? ""),
  status: String(r.status ?? "open"),
  createdAt: String(r.created_at ?? ""),
});

const mapReply = (r: Row): ContactReply => ({
  id: String(r.id),
  messageId: String(r.message_id),
  authorId: (r.author_id as string) ?? null,
  authorRole: String(r.author_role ?? "admin"),
  body: String(r.body ?? ""),
  createdAt: String(r.created_at ?? ""),
});

const t = (name: string) => supabase.from(name as never);

/* ---------- Pages ---------- */

export async function listPages(includeDrafts = false): Promise<SitePage[]> {
  let q = t("pages").select("*").order("sort_order", { ascending: true });
  if (!includeDrafts) q = q.eq("published", true);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return ((data ?? []) as Row[]).map(mapPage);
}

export async function getPage(slug: string): Promise<SitePage | null> {
  const { data, error } = await t("pages").select("*").eq("slug", slug).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapPage(data as Row) : null;
}

export async function createPage(p: Partial<SitePage> & { title: string; slug: string }) {
  const { data, error } = await t("pages")
    .insert({
      slug: p.slug,
      title: p.title,
      body: p.body ?? "",
      meta_description: p.metaDescription ?? "",
      published: p.published ?? true,
      show_in_footer: p.showInFooter ?? false,
      sort_order: p.sortOrder ?? 0,
    } as never)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapPage(data as Row);
}

export async function updatePage(id: string, patch: Partial<SitePage>) {
  const row: Row = {};
  if (patch.slug !== undefined) row.slug = patch.slug;
  if (patch.title !== undefined) row.title = patch.title;
  if (patch.body !== undefined) row.body = patch.body;
  if (patch.metaDescription !== undefined) row.meta_description = patch.metaDescription;
  if (patch.published !== undefined) row.published = patch.published;
  if (patch.showInFooter !== undefined) row.show_in_footer = patch.showInFooter;
  if (patch.sortOrder !== undefined) row.sort_order = patch.sortOrder;
  const { error } = await t("pages").update(row as never).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deletePage(id: string) {
  const { error } = await t("pages").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/* ---------- Contact reasons ---------- */

export async function listReasons(onlyVisible = false): Promise<ContactReason[]> {
  let q = t("contact_reasons").select("*").order("sort_order", { ascending: true });
  if (onlyVisible) q = q.eq("visible", true);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return ((data ?? []) as Row[]).map((r) => ({
    id: String(r.id),
    label: String(r.label),
    sortOrder: Number(r.sort_order ?? 0),
    visible: Boolean(r.visible),
  }));
}

export async function createReason(label: string, sortOrder = 0) {
  const { error } = await t("contact_reasons").insert({ label, sort_order: sortOrder } as never);
  if (error) throw new Error(error.message);
}

export async function updateReason(id: string, patch: Partial<ContactReason>) {
  const row: Row = {};
  if (patch.label !== undefined) row.label = patch.label;
  if (patch.sortOrder !== undefined) row.sort_order = patch.sortOrder;
  if (patch.visible !== undefined) row.visible = patch.visible;
  const { error } = await t("contact_reasons").update(row as never).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteReason(id: string) {
  const { error } = await t("contact_reasons").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/* ---------- Contact messages ---------- */

export async function sendContactMessage(input: {
  name: string;
  email: string;
  reason: string;
  subject: string;
  message: string;
  userId?: string | null;
}) {
  const { data, error } = await t("contact_messages")
    .insert({
      name: input.name,
      email: input.email,
      reason: input.reason,
      subject: input.subject,
      message: input.message,
      user_id: input.userId ?? null,
    } as never)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapMessage(data as Row) : null;
}

export async function listMessages(): Promise<ContactMessage[]> {
  const { data, error } = await t("contact_messages").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as Row[]).map(mapMessage);
}

export async function updateMessageStatus(id: string, status: string) {
  const { error } = await t("contact_messages").update({ status } as never).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteMessage(id: string) {
  const { error } = await t("contact_messages").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listReplies(messageId: string): Promise<ContactReply[]> {
  const { data, error } = await t("contact_replies")
    .select("*")
    .eq("message_id", messageId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as Row[]).map(mapReply);
}

export async function addReply(messageId: string, body: string, authorId: string, authorRole: "admin" | "user") {
  const { error } = await t("contact_replies").insert({
    message_id: messageId,
    body,
    author_id: authorId,
    author_role: authorRole,
  } as never);
  if (error) throw new Error(error.message);
}
