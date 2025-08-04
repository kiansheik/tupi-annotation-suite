// src/components/WordBank.tsx
import React, { useEffect, useState } from 'react';
import { WordEntry, WordType } from '../types/WordEntry';

interface Props {
  onInsert?: (lemma: string) => void;
  onUpdate?: (text: string) => void;
  words: WordEntry[];
}

const LOCAL_STORAGE_KEY = 'customWords';

export default function WordBank({ onInsert, onUpdate, words: wordsProp }: Props) {
  const [words, setWords] = useState<WordEntry[]>([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<Partial<WordEntry>>({});

  useEffect(() => {
    setWords(wordsProp);
  }, [wordsProp]);


  const saveWords = (entries: WordEntry[]) => {
    setWords(entries);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(entries));
  };

  const handleAdd = () => {
    if (form.lemma && form.form && form.definition && form.type) {
      const newEntry = form as WordEntry;
      const updated = [...words, newEntry];
      saveWords(updated);

      // Automatically define it in Python session
      let args = `"${form.form}"`;
      if (form.definition) args += `, "definition=${form.definition}"`;
      if (form.tag) args += `, "tag=${form.tag}"`;
      onUpdate?.(`${form.lemma} = ${form.type}(${args})`);
    }
    setForm({});
  };

  const filtered = words.filter((w) => {
    const term = search.toLowerCase();
    return (
      w.form.toLowerCase().includes(term) ||
      w.lemma.toLowerCase().includes(term) ||
      w.definition.toLowerCase().includes(term) ||
      w.tag?.toLowerCase().includes(term)
    );
  });

  return (
    <div>
      <h2>Word Bank</h2>

      <div style={{ marginBottom: '1em' }}>
        <input
          placeholder="Form"
          value={form.form || ''}
          onChange={(e) => setForm({ ...form, form: e.target.value })}
        />
        <input
          placeholder="Variable Name"
          value={form.lemma || ''}
          onChange={(e) => setForm({ ...form, lemma: e.target.value })}
        />
        <input
          placeholder="Type (e.g., Noun)"
          value={form.type || ''}
          onChange={(e) => setForm({ ...form, type: e.target.value as WordType })}
        />
        <input
          placeholder="Definition"
          value={form.definition || ''}
          onChange={(e) => setForm({ ...form, definition: e.target.value })}
        />
        <input
          placeholder="Tag"
          value={form.tag || ''}
          onChange={(e) => setForm({ ...form, tag: e.target.value })}
        />
        <button onClick={handleAdd}>Add Word</button>
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search..."
        style={{
          marginBottom: '0.5em',
          padding: '5px 10px',
          backgroundColor: '#1e1e1e',
          border: '1px solid #444',
          color: '#fff',
          borderRadius: '4px',
          width: '100%'
        }}
      />

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Form</th>
            <th>Variable Name</th>
            <th>Type</th>
            <th>Definition</th>
            <th>Tag</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((w, i) => (
            <tr
              key={i}
              style={{
                borderBottom: '1px solid #333',
                backgroundColor: i % 2 === 0 ? 'rgb(28 28 28)' : 'rgb(28 28 28 / 75%)',
              }}
            >
              <td>{w.form}</td>
              <td>
                <span
                  onClick={() => {
                    let args = `"${w.form}"`;
                    if (w.definition) args += `, definition="${w.definition}"`;
                    if (w.tag) args += `, tag="${w.tag}"`;
                    onUpdate?.(`${w.lemma} = ${w.type}(${args})`);
                    onInsert?.(w.lemma); // insert name at cursor
                  }}
                  style={{
                    cursor: 'pointer',
                    color: '#6cf',
                    textDecoration: 'underline'
                  }}
                >
                  {w.lemma}
                </span>
              </td>
              <td>{w.type}</td>
              <td>{w.definition}</td>
              <td>{w.tag}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
