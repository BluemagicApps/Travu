import type { Metadata } from "next";
import { LegalLayout, Section, Bullets } from "@/components/content/LegalLayout";

export const metadata: Metadata = {
  title: "Newsroom · Travu",
  description: "Travu news, product announcements, brand assets, and media contacts.",
};

export default function NewsroomPage() {
  return (
    <LegalLayout
      title="Newsroom"
      intro="Announcements, product milestones, and resources for journalists and partners covering Travu."
    >
      <Section heading="Latest updates">
        <Bullets
          items={[
            <>
              <strong>Cars vertical launches</strong> — real-time rental inventory and an all-in-one
              flights, stays, and cars booking flow.
            </>,
            <>
              <strong>OneToken rewards</strong> — a simple loyalty program that earns cashable value on
              every trip and auto-upgrades members as they travel.
            </>,
            <>
              <strong>Ask AI everywhere</strong> — natural-language search across flights, stays, and cars.
            </>,
          ]}
        />
      </Section>

      <Section heading="Brand &amp; media assets">
        <p>
          For logos, screenshots, executive bios, and fact sheets, contact our press team — we&apos;re happy
          to help with story details, data, and interviews.
        </p>
      </Section>

      <Section heading="Media contact">
        <p>
          Email{" "}
          <a href="mailto:press@travunow.com" className="text-price hover:underline">
            press@travunow.com
          </a>{" "}
          and we&apos;ll respond promptly. Please include your outlet, deadline, and what you need.
        </p>
      </Section>
    </LegalLayout>
  );
}
