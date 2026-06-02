import {
  useEditor,
  EditorContent,
  ReactRenderer,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Mention from "@tiptap/extension-mention";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Code,
} from "lucide-react";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import tippy from "tippy.js";
import "./rich-text-editor.css"; // custom css for mention popup

export interface RichTextEditorRef {
  clearContent: () => void;
}

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  users?: { _id: string; name: string; username?: string; profilePicture?: string }[];
  minHeight?: string;
}

export const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(
  ({ value, onChange, placeholder = "Write something...", users = [], minHeight = "150px" }, ref) => {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
      setIsClient(true);
    }, []);

    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [1, 2, 3],
          },
        }),
        Link.configure({
          openOnClick: false,
          autolink: true,
        }),
        Image.configure({
          inline: true,
        }),
        Mention.configure({
          HTMLAttributes: {
            class: "mention",
          },
          renderLabel({ options, node }) {
            return `${options.suggestion.char}${node.attrs.label ?? node.attrs.id}`
          },
          suggestion: {
            items: ({ query }) => {
              return users
                .filter((item) =>
                  item.name.toLowerCase().includes(query.toLowerCase()) ||
                  item.username?.toLowerCase().includes(query.toLowerCase())
                )
                .slice(0, 5);
            },
            // The render part of mention would typically use a ReactRenderer to show a popup,
            // For simplicity without a complex popup component, TipTap mention can be basic
            // To do a full popup, you'd integrate tippy.js with a React Component.
          },
        }),
      ],
      content: value,
      editorProps: {
        attributes: {
          class:
            "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[150px] p-4",
        },
      },
      onUpdate: ({ editor }) => {
        // onChange(editor.getHTML());
        // if we want raw text (useful for parsing later or backwards compatibility):
        // For now let's output HTML but our backend parses text.
        // We'll output plain text for simple implementation, or HTML if we update backend to parse HTML mentions.
        onChange(editor.getHTML());
      },
    });

    useImperativeHandle(ref, () => ({
      clearContent: () => {
        editor?.commands.setContent("");
      },
    }));

    useEffect(() => {
      if (editor && editor.getHTML() !== value && value !== "") {
         // careful with circular updates
         // editor.commands.setContent(value);
      }
    }, [value, editor]);

    if (!editor || !isClient) {
      return null;
    }

    return (
      <div className="border rounded border-border bg-background flex flex-col overflow-hidden">
        <div className="flex flex-wrap items-center gap-1 p-2 border-b border-border bg-muted/50">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            className={`p-1.5 rounded hover:bg-muted ${
              editor.isActive("bold") ? "bg-muted" : ""
            }`}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded hover:bg-muted ${
              editor.isActive("italic") ? "bg-muted" : ""
            }`}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            disabled={!editor.can().chain().focus().toggleStrike().run()}
            className={`p-1.5 rounded hover:bg-muted ${
              editor.isActive("strike") ? "bg-muted" : ""
            }`}
            title="Strikethrough"
          >
            <Strikethrough className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCode().run()}
            disabled={!editor.can().chain().focus().toggleCode().run()}
            className={`p-1.5 rounded hover:bg-muted ${
              editor.isActive("code") ? "bg-muted" : ""
            }`}
            title="Code"
          >
            <Code className="h-4 w-4" />
          </button>
          <div className="w-px h-4 bg-border mx-1"></div>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1.5 rounded hover:bg-muted ${
              editor.isActive("bulletList") ? "bg-muted" : ""
            }`}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-1.5 rounded hover:bg-muted ${
              editor.isActive("orderedList") ? "bg-muted" : ""
            }`}
            title="Ordered List"
          >
            <ListOrdered className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-1.5 rounded hover:bg-muted ${
              editor.isActive("blockquote") ? "bg-muted" : ""
            }`}
            title="Blockquote"
          >
            <Quote className="h-4 w-4" />
          </button>
          <div className="w-px h-4 bg-border mx-1"></div>
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run()}
            className="p-1.5 rounded hover:bg-muted disabled:opacity-50"
            title="Undo"
          >
            <Undo className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().chain().focus().redo().run()}
            className="p-1.5 rounded hover:bg-muted disabled:opacity-50"
            title="Redo"
          >
            <Redo className="h-4 w-4" />
          </button>
        </div>

        <EditorContent 
            editor={editor} 
            className="flex-1 cursor-text" 
            style={{ minHeight }}
        />
      </div>
    );
  }
);

RichTextEditor.displayName = "RichTextEditor";
