import React from "react";
import { WordEntry } from "../types/WordEntry";

interface Props {
  words: WordEntry[];
}

export default function WordBank({ words }: Props) {
  return (
    <div>
      <h2>Word Bank</h2>
      <table>
        <thead>
          <tr>
            <th>Form</th>
            <th>Variable</th>
            <th>Type</th>
            <th>Definition</th>
            <th>Tag</th>
          </tr>
        </thead>
        <tbody>
          {words.map((w, i) => (
            <tr key={i}>
              <td>{w.form}</td>
              <td>{w.lemma}</td>
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
