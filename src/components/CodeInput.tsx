// src/components/CodeInput.tsx
import React, { useState, forwardRef, useImperativeHandle } from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-python';
import 'prismjs/themes/prism-tomorrow.css';

interface Props {
  onSubmit: (code: string) => void;
  disabled: boolean;
}

export interface CodeInputRef {
  insertAtCursor: (text: string) => void;
}

const CodeInput = forwardRef<CodeInputRef, Props>(({ onSubmit, disabled }, ref) => {
  const [code, setCode] = useState('');

  useImperativeHandle(ref, () => ({
    insertAtCursor: (text: string) => {
      const textarea = document.getElementById("codeArea") as HTMLTextAreaElement;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const updated =
          code.substring(0, start) + text + code.substring(end);
        setCode(updated);

        // restore cursor position after insert
        setTimeout(() => {
          textarea.focus();
          textarea.selectionStart = textarea.selectionEnd = start + text.length;
        }, 0);
      }
    }
  }));

  const runSelectionOrLine = () => {
    const selection = window.getSelection();
    const selectedText = selection?.toString();
    if (selectedText?.trim()) {
      onSubmit(selectedText);
    } else {
      // fallback: run current line
      const cursorPos = selection?.anchorOffset ?? 0;
      const lines = code.split('\n');
      let charCount = 0;
      for (let i = 0; i < lines.length; i++) {
        charCount += lines[i].length + 1;
        if (cursorPos <= charCount) {
          onSubmit(lines[i]);
          break;
        }
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      runSelectionOrLine();
    }
  };

  return (
    <div onKeyDown={handleKeyDown}>
      <Editor
        value={code}
        onValueChange={setCode}
        highlight={(code: string) => Prism.highlight(code, Prism.languages.python, 'python')}
        padding={10}
        textareaId="codeArea"
        textareaClassName="code-editor-textarea"
        preClassName="code-editor"
        style={{
          fontFamily: '"Fira code", "Fira Mono", monospace',
          fontSize: 14,
          border: '1px solid #444',
          borderRadius: '5px',
          backgroundColor: '#1e1e1e',
          color: '#f8f8f2',
          minHeight: '160px',
        }}
        disabled={disabled}
      />
      <button onClick={() => onSubmit(code)} disabled={disabled} style={{ marginTop: 10 }}>
        Run Python
      </button>
    </div>
  );
});

export default CodeInput;