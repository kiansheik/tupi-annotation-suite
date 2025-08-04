// src/components/PyodideManager.tsx
import React, { useEffect, useRef, useState } from 'react';
import pako from 'pako';
import { sampleWords } from "../data/sampleWords";
import CodeInput from './CodeInput';
import { CodeInputRef} from './CodeInput';
import WordBank from './WordBank';
import { WordEntry } from '../types/WordEntry';


interface ProcessBlockMessage {
  command: 'processBlock';
  orderid: number;
  hash: string;
  html: string;
}

export default function PyodideManager() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [pyodideLoaded, setPyodideLoaded] = useState(false);
  const [dictLoaded, setDictLoaded] = useState(false);
  const [pyodideReady, setPyodideReady] = useState(false);
  const [jsonData, setJsonData] = useState<any[]>([]);
  const [output, setOutput] = useState<string>('');
  const [orderId, setOrderId] = useState(0);
  const [words] = useState<WordEntry[]>(sampleWords);
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
    console.log({ pyodideLoaded, dictLoaded, pyodideReady });
    if (pyodideLoaded && dictLoaded && !pyodideReady) {
      setPyodideReady(true);
    }
  }, [pyodideLoaded, dictLoaded, pyodideReady]);

  const receiveMessage = (event: MessageEvent) => {
    if (event.data.pyodideLoaded) {
      setPyodideLoaded(true);
      console.log('Pyodide Loaded!');
    } else if (event.data.command === 'processBlockResponse') {
      const resp = event.data.resp_html || '[no output]';
      setOutput(resp);
    }
  };

  const runPythonCode = (inputCode: string) => {
    if (!inputCode.trim()) return;
    setOutput('');
    const hash = `input-${Date.now()}`;
    const message: ProcessBlockMessage = {
      command: 'processBlock',
      orderid: orderId,
      hash,
      html: `<pre>${String(inputCode)}</pre>`,
    };
    console.log('Sending message:', message);
    iframeRef.current?.contentWindow?.postMessage(message, '*');
    setOrderId(orderId + 1);
  };

  return (
    <div>
      <WordBank words={words} onInsert={(lemma) => editorRef.current?.insertAtCursor(lemma)} />
      <h2>Python Code</h2>
      
      <CodeInput ref={editorRef} onSubmit={runPythonCode} disabled={!pyodideReady} />
      <h3>Output:</h3>
      <pre style={{ backgroundColor: '#111', color: '#0f0', padding: '1em' }}>{output}</pre>

      <iframe
        id="pyodide-iframe"
        ref={iframeRef}
        src={`${basePath}iframe_pyodide.html`}
        style={{ display: 'none' }}
      ></iframe>
    </div>
  );
}
