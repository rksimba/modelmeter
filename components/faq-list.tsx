import type { FaqItem } from "@/lib/faq";

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
            <p className="mt-2 text-sm leading-6 text-muted">{item.answer}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
