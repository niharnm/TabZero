import type { ReactNode } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";

type Section = {
  title: string;
  body: ReactNode;
};

export function LegalPage({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: ReactNode;
  sections: Section[];
}) {
  return (
    <main>
      <Header />
      <section className="mx-auto max-w-3xl px-5 py-12">
        <Link
          href="/"
          className="text-sm text-muted-foreground transition hover:text-foreground"
        >
          Back to TabZero
        </Link>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-gradient">
          {title}
        </h1>
        <div className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
          {intro}
        </div>
        <div className="mt-8 space-y-6">
          {sections.map((section) => (
            <section key={section.title} className="glass p-5">
              <h2 className="text-lg font-semibold tracking-tight">
                {section.title}
              </h2>
              <div className="mt-3 space-y-3 text-sm leading-7 text-muted-foreground">
                {section.body}
              </div>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}
