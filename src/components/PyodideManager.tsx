// src/components/PyodideManager.tsx
import React, { useEffect, useRef, useState } from 'react';
import pako from 'pako';
import { sampleWords } from "../data/sampleWords";
import CodeInput from './CodeInput';
import { CodeInputRef } from './CodeInput';
import WordBank from './WordBank';
import { WordEntry, WordType } from '../types/WordEntry';

interface ProcessBlockMessage {
  command: 'processBlock' | 'processBlockSilent';
  orderid: number;
  hash: string;
  html: string;
}

const LOCAL_STORAGE_KEY = 'customWords';

export default function PyodideManager() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [pyodideLoaded, setPyodideLoaded] = useState(false);
  const [dictLoaded, setDictLoaded] = useState(false);
  const [pyodideReady, setPyodideReady] = useState(false);
  const [jsonData, setJsonData] = useState<any[]>([]);
  const [output, setOutput] = useState<string>('');
  const [orderId, setOrderId] = useState(0);
  const [words, setWords] = useState<WordEntry[]>(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    return stored ? JSON.parse(stored) : sampleWords;
  });
  const editorRef = useRef<CodeInputRef>(null);

  const basePath = '/tupi-annotation-suite/';

  useEffect(() => {
    async function loadJson() {
      try {
        const response = await fetch(`${basePath}dict-conjugated.json.gz`);
        const arrayBuffer = await response.arrayBuffer();
        const decompressed = pako.inflate(new Uint8Array(arrayBuffer), { to: 'string' });
        const json = JSON.parse(decompressed);
        setJsonData(json);
        setDictLoaded(true);
        console.log('dict loaded!');
      } catch (err) {
        console.error('Error loading dict:', err);
      }
    }

    loadJson();
    window.addEventListener('message', receiveMessage);
    return () => window.removeEventListener('message', receiveMessage);
  }, []);

  useEffect(() => {
    if (pyodideLoaded && dictLoaded && !pyodideReady) {
        // 👇 Load built-in predicates after everything is ready
        setTimeout(preloadLibraryPredicates, 500);
        setPyodideReady(true);
    }
  }, [pyodideLoaded, dictLoaded, pyodideReady]);

  const receiveMessage = (event: MessageEvent) => {
    console.log('Received message:', event.data);
    if (event.data.pyodideLoaded) {
      setPyodideLoaded(true);
      console.log('Pyodide Loaded!');
    } else if (event.data.command === 'processBlockResponse') {
      const resp = event.data.resp_html || '[no output]';
      setOutput(resp);
      extractAndSaveWord(event.data.pre_html);
    } else if (event.data.command === 'processBlockResponseSilent') {
      const resp = event.data.resp_html || '[no output]';
      console.log('Silent response received.');
      extractAndSaveWord(resp);
      console.log('Extracted and saved word from silent response.');
    }
  };

const preloadLibraryPredicates = () => {
  const code = `
import json
from pydicate import Predicate
instances = [p.simple_signature() for p in Predicate.instances()]
print(json.dumps(instances))
`;
  runPythonCode(code, true, true); // true = don't overwrite output
};


const extractAndSaveWord = (input: string) => {
  let lines: string[] = [];

  try {
    //Split input on the last \n and only keep [0]
    input = input.split('\n').slice(0, -1).join('\n').trim();
    if (!input) return;
    // Try to parse the input as JSON array
    const parsed = JSON.parse(input);
    if (Array.isArray(parsed) && parsed.every(line => typeof line === 'string')) {
      lines = parsed.map(line => line.trim()).filter(Boolean);
    } else {
      throw new Error('Invalid JSON format');
    }
  } catch {
    // Fallback to plain text parsing
    const code = input.replace(/<[^>]*>/g, '').trim();
    lines = code.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  }
  console.log('Extracted lines for word saving:', lines);
  for (const line of lines) {
    if (!/^[\p{L}_][\p{L}\p{N}_]*\s*=\s*[A-Z][a-zA-Z_]*\s*\(/u.test(line)) continue;

    const mainPattern = /^([\p{L}_][\p{L}\p{N}_]*)\s*=\s*([A-Z][a-zA-Z_]+)\(\s*"([^"]+)"(?:\s*,\s*(.*))?\)/u;
    const mainMatch = line.match(mainPattern);
    if (!mainMatch) continue;

    const [, lemma, typeRaw, form, rest] = mainMatch;
    const type = typeRaw as WordType;

    let definition = '';
    let tag = '';

    if (rest) {
      const defMatch = rest.match(/definition\s*=\s*"([^"]+)"/);
      const tagMatch = rest.match(/tag\s*=\s*"([^"]+)"/);

      if (defMatch) definition = defMatch[1];
      if (tagMatch) tag = tagMatch[1];

      if (!defMatch && !tagMatch) {
        const args = [...rest.matchAll(/"([^"]+)"/g)].map(m => m[1]);
        if (args[0]) definition = args[0];
        if (args[1]) tag = args[1];
      }
    }

    const newEntry: WordEntry = { lemma, type, form, definition, tag };

    setWords(prev => {
      const updated = [...prev.filter(w => w.lemma !== lemma), newEntry];
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      console.log('Saved new word:', newEntry);
      return updated;
    });
  }
};


// Reload all saved words when pyodide becomes ready
const replaySavedWords = (onUpdate: (text: string) => void) => {
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!saved) return;

  try {
    const wordList: WordEntry[] = JSON.parse(saved);
    wordList.forEach((w) => {
      let args = `"${w.form}"`;
      if (w.definition) args += `, definition="${w.definition}"`;
      if (w.tag) args += `, tag="${w.tag}"`;
      onUpdate(`${w.lemma} = ${w.type}(${args})`);
    });
  } catch (err) {
    console.error('Failed to replay saved words:', err);
  }
};


    const runPythonCode = (inputCode: string, silent: boolean = false, initial: boolean = false) => {
        if (!inputCode.trim()) return;
        const hash = `input-${Date.now()}`;
        let comm: 'processBlock' | 'processBlockSilent' = 'processBlock';
        if (initial) {
            comm = 'processBlockSilent';
        }
        const message: ProcessBlockMessage = {
            command: comm,
            orderid: orderId,
            hash,
            html: `<pre>${String(inputCode)}</pre>`,
        };
        iframeRef.current?.contentWindow?.postMessage(message, '*');
        if (!silent) {
            setOutput(''); // only clear output for user-submitted code
        }
        setOrderId(orderId + 1);
    };

  return (
    <div>
      <h3>Output:</h3>
      <pre style={{ backgroundColor: '#111', color: '#0f0', padding: '1em' }}>
        {output}
      </pre>
      <CodeInput
        ref={editorRef}
        onSubmit={runPythonCode}
        disabled={!pyodideReady}
      />
      <WordBank
        words={words}
        onInsert={(text) => {
          editorRef.current?.insertAtCursor?.(text);
        }}
        onUpdate={(text) => {
          runPythonCode(`${text}\n`);
        }}
      />

      <iframe
        id="pyodide-iframe"
        ref={iframeRef}
        src={`${basePath}iframe_pyodide.html`}
        style={{ display: 'none' }}
      />
    </div>
  );
}
