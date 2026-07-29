import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { useApp } from "@/lib/app-store";
import {
  addComment,
  deleteComment,
  listComments,
  updateComment,
  voteComment,
  type ProjectComment,
} from "@/lib/comments";

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 2592000) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

/** Render body text with @mentions highlighted (project mentions link to the project). */
function Body({ text, projectSlugs }: { text: string; projectSlugs: Map<string, string> }) {
  const parts = text.split(/(@[a-zA-Z0-9._-]{2,40})/g);
  return (
    <p className="whitespace-pre-wrap break-words text-sm">
      {parts.map((part, i) => {
        if (!part.startsWith("@")) return <span key={i}>{part}</span>;
        const handle = part.slice(1).toLowerCase();
        const slug = projectSlugs.get(handle);
        if (slug) {
          return (
            <Link key={i} to="/project/$slug" params={{ slug }} className="font-medium text-primary hover:underline">
              {part}
            </Link>
          );
        }
        return <span key={i} className="font-medium text-primary">{part}</span>;
      })}
    </p>
  );
}

interface Suggestion { handle: string; label: string; icon: string }

function CommentBox({
  value,
  onChange,
  onSubmit,
  suggestions,
  placeholder,
  busy,
  submitLabel,
  onCancel,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  suggestions: Suggestion[];
  placeholder: string;
  busy: boolean;
  submitLabel: string;
  onCancel?: () => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const detect = (text: string, caret: number) => {
    const before = text.slice(0, caret);
    const m = /@([a-zA-Z0-9._-]*)$/.exec(before);
    if (m) { setQuery(m[1].toLowerCase()); setOpen(true); }
    else setOpen(false);
  };

  const matches = useMemo(
    () => suggestions.filter((s) => s.handle.includes(query)).slice(0, 6),
    [suggestions, query],
  );

  const apply = (s: Suggestion) => {
    const el = ref.current;
    const caret = el?.selectionStart ?? value.length;
    const before = value.slice(0, caret).replace(/@([a-zA-Z0-9._-]*)$/, `@${s.handle} `);
    const next = before + value.slice(caret);
    onChange(next);
    setOpen(false);
    requestAnimationFrame(() => { el?.focus(); el?.setSelectionRange(before.length, before.length); });
  };

  return (
    <div className="relative">
      <textarea
        ref={ref}
        value={value}
        rows={3}
        placeholder={placeholder}
        onChange={(e) => { onChange(e.target.value); detect(e.target.value, e.target.selectionStart); }}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") onSubmit();
        }}
        className="w-full resize-y rounded-md border bg-background p-3 text-sm outline-none focus:border-primary"
      />
      {open && matches.length > 0 && (
        <div className="absolute z-20 mt-1 w-64 overflow-hidden rounded-md border bg-popover shadow-lg">
          {matches.map((s) => (
            <button
              key={s.handle}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); apply(s); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
            >
              <span>{s.icon}</span>
              <span className="font-medium">@{s.handle}</span>
              <span className="ml-auto truncate text-xs text-muted-foreground">{s.label}</span>
            </button>
          ))}
        </div>
      )}
      <div className="mt-2 flex items-center gap-2">
        <button
          onClick={onSubmit}
          disabled={busy || !value.trim()}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {busy ? "Posting…" : submitLabel}
        </button>
        {onCancel && (
          <button onClick={onCancel} className="rounded-md border px-3 py-2 text-sm hover:bg-accent">Cancel</button>
        )}
        <span className="ml-auto text-xs text-muted-foreground">Type @ to mention · ⌘/Ctrl + Enter to post</span>
      </div>
    </div>
  );
}

function CommentNode({
  node,
  depth,
  ctx,
}: {
  node: ProjectComment;
  depth: number;
  ctx: {
    userId: string | null;
    isAdmin: boolean;
    suggestions: Suggestion[];
    projectSlugs: Map<string, string>;
    reload: () => Promise<void>;
    projectSlug: string;
  };
}) {
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [editDraft, setEditDraft] = useState(node.body);
  const [busy, setBusy] = useState(false);
  const mine = ctx.userId === node.userId;

  const vote = async (v: 1 | -1) => {
    if (!ctx.userId) { toast.error("Sign in to vote on comments"); return; }
    try {
      await voteComment(node.id, ctx.userId, v, node.myVote);
      await ctx.reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save your vote");
    }
  };

  const submitReply = async () => {
    if (!ctx.userId) return;
    setBusy(true);
    try {
      await addComment({ projectSlug: ctx.projectSlug, userId: ctx.userId, body: draft, parentId: node.id });
      setDraft(""); setReplying(false);
      await ctx.reload();
      toast.success("Reply posted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not post reply");
    } finally { setBusy(false); }
  };

  const submitEdit = async () => {
    setBusy(true);
    try {
      await updateComment(node.id, editDraft);
      setEditing(false);
      await ctx.reload();
      toast.success("Comment updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update comment");
    } finally { setBusy(false); }
  };

  const remove = async () => {
    if (!confirm("Remove this comment?")) return;
    try {
      await deleteComment(node.id);
      await ctx.reload();
      toast.success("Comment removed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not remove comment");
    }
  };

  return (
    <li className={depth > 0 ? "border-l pl-4" : ""}>
      <div className="flex gap-3 py-3">
        <div className="flex flex-col items-center gap-0.5 pt-1">
          <button
            onClick={() => vote(1)}
            aria-label="Upvote"
            className={`rounded px-1 text-sm leading-none hover:bg-accent ${node.myVote === 1 ? "text-primary" : "text-muted-foreground"}`}
          >▲</button>
          <span className="text-xs font-semibold tabular-nums">{node.score}</span>
          <button
            onClick={() => vote(-1)}
            aria-label="Downvote"
            className={`rounded px-1 text-sm leading-none hover:bg-accent ${node.myVote === -1 ? "text-destructive" : "text-muted-foreground"}`}
          >▼</button>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="text-base">{node.author.avatar}</span>
            <span className="font-medium text-foreground">{node.author.name}</span>
            <span>· {timeAgo(node.createdAt)}</span>
          </div>
          {editing ? (
            <div className="mt-2">
              <CommentBox
                value={editDraft}
                onChange={setEditDraft}
                onSubmit={submitEdit}
                suggestions={ctx.suggestions}
                placeholder="Edit your comment"
                busy={busy}
                submitLabel="Save"
                onCancel={() => { setEditing(false); setEditDraft(node.body); }}
              />
            </div>
          ) : (
            <div className={`mt-1 ${node.deleted ? "italic text-muted-foreground" : ""}`}>
              <Body text={node.body} projectSlugs={ctx.projectSlugs} />
            </div>
          )}
          {!editing && !node.deleted && (
            <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <button onClick={() => (ctx.userId ? setReplying((v) => !v) : toast.error("Sign in to reply"))} className="hover:text-foreground">Reply</button>
              {mine && <button onClick={() => setEditing(true)} className="hover:text-foreground">Edit</button>}
              {(mine || ctx.isAdmin) && <button onClick={remove} className="hover:text-destructive">Delete</button>}
              {node.up + node.down > 0 && <span>{node.up} up · {node.down} down</span>}
            </div>
          )}
          {replying && (
            <div className="mt-3">
              <CommentBox
                value={draft}
                onChange={setDraft}
                onSubmit={submitReply}
                suggestions={ctx.suggestions}
                placeholder={`Reply to ${node.author.name}…`}
                busy={busy}
                submitLabel="Reply"
                onCancel={() => setReplying(false)}
              />
            </div>
          )}
          {node.replies.length > 0 && (
            <ul className="mt-1">
              {node.replies.map((child) => (
                <CommentNode key={child.id} node={child} depth={depth + 1} ctx={ctx} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </li>
  );
}

export function ProjectDiscussion({ projectSlug }: { projectSlug: string }) {
  const { user, isAdmin, projects } = useApp();
  const [tree, setTree] = useState<ProjectComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    try {
      setTree(await listComments(projectSlug, user?.id ?? null));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load the discussion");
    } finally {
      setLoading(false);
    }
  }, [projectSlug, user?.id]);

  useEffect(() => { void reload(); }, [reload]);

  const handleOf = (s: string) => s.toLowerCase().replace(/[^a-z0-9._-]+/g, "");

  const suggestions = useMemo<Suggestion[]>(() => {
    const list: Suggestion[] = projects
      .filter((p) => p.status === "approved" && p.isPublic)
      .slice(0, 60)
      .map((p) => ({ handle: handleOf(p.slug), label: p.name, icon: p.logo }));
    const seen = new Set(list.map((s) => s.handle));
    const walk = (nodes: ProjectComment[]) => {
      for (const n of nodes) {
        const h = handleOf(n.author.name);
        if (h && !seen.has(h)) { seen.add(h); list.push({ handle: h, label: "member", icon: n.author.avatar }); }
        walk(n.replies);
      }
    };
    walk(tree);
    return list;
  }, [projects, tree]);

  const projectSlugs = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of projects) m.set(handleOf(p.slug), p.slug);
    return m;
  }, [projects]);

  const total = useMemo(() => {
    let n = 0;
    const walk = (nodes: ProjectComment[]) => { for (const x of nodes) { n++; walk(x.replies); } };
    walk(tree);
    return n;
  }, [tree]);

  const submit = async () => {
    if (!user) return;
    setBusy(true);
    try {
      await addComment({ projectSlug, userId: user.id, body: draft });
      setDraft("");
      await reload();
      toast.success("Comment posted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not post comment");
    } finally { setBusy(false); }
  };

  return (
    <section id="discussion" className="mt-10 border-t pt-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold">Discussion <span className="text-muted-foreground">({total})</span></h2>
        {!user && <span className="text-xs text-muted-foreground">Read-only — sign in to join in</span>}
      </div>

      {user ? (
        <div className="mt-4">
          <CommentBox
            value={draft}
            onChange={setDraft}
            onSubmit={submit}
            suggestions={suggestions}
            placeholder="Share your experience with this project…"
            busy={busy}
            submitLabel="Post comment"
          />
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-md border bg-muted/40 p-4 text-sm">
          <span>Sign in to post comments, reply to others and vote.</span>
          <Link to="/login" className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:opacity-90">Sign in</Link>
          <Link to="/signup" className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent">Create account</Link>
        </div>
      )}

      {loading ? (
        <div className="py-8 text-sm text-muted-foreground">Loading discussion…</div>
      ) : tree.length === 0 ? (
        <div className="py-8 text-sm text-muted-foreground">No comments yet — be the first to start the conversation.</div>
      ) : (
        <ul className="mt-4 divide-y">
          {tree.map((n) => (
            <CommentNode
              key={n.id}
              node={n}
              depth={0}
              ctx={{ userId: user?.id ?? null, isAdmin, suggestions, projectSlugs, reload, projectSlug }}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
