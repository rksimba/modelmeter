import type { ReactNode } from "react";
import type { FaqItem } from "@/lib/faq";

function AnswerText({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  const pattern = /https?:\/\/[^\s]+/g;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const raw = match[0];
    const url = raw.replace(/[.,;:)]+$/, "");
    const trailing = raw.slice(url.length);
    const index = match.index ?? 0;
    if (index > last) parts.push(text.slice(last, index));
    parts.push(
      <a key={index} href={url} className="text-accent underline">
        {url}
      </a>,
    );
    if (trailing) parts.push(trailing);
    last = index + raw.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <p className="mt-2 text-sm leading-6 text-muted">{parts}</p>;
}

export function FaqList({ items }: { items: FaqItem[] }) {
  return (
    <section aria-labelledby="faq-heading">
      <h2 id="faq-heading" className="text-lg font-medium">
        Questions
      </h2>
      <div className="mt-4 divide-y divide-line border-y border-line">
        {items.map((item) => (
          <div key={item.question} className="py-5">
            <h3 className="text-base font-medium text-ink">{item.question}</h3>
            <AnswerText text={item.answer} />
          </div>
        ))}
      </div>
    </section>
  );
}
