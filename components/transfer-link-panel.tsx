"use client";

import { useEffect, useState } from "react";
import { formatAudFromCents } from "@/lib/money";

type TransferSummary = {
  id: string;
  date: string;
  amountCents: number;
};

type TransferReview = {
  state: "NONE" | "SUGGESTION" | "LINKED";
  linkId: string | null;
  outgoing: TransferSummary | null;
  incoming: TransferSummary | null;
};

type ReviewResponse =
  | { ok: true; review: TransferReview }
  | { ok: false; error: string };

type MutationResponse =
  | {
      ok: true;
      transferLink: {
        id: string;
        outgoingTransactionId: string;
        incomingTransactionId: string;
        confirmedAt: string;
        unlinkedAt: string | null;
      };
    }
  | { ok: false; error: string };

function dateLabel(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Australia/Brisbane",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

async function safeJson<T>(response: Response, fallback: string): Promise<T | { ok: false; error: string }> {
  try {
    return await response.json() as T;
  } catch {
    return { ok: false, error: fallback };
  }
}

export function TransferLinkPanel({
  transactionId,
  onChange,
}: Readonly<{
  transactionId: string;
  onChange: () => void;
}>) {
  const [review, setReview] = useState<TransferReview | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setReview(null);
    setDismissed(false);
    setError("");
    void fetch(`/api/account/transfer-links?transactionId=${encodeURIComponent(transactionId)}`, {
      cache: "no-store",
    }).then((response) => safeJson<ReviewResponse>(
      response,
      "Transfer matching could not be checked safely.",
    )).then((result) => {
      if (cancelled) return;
      if (result.ok) setReview(result.review);
      else setError(result.error);
    });
    return () => { cancelled = true; };
  }, [transactionId]);

  if (dismissed || review?.state === "NONE") return null;
  if (!review) {
    return error
      ? <p role="alert" className="mt-4 rounded-xl bg-warning-amber/10 p-3 text-sm text-foreground">{error}</p>
      : null;
  }
  if (!review.outgoing || !review.incoming) return null;

  async function linkTransfers() {
    if (!review?.outgoing || !review.incoming || isBusy) return;
    setIsBusy(true);
    setError("");
    const response = await fetch("/api/account/transfer-links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        outgoingTransactionId: review.outgoing.id,
        incomingTransactionId: review.incoming.id,
      }),
    });
    const result = await safeJson<MutationResponse>(
      response,
      "The transfers could not be linked safely.",
    );
    setIsBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setReview({ ...review, state: "LINKED", linkId: result.transferLink.id });
    onChange();
  }

  async function unlinkTransfers() {
    if (!review?.linkId || isBusy) return;
    setIsBusy(true);
    setError("");
    const response = await fetch(
      `/api/account/transfer-links/${encodeURIComponent(review.linkId)}`,
      { method: "DELETE" },
    );
    const result = await safeJson<MutationResponse>(
      response,
      "The transfer link could not be removed safely.",
    );
    setIsBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setDismissed(true);
    onChange();
  }

  return (
    <section aria-label={review.state === "LINKED" ? "Linked transfer" : "Possible transfer match"} className="mt-4 rounded-2xl border border-border bg-surface-mint p-4">
      <h3 className="font-bold text-foreground">
        {review.state === "LINKED" ? "Linked transfer" : "Possible transfer match"}
      </h3>
      <p className="mt-1 text-sm leading-6 text-muted">
        {review.state === "LINKED"
          ? "These records describe one movement between accounts."
          : "The amounts are exact opposites and the dates are close. Confirm only if both accounts are yours."}
      </p>
      <dl className="mt-3 grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl bg-surface-base p-3">
          <dt className="text-xs font-bold text-muted">Outgoing transfer</dt>
          <dd className="mt-1 font-semibold text-foreground">{dateLabel(review.outgoing.date)} · {formatAudFromCents(review.outgoing.amountCents)}</dd>
        </div>
        <div className="rounded-xl bg-surface-base p-3">
          <dt className="text-xs font-bold text-muted">Incoming transfer</dt>
          <dd className="mt-1 font-semibold text-foreground">{dateLabel(review.incoming.date)} · {formatAudFromCents(review.incoming.amountCents)}</dd>
        </div>
      </dl>
      <p className="mt-3 text-xs leading-5 text-muted">
        Linking does not change either amount or create another transaction. Transfers remain outside income, spending and budgets.
      </p>
      {error && <p role="alert" className="mt-3 rounded-xl bg-danger-red/10 p-3 text-sm font-semibold text-danger-red">{error}</p>}
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        {review.state === "SUGGESTION" ? (
          <>
            <button type="button" disabled={isBusy} onClick={() => setDismissed(true)} className="min-h-11 rounded-xl px-4 text-sm font-bold text-foreground">Not a match</button>
            <button type="button" disabled={isBusy} onClick={linkTransfers} className="min-h-11 rounded-xl bg-brand-evergreen px-4 text-sm font-bold text-white disabled:opacity-45">{isBusy ? "Linking…" : "Link transfers"}</button>
          </>
        ) : (
          <button type="button" disabled={isBusy} onClick={unlinkTransfers} className="min-h-11 rounded-xl border border-border px-4 text-sm font-bold text-brand-evergreen disabled:opacity-45">{isBusy ? "Unlinking…" : "Unlink transfer"}</button>
        )}
      </div>
    </section>
  );
}
