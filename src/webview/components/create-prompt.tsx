import { formatTag, validatePrompt } from "@/prompt-utils";
import { Prompt } from "@/types";
import { promptAtom } from "@/webview/atoms";
import { FormError } from "@/webview/types";
import { useAtom } from "jotai/index";
import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import "./create-prompt.css";

const TEXTAREA_UPDATE_INTERVAL = 1000 / 60; // 60fps

export const CreatePrompt: React.FC = () => {
  const [prompt, setPrompt] = useAtom(promptAtom);
  const [formErrors, setFormErrors] = useState<FormError[]>([]);
  const [isAdvancedView, setIsAdvancedView] = useState(false);
  const [tags, setTags] = useState<Array<{id: string; text: string}>>(prompt?.tags || []);
  
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const versionRef = useRef<HTMLInputElement>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const newTagRef = useRef<HTMLInputElement>(null);
  const lastUpdateRef = useRef<number>(0);
  const rafRef = useRef<number>();

  // 使用 ResizeObserver 监听容器大小变化
  useLayoutEffect(() => {
    const container = document.querySelector('.create-prompt-container');
    if (!container) return;

    const observer = new ResizeObserver(() => {
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = undefined;
        });
      }
    });

    observer.observe(container);
    return () => {
      observer.disconnect();
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData: Partial<Prompt> = {
      content: contentRef.current?.value || '',
      title: titleRef.current?.value,
      version: versionRef.current?.value || '0.1.0',
      notes: notesRef.current?.value,
      tags
    };

    const validation = validatePrompt(formData as Prompt);
    if (!validation.success) {
      setFormErrors(
        validation.errors?.map((message) => ({
          type: "validation",
          message,
        })) || []
      );
      return;
    }

    try {
      const vscode = acquireVsCodeApi();
      vscode.postMessage({
        command: "submitPrompt",
        promptRule: formData,
      });
      setPrompt(formData as Prompt);
    } catch (error) {
      setFormErrors([
        {
          type: "submit",
          message: "Failed to submit prompt",
        },
      ]);
    }
  }, [tags, setPrompt]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === "Enter" && newTagRef.current?.value.trim()) {
      event.preventDefault();
      const formattedTag = formatTag(newTagRef.current.value);
      if (formattedTag) {
        setTags(prev => [...prev, { id: Date.now().toString(), text: formattedTag }]);
        if (newTagRef.current) newTagRef.current.value = '';
      }
    }
  }, []);

  const removeTag = useCallback((tagId: string) => {
    setTags(prev => prev.filter(tag => tag.id !== tagId));
  }, []);

  const memoizedTags = useMemo(() => (
    <div className="tags">
      {tags.map((tag) => (
        <span key={tag.id} className="tag">
          {tag.text}
          <button type="button" onClick={() => removeTag(tag.id)}>×</button>
        </span>
      ))}
    </div>
  ), [tags, removeTag]);

  return (
    <div className="create-prompt-container">
      <div className="view-mode-toggle">
        <button 
          type="button"
          className={`mode-button ${!isAdvancedView ? 'active' : ''}`}
          onClick={() => setIsAdvancedView(false)}
        >
          Simple
        </button>
        <button 
          type="button"
          className={`mode-button ${isAdvancedView ? 'active' : ''}`}
          onClick={() => setIsAdvancedView(true)}
        >
          Advanced
        </button>
      </div>

      <form onSubmit={handleSubmit} className="prompt-form">
        {formErrors.length > 0 && (
          <div className="error-messages">
            {formErrors.map((error, index) => (
              <div key={index} className="error-message">
                {error.message}
              </div>
            ))}
          </div>
        )}

        <div className="form-group">
          <div className="label-group">
            <label htmlFor="content">Prompt Content</label>
          </div>
          <textarea
            ref={contentRef}
            id="content"
            name="content"
            rows={8}
            defaultValue={prompt?.content}
            spellCheck={false}
          />
        </div>

        {isAdvancedView && (
          <>
            <div className="form-group">
              <div className="label-group">
                <label htmlFor="title">Title</label>
              </div>
              <input
                ref={titleRef}
                type="text"
                id="title"
                name="title"
                defaultValue={prompt?.title}
                spellCheck={false}
              />
            </div>

            <div className="form-group">
              <div className="label-group">
                <label htmlFor="version">Version</label>
              </div>
              <input
                ref={versionRef}
                type="text"
                id="version"
                name="version"
                defaultValue={prompt?.version || '0.1.0'}
                spellCheck={false}
              />
            </div>

            <div className="form-group">
              <div className="label-group">
                <label htmlFor="tags">Tags</label>
              </div>
              <input
                ref={newTagRef}
                type="text"
                id="tags"
                name="tags"
                onKeyDown={handleKeyDown}
                placeholder="Press Enter to add tag"
                spellCheck={false}
              />
              {memoizedTags}
            </div>

            <div className="form-group">
              <div className="label-group">
                <label htmlFor="notes">Notes (Optional)</label>
              </div>
              <textarea
                ref={notesRef}
                id="notes"
                name="notes"
                rows={6}
                defaultValue={prompt?.notes}
                spellCheck={false}
                placeholder="# What you can build
A brief description of what this prompt helps create or accomplish

# Benefits
Key advantages and benefits of using this prompt

# Overview
Additional context, tips, or guidelines for using this prompt effectively"
              />
            </div>
          </>
        )}

        <button type="submit">Save Prompt</button>
      </form>
    </div>
  );
};
