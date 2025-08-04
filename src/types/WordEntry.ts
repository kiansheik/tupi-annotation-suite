export type WordType = "Noun" | "Verb" | "Adverb" | "ProperNoun";

export interface WordEntry {
  form: string;
  lemma: string;
  type: WordType;
  definition: string;
  tag?: string;
}
