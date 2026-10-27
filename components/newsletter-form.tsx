"use client";

import { useState } from "react";

type Status = "idle" | "sending" | "unconnected" | "invalid" | "error";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setMessage("");
    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body = (await response.json()) as { message?: string };
      if (response.status === 400) {
        setStatus("invalid");
        setMessage(body.message ?? "Enter a valid email address.");
        return;
      }
      setStatus("unconnected");
      setMessage(
        body.message ??
          "Signup is not connected yet. This address was not stored and no email was sent.",
      );
    } catch {
      setStatus("error");
      setMessage("The signup request did not go through. Nothing was stored.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3" noValidate>
      <label htmlFor="newsletter-email" className="text-sm font-medium">
        Email address
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="newsletter-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="h-11 w-full rounded-xl border border-line bg-paper px-3 text-sm text-ink outline-none transition-colors focus:border-accent"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className="h-11 shrink-0 rounded-full bg-ink px-5 text-sm font-medium text-paper transition-opacity hover:opacity-80 disabled:opacity-60"
        >
          {status === "sending" ? "Sending…" : "Get price updates"}
        </button>
      </div>
      <p className="text-xs text-muted">
        Delivery is not connected yet. Submitting does not store the address or send mail.
      </p>
      {message ? (
        <p
          role="status"
          className={
            status === "invalid" || status === "error" ? "text-sm text-danger" : "text-sm text-ink"
          }
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
