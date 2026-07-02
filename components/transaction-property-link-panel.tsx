"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Landmark, Link2, Unlink } from "lucide-react";

type PropertyOption = {
  id: string;
  nickname: string;
  usage: "OWNER_OCCUPIED" | "INVESTMENT" | "OTHER";
  isArchived: boolean;
};

type PropertyLinkSnapshot = {
  properties: PropertyOption[];
  link: { id: string; property: PropertyOption } | null;
};

type SnapshotResponse =
  | { ok: true; snapshot: PropertyLinkSnapshot }
  | { ok: false; error: string };

const usageLabels: Record<PropertyOption["usage"], string> = {
  OWNER_OCCUPIED: "Owner-occupied",
  INVESTMENT: "Investment",
  OTHER: "Other",
};

async function readSnapshotResponse(response: Response): Promise<SnapshotResponse> {
  try {
    const payload = await response.json() as SnapshotResponse;
    if (payload.ok) return payload;
    return { ok: false, error: payload.error || "The Property link could not be loaded safely." };
  } catch {
    return { ok: false, error: "The Property link could not be loaded safely." };
  }
}

export function TransactionPropertyLinkPanel({ transactionId }: Readonly<{ transactionId: string }>) {
  const [snapshot, setSnapshot] = useState<PropertyLinkSnapshot | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmingUnlink, setConfirmingUnlink] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setIsLoading(true);
      setError("");
      try {
        const result = await readSnapshotResponse(await fetch(
          `/api/account/manual-transactions/${encodeURIComponent(transactionId)}/property-link`,
          { method: "GET", cache: "no-store", signal: controller.signal },
        ));
        if (controller.signal.aborted) return;
        if (!result.ok) {
          setError(result.error);
          setSnapshot(null);
        } else {
          setSnapshot(result.snapshot);
          setSelectedPropertyId(result.snapshot.properties[0]?.id ?? "");
        }
      } catch {
        if (!controller.signal.aborted) {
          setError("The Property link could not be loaded safely.");
          setSnapshot(null);
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [transactionId]);

  async function linkProperty() {
    if (!selectedPropertyId || isSaving) return;
    setIsSaving(true);
    setError("");
    try {
      const result = await readSnapshotResponse(await fetch(
        `/api/account/manual-transactions/${encodeURIComponent(transactionId)}/property-link`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ propertyId: selectedPropertyId }),
        },
      ));
      if (!result.ok) setError(result.error);
      else {
        setSnapshot(result.snapshot);
        setConfirmingUnlink(false);
      }
    } catch {
      setError("The Property link could not be updated safely.");
    } finally {
      setIsSaving(false);
    }
  }

  async function unlinkProperty() {
    if (!snapshot?.link || isSaving) return;
    setIsSaving(true);
    setError("");
    try {
      const response = await fetch(
        `/api/account/manual-transactions/${encodeURIComponent(transactionId)}/property-link`,
        { method: "DELETE" },
      );
      const result = await response.json() as { ok: boolean; error?: string };
      if (!response.ok || !result.ok) setError(result.error ?? "The Property link could not be updated safely.");
      else {
        setSnapshot({ ...snapshot, link: null });
        setConfirmingUnlink(false);
      }
    } catch {
      setError("The Property link could not be updated safely.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="mt-5 rounded-3xl border border-border p-4" aria-labelledby="property-record-keeping-heading">
      <div className="flex items-start gap-3">
        <Landmark aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-brand-teal" />
        <div>
          <h3 id="property-record-keeping-heading" className="font-bold text-brand-deepTeal">Property record keeping</h3>
          <p className="mt-1 text-sm leading-5 text-brand-deepTeal/65">Optional supporting metadata. Linking does not change this transaction or create another payment.</p>
        </div>
      </div>

      {isLoading && <p className="mt-4 text-sm font-semibold text-brand-deepTeal/65">Loading Properties…</p>}
      {error && <p role="alert" className="mt-4 rounded-2xl bg-danger-red/10 p-3 text-sm font-semibold text-danger-red">{error}</p>}

      {!isLoading && snapshot?.link && (
        <div className="mt-4 rounded-2xl bg-surface-mint p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-bold text-brand-deepTeal">{snapshot.link.property.nickname}</p>
              <p className="mt-1 text-sm text-brand-deepTeal/65">{usageLabels[snapshot.link.property.usage]}{snapshot.link.property.isArchived ? " · Archived Property" : ""}</p>
            </div>
            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-brand-teal">Linked manually</span>
          </div>

          {!confirmingUnlink ? (
            <button type="button" disabled={isSaving} onClick={() => setConfirmingUnlink(true)} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-danger-red px-4 text-sm font-bold text-danger-red focus:outline-none focus:ring-2 focus:ring-danger-red">
              <Unlink aria-hidden="true" className="h-4 w-4" /> Unlink Property
            </button>
          ) : (
            <div className="mt-4 rounded-2xl border border-warning-amber bg-warning-amber/10 p-3">
              <p className="text-sm font-semibold text-brand-deepTeal">Unlink this transaction? The transaction and Property will remain unchanged.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" disabled={isSaving} onClick={() => setConfirmingUnlink(false)} className="min-h-10 rounded-full border border-brand-teal px-4 text-sm font-bold text-brand-deepTeal">Keep link</button>
                <button type="button" disabled={isSaving} onClick={unlinkProperty} className="min-h-10 rounded-full bg-danger-red px-4 text-sm font-bold text-white">{isSaving ? "Unlinking…" : "Confirm unlink"}</button>
              </div>
            </div>
          )}
        </div>
      )}

      {!isLoading && snapshot && !snapshot.link && snapshot.properties.length > 0 && (
        <div className="mt-4 space-y-3">
          <label className="block text-sm font-bold text-brand-deepTeal" htmlFor={`property-link-${transactionId}`}>
            Choose an active Property
            <select id={`property-link-${transactionId}`} value={selectedPropertyId} onChange={(event) => setSelectedPropertyId(event.target.value)} className="mt-2 min-h-12 w-full rounded-2xl border border-border bg-white px-4 font-normal text-brand-deepTeal focus:outline-none focus:ring-2 focus:ring-brand-green">
              {snapshot.properties.map((property) => <option key={property.id} value={property.id}>{property.nickname} · {usageLabels[property.usage]}</option>)}
            </select>
          </label>
          <button type="button" disabled={!selectedPropertyId || isSaving} onClick={linkProperty} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-deepTeal px-4 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-brand-green">
            <Link2 aria-hidden="true" className="h-4 w-4" /> {isSaving ? "Linking…" : "Link transaction to Property"}
          </button>
        </div>
      )}

      {!isLoading && snapshot && !snapshot.link && snapshot.properties.length === 0 && (
        <div className="mt-4 rounded-2xl bg-surface-mint p-4">
          <p className="text-sm font-semibold text-brand-deepTeal">No active Properties are available.</p>
          <Link href="/loans" className="mt-3 inline-flex min-h-10 items-center rounded-full border border-brand-teal px-4 text-sm font-bold text-brand-deepTeal">Manage Properties in Loans</Link>
        </div>
      )}
    </section>
  );
}
