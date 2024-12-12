import { CreatePrompt } from "@/webview/components/create-prompt";
import { Provider } from "jotai";
import React from "react";
import { createRoot } from "react-dom/client";
import "./app.css";

window.addEventListener("load", () => {
  const container = document.getElementById("root");
  if (container) {
    const root = createRoot(container);
    root.render(
      <Provider>
        <div className="vscode-container">
          <CreatePrompt />
        </div>
      </Provider>
    );
  }
});
