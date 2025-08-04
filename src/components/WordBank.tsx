// src/components/WordBank.tsx
import React, { useEffect, useState } from 'react';
import { WordEntry } from '../types/WordEntry';

interface Props {
  words: WordEntry[];
  onInsert?: (lemma: string) => void;
}

export default function WordBank({ words, onInsert }: Props) {
  const [search, setSearch] = useState('');
  const [filtered, setFiltered] = useState<WordEntry[]>(words);

  useEffect(() => {
    const term = search.toLowerCase();
    setFiltered(
      words.filter(
        (w) =>
          w.form.toLowerCase().includes(term) ||
          w.lemma.toLowerCase().includes(term) ||
          w.definition.toLowerCase().includes(term) ||
          w.tag?.toLowerCase().includes(term)
      )
    );
  }, [search, words]);

  return (
    <div>
      <h2>Word Bank</h2>
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
            <th style={{ textAlign: 'left', padding: '4px' }}>Form</th>
            <th style={{ textAlign: 'left', padding: '4px' }}>Lemma</th>
            <th style={{ textAlign: 'left', padding: '4px' }}>Type</th>
            <th style={{ textAlign: 'left', padding: '4px' }}>Definition</th>
            <th style={{ textAlign: 'left', padding: '4px' }}>Tag</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((w, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #333' }}>
              <td>{w.form}</td>
              <td>
                <span
                  onClick={() => onInsert?.(w.lemma)}
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