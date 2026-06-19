"use client";

export type TransferReviewChoice = "INTERNAL" | "PAYMENT" | "INCOME" | "UNSURE";

export function TransferReviewPanel({ choice, possiblePair, onChoose }: { choice?: TransferReviewChoice; possiblePair: boolean; onChoose(choice: TransferReviewChoice): void }) {
  const options: Array<{ value: TransferReviewChoice; label: string; help: string }> = [
    { value: "INTERNAL", label: "Transfer between my own accounts", help: "Treat as an internal transfer, not income or spending." },
    { value: "PAYMENT", label: "Payment to someone else", help: "Keep it in review until you choose a spending category." },
    { value: "INCOME", label: "Money received from someone else", help: "Keep it in review until you choose an income category." },
    { value: "UNSURE", label: "Not sure", help: "Leave this transaction in Needs review." },
  ];
  return <section className="mt-4 rounded-2xl border border-warning-amber bg-warning-amber/10 p-4" aria-label="Transfer review">
    <p className="font-bold text-brand-deepTeal">This looks like a transfer. Is it money moved between your own accounts?</p>
    <p className="mt-1 text-xs leading-5 text-brand-deepTeal/65">SpendGrove cannot know for certain from one bank file. Choose what actually happened.</p>
    {possiblePair && <p className="mt-2 rounded-xl bg-white p-3 text-xs font-semibold text-brand-teal">Possible transfer between your accounts: an opposite amount appears nearby. Please confirm rather than relying on the suggestion.</p>}
    <div className="mt-3 grid gap-2">{options.map((option) => <button key={option.value} type="button" aria-pressed={choice === option.value} onClick={() => onChoose(option.value)} className={`rounded-2xl border p-3 text-left ${choice === option.value ? "border-brand-green bg-white" : "border-border bg-white/70"}`}><span className="block text-sm font-bold text-brand-deepTeal">{option.label}</span><span className="mt-1 block text-xs leading-5 text-brand-deepTeal/60">{option.help}</span></button>)}</div>
  </section>;
}
