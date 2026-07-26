import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Mail, Send, MessageSquare } from "lucide-react";
import { PublicShell } from "@/components/public-shell";
import { useApp } from "@/lib/app-store";
import {
  listReasons, sendContactMessage, listMessages, listReplies, addReply,
  type ContactReason, type ContactMessage, type ContactReply,
} from "@/lib/cms";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
  head: () => ({
    meta: [
      { title: "Contact XRPBrowser | XRPL Support & Partnerships" },
      { name: "description", content: "Contact the XRPBrowser team about project listings, partnerships, billing or issues. Pick a reason and we'll reply in your support thread." },
      { property: "og:title", content: "Contact XRPBrowser" },
      { property: "og:description", content: "Reach the XRPBrowser team for XRPL listing support, partnerships and general questions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function ContactPage() {
  const { siteSettings, user } = useApp();
  const [reasons, setReasons] = useState<ContactReason[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [threads, setThreads] = useState<ContactMessage[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const r = await listReasons(true);
        setReasons(r);
        setReason((prev) => prev || r[0]?.label || "General inquiry");
      } catch { /* ignore */ }
    })();
  }, []);

  useEffect(() => {
    if (user) { setName((n) => n || user.name); setEmail((e) => e || user.email); }
  }, [user]);

  const loadThreads = useCallback(async () => {
    if (!user) { setThreads([]); return; }
    try { setThreads(await listMessages()); } catch { /* ignore */ }
  }, [user]);

  useEffect(() => { void loadThreads(); }, [loadThreads]);

  const submit = async () => {
    if (!name.trim() || !email.trim() || !message.trim()) { toast.error("Name, email and message are required"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { toast.error("Enter a valid email address"); return; }
    setSending(true);
    try {
      await sendContactMessage({
        name: name.trim().slice(0, 100),
        email: email.trim().slice(0, 255),
        reason: reason || "General inquiry",
        subject: subject.trim().slice(0, 150),
        message: message.trim().slice(0, 5000),
        userId: user?.id ?? null,
      });
      toast.success("Message sent — our team will reply soon.");
      setSubject(""); setMessage("");
      void loadThreads();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send");
    } finally {
      setSending(false);
    }
  };

  const input = "w-full rounded-md border bg-background px-3 py-2 text-sm";

  return (
    <PublicShell>
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-3xl font-bold">Contact us</h1>
        <p className="mt-2 text-sm text-muted-foreground">Questions about listing, payments, or the XRPL ecosystem? Send us a message.</p>

        <div className="soft-card mt-6 flex flex-wrap items-center gap-4 p-4 text-sm">
          <span className="inline-flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> {siteSettings.contactEmail}</span>
          {siteSettings.contactCompany && <span className="text-muted-foreground">{siteSettings.contactCompany}</span>}
          {siteSettings.contactLocation && <span className="text-muted-foreground">{siteSettings.contactLocation}</span>}
        </div>

        <div className="soft-card mt-6 space-y-3 p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm"><span className="mb-1 block text-xs text-muted-foreground">Your name *</span>
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} className={input} /></label>
            <label className="block text-sm"><span className="mb-1 block text-xs text-muted-foreground">Email *</span>
              <input value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} className={input} /></label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm"><span className="mb-1 block text-xs text-muted-foreground">Reason *</span>
              <select value={reason} onChange={(e) => setReason(e.target.value)} className={input}>
                {reasons.length === 0 && <option>General inquiry</option>}
                {reasons.map((r) => <option key={r.id} value={r.label}>{r.label}</option>)}
              </select></label>
            <label className="block text-sm"><span className="mb-1 block text-xs text-muted-foreground">Subject</span>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={150} className={input} /></label>
          </div>
          <label className="block text-sm"><span className="mb-1 block text-xs text-muted-foreground">Message *</span>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={6} maxLength={5000} className={input} /></label>
          <button onClick={() => void submit()} disabled={sending} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60">
            <Send className="h-4 w-4" /> {sending ? "Sending…" : "Send message"}
          </button>
          {!user && <p className="text-xs text-muted-foreground">Tip: sign in before sending so you can read our replies in your support thread.</p>}
        </div>

        {user && (
          <div className="mt-10">
            <h2 className="flex items-center gap-2 text-xl font-semibold"><MessageSquare className="h-5 w-5" /> Your support threads</h2>
            {threads.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No messages yet.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {threads.map((t) => <Thread key={t.id} msg={t} userId={user.id} role="user" />)}
              </div>
            )}
          </div>
        )}
      </div>
    </PublicShell>
  );
}

export function Thread({ msg, userId, role }: { msg: ContactMessage; userId: string; role: "admin" | "user" }) {
  const [open, setOpen] = useState(false);
  const [replies, setReplies] = useState<ContactReply[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try { setReplies(await listReplies(msg.id)); } catch { /* ignore */ }
  }, [msg.id]);

  useEffect(() => { if (open) void load(); }, [open, load]);

  const send = async () => {
    if (!text.trim()) return;
    setBusy(true);
    try {
      await addReply(msg.id, text.trim().slice(0, 5000), userId, role);
      setText("");
      await load();
      toast.success("Reply sent");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to reply");
    } finally { setBusy(false); }
  };

  return (
    <div className="soft-card rounded-lg border p-4">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-start justify-between gap-3 text-left">
        <div>
          <div className="text-sm font-medium">{msg.subject || msg.reason}</div>
          <div className="text-xs text-muted-foreground">{msg.reason} · {new Date(msg.createdAt).toLocaleString()} · {msg.name} &lt;{msg.email}&gt;</div>
        </div>
        <span className={`rounded px-2 py-0.5 text-[10px] capitalize ${msg.status === "closed" ? "bg-muted text-muted-foreground" : "bg-emerald-500/20 text-emerald-500"}`}>{msg.status}</span>
      </button>

      {open && (
        <div className="mt-3 space-y-3 border-t pt-3">
          <div className="rounded-md bg-muted/40 p-3 text-sm whitespace-pre-wrap">{msg.message}</div>
          {replies.map((r) => (
            <div key={r.id} className={`rounded-md p-3 text-sm whitespace-pre-wrap ${r.authorRole === "admin" ? "bg-primary/10" : "bg-muted/40"}`}>
              <div className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">{r.authorRole === "admin" ? "Support team" : "User"} · {new Date(r.createdAt).toLocaleString()}</div>
              {r.body}
            </div>
          ))}
          <div className="flex items-end gap-2">
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} maxLength={5000} placeholder="Write a reply…" className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
            <button onClick={() => void send()} disabled={busy} className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-60">Send</button>
          </div>
        </div>
      )}
    </div>
  );
}
