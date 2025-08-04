import React, { useState } from "react";
import { sampleWords } from "./data/sampleWords";
import { WordEntry } from "./types/WordEntry";
import PyodideManager from "./components/PyodideManager";

function App() {
  const [input, setInput] = useState("");
  const [words] = useState<WordEntry[]>(sampleWords);

  // placeholder logic
  const output = input
    .split(/\s+/)
    .map((token) => {
      const found = words.find((w) => w.form === token);
      return found
        ? `${found.lemma} = ${found.type}("${found.form}", definition="${found.definition}")`
        : `# unknown: ${token}`;
    })
    .join("\n");

  return (
    <div className="App" style={{ maxWidth: 800, margin: '2em auto', padding: '0 1em' }}>
      <h1>Tupi Abstract Language Tool</h1>
      <PyodideManager />
    </div>    
  );
}

export default App;
