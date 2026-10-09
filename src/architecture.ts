import "virtual:uno.css";
import { createElement, useState } from "react";
import { createRoot } from "react-dom/client";
import { Tldraw, parseTldrawJsonFile, type Editor } from "tldraw";
import "tldraw/tldraw.css";

async function loadRoadmap(editor: Editor) {
  const response = await fetch("./Architecture.tldr");
  if (!response.ok) {
    throw new Error(`Could not load Roadmap.tldr (${response.status}).`);
  }

  const parsed = parseTldrawJsonFile({
    schema: editor.store.schema,
    json: await response.text(),
  });
  if (!parsed.ok) {
    throw new Error(`Could not read Roadmap.tldr (${parsed.error.type}).`);
  }

  editor.loadSnapshot(parsed.value.getStoreSnapshot());
  editor.updateInstanceState({ isReadonly: true });

  const bounds = editor.getCurrentPageBounds();
  if (bounds) editor.zoomToBounds(bounds, { targetZoom: 1, immediate: true });
}

function Roadmap() {
  const [error, setError] = useState<string | null>(null);

  return createElement(
    "div",
    { className: "h-screen w-full" },
    createElement(Tldraw, {
      onMount: (editor) => {
        void loadRoadmap(editor).catch((loadError: unknown) => {
          console.error(loadError);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load the roadmap.",
          );
        });
      },
    }),
    error &&
      createElement(
        "div",
        {
          role: "alert",
          style: {
            position: "fixed",
            top: "1rem",
            left: "1rem",
            zIndex: 1000,
            padding: "0.75rem 1rem",
            background: "white",
            color: "#9b1c1c",
            border: "1px solid #e5b4b4",
            fontFamily: "sans-serif",
          },
        },
        error,
      ),
  );
}

const root = document.getElementById("app");
if (!root) throw new Error("Missing #app roadmap mount point.");

createRoot(root).render(createElement(Roadmap));
