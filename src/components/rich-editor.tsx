import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect } from "react";

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export function RichEditor({ value, onChange, placeholder, minHeight = 160 }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { class: "text-primary underline" } }),
      Placeholder.configure({ placeholder: placeholder ?? "Write here…" }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: "prose prose-sm dark:prose-invert max-w-none focus:outline-none px-3 py-2",
        style: `min-height:${minHeight}px`,
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  // Sync external value if it changes (e.g. reset)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  if (!editor) return <div className="rounded border bg-background" style={{ minHeight }} />;
  return (
    <div className="rounded border bg-background">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const btn = "rounded px-2 py-1 text-xs hover:bg-muted";
  const active = "bg-muted font-semibold";
  return (
    <div className="flex flex-wrap items-center gap-1 border-b bg-muted/30 px-2 py-1">
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`${btn} ${editor.isActive("bold") ? active : ""}`}><b>B</b></button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`${btn} ${editor.isActive("italic") ? active : ""}`}><i>I</i></button>
      <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={`${btn} ${editor.isActive("strike") ? active : ""}`}><s>S</s></button>
      <span className="mx-1 h-4 w-px bg-border" />
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`${btn} ${editor.isActive("heading", { level: 2 }) ? active : ""}`}>H2</button>
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={`${btn} ${editor.isActive("heading", { level: 3 }) ? active : ""}`}>H3</button>
      <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`${btn} ${editor.isActive("bulletList") ? active : ""}`}>• List</button>
      <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`${btn} ${editor.isActive("orderedList") ? active : ""}`}>1. List</button>
      <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`${btn} ${editor.isActive("blockquote") ? active : ""}`}>❝</button>
      <button type="button" onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={`${btn} ${editor.isActive("codeBlock") ? active : ""}`}>{"</>"}</button>
      <span className="mx-1 h-4 w-px bg-border" />
      <button type="button" onClick={() => {
        const url = window.prompt("Link URL");
        if (!url) return;
        editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
      }} className={btn}>🔗</button>
      <button type="button" onClick={() => editor.chain().focus().unsetLink().run()} className={btn}>⛓️‍💥</button>
      <span className="mx-1 h-4 w-px bg-border" />
      <button type="button" onClick={() => editor.chain().focus().undo().run()} className={btn}>↶</button>
      <button type="button" onClick={() => editor.chain().focus().redo().run()} className={btn}>↷</button>
    </div>
  );
}
