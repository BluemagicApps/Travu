import type { Metadata } from "next";
import { LegalLayout, Section, Bullets } from "@/components/content/LegalLayout";

export const metadata: Metadata = {
  title: "Accessibility · Travu",
  description: "Travu's commitment to building an accessible travel experience for everyone.",
};

export default function AccessibilityPage() {
  return (
    <LegalLayout
      title="Accessibility"
      intro="We want everyone to be able to plan and book travel on Travu, regardless of ability or the device they use."
      updated="June 5, 2026"
    >
      <Section heading="Our commitment">
        <p>
          We aim to meet the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA and treat
          accessibility as an ongoing part of how we design and build, not a one-time checklist.
        </p>
      </Section>

      <Section heading="What we do">
        <Bullets
          items={[
            "Support keyboard navigation and visible focus states.",
            "Maintain colour contrast and offer a dark mode.",
            "Use semantic markup and labels so screen readers can interpret content.",
            "Design responsive layouts that work across phones, tablets, and desktops without zooming or horizontal scrolling.",
            "Respect reduced-motion preferences for animations.",
          ]}
        />
      </Section>

      <Section heading="Known limitations">
        <p>
          Some third-party content (such as embedded maps or supplier media) may not fully meet our
          standards. We work to minimise these gaps and provide accessible alternatives where we can.
        </p>
      </Section>

      <Section heading="Give us feedback">
        <p>
          If you encounter a barrier or have a suggestion, email{" "}
          <a href="mailto:accessibility@travunow.com" className="text-price hover:underline">
            accessibility@travunow.com
          </a>
          . Please describe the page and the issue so we can reproduce and fix it quickly.
        </p>
      </Section>
    </LegalLayout>
  );
}
