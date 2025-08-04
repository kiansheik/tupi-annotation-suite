import React from "react";

interface Props {
  output: string;
}

export default function TranslationOutput({ output }: Props) {
  return (
    <div className="translation-output">
      <h2>Python-like Output</h2>
      <pre style={{ backgroundColor: "#222", color: "#0f0", padding: "1em" }}>
        {output}
      </pre>
    </div>
  );
}
