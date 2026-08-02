import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { useApp } from "@/lib/app-store";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/auth-setup")({
  component: AdminAuthSetup,
  head: () => ({
    meta: [
      { title: "Social Login Setup — XRPBrowser Admin" },
      { name: "description", content: "Step-by-step guide for configuring Google and Apple sign-in with Supabase Auth." },
      { property: "og:title", content: "Social Login Setup — XRPBrowser Admin" },
      { property: "og:description", content: "Configure Google and Apple OAuth for XRPBrowser." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const PROJECT_REF = "unhzdlkzuwcgdbmanirb";
const CALLBACK = `https://${PROJECT_REF}.supabase.co/auth/v1/callback`;

function Copy({ value }: { value: string }) {
  return (
    <button
      onClick={() => { void navigator.clipboard.writeText(value); toast.success("Copied"); }}
      className="rounded border px-2 py-1 text-xs"
    >
      Copy
    </button>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-3">
      <div className="text-xs uppercase tracking-wide opacity-60">{label}</div>
      <div className="mt-1 flex items-center gap-2">
        <code className="flex-1 overflow-x-auto rounded border px-2 py-1.5 text-xs">{value}</code>
        <Copy value={value} />
      </div>
    </div>
  );
}

function AdminAuthSetup() {
  const [tab, setTab] = useState<"google" | "apple" | "urls">("google");
  const { siteSettings, updateSiteSettings } = useApp();
  const siteUrl = typeof window !== "undefined" ? window.location.origin : "https://xrpbrowser.com";

  return (
    <AdminShell>
      <div className="max-w-3xl">
        <h1 className="text-xl font-bold">Social Login Setup</h1>
        <p className="mt-1 text-sm opacity-70">
          Google and Apple sign-in buttons are already wired into the sign-in and sign-up pages. They start working as
          soon as the provider is enabled in Supabase with the credentials below.
        </p>

        <div className="admin-card mt-4 rounded-xl border p-5">
          <h2 className="text-base font-semibold">Provider availability</h2>
          <p className="mt-1 text-xs opacity-70">Turn a provider off to hide its button on the sign-in and sign-up pages immediately.</p>
          <div className="mt-3 space-y-2 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={siteSettings.enableGoogleLogin !== false}
                onChange={(e) => { void updateSiteSettings({ enableGoogleLogin: e.target.checked }).then(() => toast.success(e.target.checked ? "Google login enabled" : "Google login hidden")); }} />
              Enable Google login
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={siteSettings.enableAppleLogin !== false}
                onChange={(e) => { void updateSiteSettings({ enableAppleLogin: e.target.checked }).then(() => toast.success(e.target.checked ? "Apple login enabled" : "Apple login hidden")); }} />
              Enable Apple login
            </label>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {([["google", "Google"], ["apple", "Apple"], ["urls", "Redirect URLs"]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={`rounded-md border px-3 py-1.5 text-sm ${tab === k ? "bg-sky-500 text-white" : "opacity-80"}`}>{l}</button>
          ))}
        </div>

        {tab === "google" && (
          <div className="admin-card mt-4 space-y-3 rounded-xl border p-5 text-sm">
            <h2 className="text-base font-semibold">Login with Google</h2>
            <ol className="list-decimal space-y-2 pl-5">
              <li>Open <b>Google Cloud Console → APIs &amp; Services → OAuth consent screen</b> and configure the consent screen (app name, logo, support email, privacy policy and terms links).</li>
              <li>Under <b>Authorized domains</b> add <code>supabase.co</code> and your own domain.</li>
              <li>Add the non-sensitive scopes <code>.../auth/userinfo.email</code>, <code>.../auth/userinfo.profile</code> and <code>openid</code>.</li>
              <li>Go to <b>Credentials → Create credentials → OAuth client ID</b> and choose <b>Web application</b>.</li>
              <li>Add your site URL under <b>Authorized JavaScript origins</b>.</li>
              <li>Add the Supabase callback URL below under <b>Authorized redirect URIs</b>.</li>
              <li>Copy the generated <b>Client ID</b> and <b>Client Secret</b> into <b>Supabase Dashboard → Authentication → Providers → Google</b>, then enable the provider.</li>
            </ol>
            <Field label="Authorized JavaScript origin" value={siteUrl} />
            <Field label="Authorized redirect URI (Supabase callback)" value={CALLBACK} />
          </div>
        )}

        {tab === "apple" && (
          <div className="admin-card mt-4 space-y-3 rounded-xl border p-5 text-sm">
            <h2 className="text-base font-semibold">Login with Apple</h2>
            <ol className="list-decimal space-y-2 pl-5">
              <li>You need a paid <b>Apple Developer Program</b> membership.</li>
              <li>In <b>Certificates, Identifiers &amp; Profiles → Identifiers</b>, create an <b>App ID</b> and enable the <b>Sign in with Apple</b> capability.</li>
              <li>Create a <b>Services ID</b> (this becomes your <b>Client ID</b>, e.g. <code>com.xrpbrowser.web</code>) and enable Sign in with Apple on it.</li>
              <li>Click <b>Configure</b> on the Services ID: set your domain as the web domain and add the Supabase callback URL below as the <b>Return URL</b>.</li>
              <li>In <b>Keys</b>, create a new key with Sign in with Apple enabled and download the <code>.p8</code> file. Note the <b>Key ID</b> and your <b>Team ID</b>.</li>
              <li>Generate the client secret JWT from the <code>.p8</code> key (Team ID + Key ID + Services ID). Apple secrets expire after at most 6 months — set a reminder to rotate it.</li>
              <li>Paste the <b>Services ID</b> as Client ID and the generated JWT as Client Secret into <b>Supabase Dashboard → Authentication → Providers → Apple</b>, then enable the provider.</li>
            </ol>
            <Field label="Return URL / redirect URI" value={CALLBACK} />
            <Field label="Web domain" value={siteUrl.replace(/^https?:\/\//, "")} />
          </div>
        )}

        {tab === "urls" && (
          <div className="admin-card mt-4 space-y-3 rounded-xl border p-5 text-sm">
            <h2 className="text-base font-semibold">Supabase URL configuration</h2>
            <p className="opacity-80">
              In <b>Supabase Dashboard → Authentication → URL Configuration</b>, set the Site URL and add every domain
              users can sign in from as a redirect URL. Missing entries cause a <code>requested path is invalid</code> error
              after the provider redirect.
            </p>
            <Field label="Site URL" value={siteUrl} />
            <Field label="Additional redirect URL" value={`${siteUrl}/*`} />
            <Field label="Provider callback (read-only)" value={CALLBACK} />
            <p className="text-xs opacity-60">
              Tip: after enabling a provider, sign out and try the button on the sign-in page. Errors from the provider are
              shown as a toast.
            </p>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
