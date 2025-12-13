import React, { useRef } from "react";
import { Editor } from "@tinymce/tinymce-react";

export default function TinyMceTest() {
  const editorRef = useRef(null);

  return (
    <div style={{ padding: 20 }}>
      <h2>Minimal TinyMCE Test</h2>
      <Editor
        tinymceScriptSrc="/tinymce/tinymce.min.js" // 👈 force self-hosted
        onInit={(_, editor) => (editorRef.current = editor)}
        init={{
          height: 300,
          menubar: false,
          plugins: "lists link",
          toolbar:
            "undo redo | bold italic underline | bullist numlist | link",
          branding: false,
          promotion: false,
          base_url: "/tinymce", // 👈 point to /public/tinymce
          suffix: ".min",
        }}
      />
    </div>
  );
}
