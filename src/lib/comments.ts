import { supabase } from "@/integrations/supabase/client";

export interface CommentAuthor {
  id: string;
  name: string;
  avatar: string;
}

export interface ProjectComment {
  id: string;
  projectSlug: string;
  userId: string;
  parentId: string | null;
  body: string;
  mentions: string[];
  deleted: boolean;
  createdAt: string;
  author: CommentAuthor;
  score: number;
  up: number;
  down: number;
  myVote: -1 | 0 | 1;
  replies: ProjectComment[];
}

const table = (name: string) => supabase.from(name as never);

/** Extract @mentions (letters, digits, dash, underscore, dot). */
export function parseMentions(body: string): string[] {
  const out = new Set<string>();
  const re = /@([a-zA-Z0-9._-]{2,40})/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) out.add(m[1].toLowerCase());
  return [...out];
}

interface RawComment {
  id: string;
  project_slug: string;
  user_id: string;
  parent_id: string | null;
  body: string;
  mentions: string[] | null;
  deleted: boolean;
  created_at: string;
}

interface RawVote {
  comment_id: string;
  user_id: string;
  value: number;
}

/** Load the full comment tree for a project, including scores and the caller's votes. */
export async function listComments(projectSlug: string, myId?: string | null): Promise<ProjectComment[]> {
  const { data, error } = await table("project_comments")
    .select("id,project_slug,user_id,parent_id,body,mentions,deleted,created_at")
    .eq("project_slug", projectSlug)
    .order("created_at", { ascending: true })
    .limit(500);
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as unknown as RawComment[];
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);
  const authorIds = [...new Set(rows.map((r) => r.user_id))];

  const [votesRes, profilesRes] = await Promise.all([
    table("comment_votes").select("comment_id,user_id,value").in("comment_id", ids as never),
    supabase.from("profiles").select("id,name,avatar").in("id", authorIds),
  ]);

  const votes = ((votesRes.data ?? []) as unknown as RawVote[]);
  const profiles = new Map(
    ((profilesRes.data ?? []) as { id: string; name: string | null; avatar: string | null }[]).map((p) => [
      p.id,
      { id: p.id, name: p.name || "Member", avatar: p.avatar || "🧑" },
    ]),
  );

  const scores = new Map<string, { up: number; down: number; mine: -1 | 0 | 1 }>();
  for (const v of votes) {
    const s = scores.get(v.comment_id) ?? { up: 0, down: 0, mine: 0 as -1 | 0 | 1 };
    if (v.value > 0) s.up++;
    else if (v.value < 0) s.down++;
    if (myId && v.user_id === myId) s.mine = (v.value > 0 ? 1 : -1) as -1 | 1;
    scores.set(v.comment_id, s);
  }

  const nodes = new Map<string, ProjectComment>();
  for (const r of rows) {
    const s = scores.get(r.id) ?? { up: 0, down: 0, mine: 0 as const };
    nodes.set(r.id, {
      id: r.id,
      projectSlug: r.project_slug,
      userId: r.user_id,
      parentId: r.parent_id,
      body: r.deleted ? "[comment removed]" : r.body,
      mentions: r.mentions ?? [],
      deleted: r.deleted,
      createdAt: r.created_at,
      author: profiles.get(r.user_id) ?? { id: r.user_id, name: "Member", avatar: "🧑" },
      score: s.up - s.down,
      up: s.up,
      down: s.down,
      myVote: s.mine,
      replies: [],
    });
  }

  const roots: ProjectComment[] = [];
  for (const node of nodes.values()) {
    if (node.parentId && nodes.has(node.parentId)) nodes.get(node.parentId)!.replies.push(node);
    else roots.push(node);
  }
  const sortTree = (list: ProjectComment[]) => {
    list.sort((a, b) => b.score - a.score || a.createdAt.localeCompare(b.createdAt));
    list.forEach((n) => sortTree(n.replies));
  };
  sortTree(roots);
  return roots;
}

export async function addComment(input: {
  projectSlug: string;
  userId: string;
  body: string;
  parentId?: string | null;
}): Promise<void> {
  const body = input.body.trim();
  if (!body) throw new Error("Comment cannot be empty");
  if (body.length > 4000) throw new Error("Comment is too long (max 4000 characters)");
  const { error } = await table("project_comments").insert({
    project_slug: input.projectSlug,
    user_id: input.userId,
    parent_id: input.parentId ?? null,
    body,
    mentions: parseMentions(body),
  } as never);
  if (error) throw new Error(error.message);
}

export async function updateComment(id: string, body: string): Promise<void> {
  const next = body.trim();
  if (!next) throw new Error("Comment cannot be empty");
  const { error } = await table("project_comments")
    .update({ body: next, mentions: parseMentions(next) } as never)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteComment(id: string): Promise<void> {
  const { error } = await table("project_comments").update({ deleted: true, body: "" } as never).eq("id", id);
  if (error) throw new Error(error.message);
}

/** Cast, switch or clear a vote. Passing the same value twice removes the vote. */
export async function voteComment(commentId: string, userId: string, value: 1 | -1, current: -1 | 0 | 1): Promise<void> {
  if (current === value) {
    const { error } = await table("comment_votes").delete().eq("comment_id", commentId).eq("user_id", userId);
    if (error) throw new Error(error.message);
    return;
  }
  const { error } = await table("comment_votes")
    .upsert({ comment_id: commentId, user_id: userId, value } as never, { onConflict: "comment_id,user_id" } as never);
  if (error) throw new Error(error.message);
}

/** Count comments across a set of projects (for dashboards). */
export async function countCommentsForSlugs(slugs: string[]): Promise<Record<string, number>> {
  if (slugs.length === 0) return {};
  const { data } = await table("project_comments").select("project_slug").in("project_slug", slugs as never).limit(2000);
  const out: Record<string, number> = {};
  for (const r of ((data ?? []) as unknown as { project_slug: string }[])) {
    out[r.project_slug] = (out[r.project_slug] ?? 0) + 1;
  }
  return out;
}

/** Recent comments left on the given projects, newest first. */
export async function recentCommentsForSlugs(slugs: string[], limit = 8) {
  if (slugs.length === 0) return [] as { id: string; projectSlug: string; body: string; createdAt: string; author: string }[];
  const { data } = await table("project_comments")
    .select("id,project_slug,user_id,body,created_at,deleted")
    .in("project_slug", slugs as never)
    .order("created_at", { ascending: false })
    .limit(limit);
  const rows = ((data ?? []) as unknown as (RawComment & { deleted: boolean })[]).filter((r) => !r.deleted);
  const ids = [...new Set(rows.map((r) => r.user_id))];
  const { data: profs } = await supabase.from("profiles").select("id,name").in("id", ids);
  const names = new Map(((profs ?? []) as { id: string; name: string | null }[]).map((p) => [p.id, p.name || "Member"]));
  return rows.map((r) => ({
    id: r.id,
    projectSlug: r.project_slug,
    body: r.body,
    createdAt: r.created_at,
    author: names.get(r.user_id) ?? "Member",
  }));
}

/** Total upvotes received across a set of projects' comments. */
export async function upvotesForSlugs(slugs: string[]): Promise<number> {
  if (slugs.length === 0) return 0;
  const { data } = await table("project_comments").select("id").in("project_slug", slugs as never).limit(2000);
  const ids = ((data ?? []) as unknown as { id: string }[]).map((r) => r.id);
  if (ids.length === 0) return 0;
  const { data: votes } = await table("comment_votes").select("value").in("comment_id", ids as never).limit(5000);
  return ((votes ?? []) as unknown as { value: number }[]).filter((v) => v.value > 0).length;
}
