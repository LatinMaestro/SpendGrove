"use client";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en-AU">
      <body>
        <main style={{ margin: "0 auto", maxWidth: 560, padding: "64px 20px", fontFamily: "system-ui, sans-serif" }}>
          <h1>SpendGrove could not load</h1>
          <p>Your information has not been shown. Please try again.</p>
          <button
            type="button"
            onClick={reset}
            style={{ minHeight: 44, padding: "0 16px", font: "inherit" }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
