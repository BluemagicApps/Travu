import { notFound } from "next/navigation";
import Link from "next/link";
import { Star, ChevronLeft, BedDouble, Bath, Maximize, Users, Share2, Heart, ShieldCheck, BadgeCheck } from "lucide-react";
import { resolveStay } from "@/lib/stays/resolve";
import { generateStays } from "@/lib/stays/mock/generator";
import { decodeStayId } from "@/lib/stays/offer-id";
import { ratingWordFor } from "@/lib/stays/rating";
import { highlightsHeading, propertyTypeLabel } from "@/lib/stays/detail";
import type { Stay, StayPhoto } from "@/lib/stays/types";
import { PhotoGallery } from "@/components/stays/detail/PhotoGallery";
import { StickySubNav } from "@/components/stays/detail/StickySubNav";
import { BookingBox } from "@/components/stays/detail/BookingBox";
import { StickyReserveBar } from "@/components/stays/detail/StickyReserveBar";
import { MapView } from "@/components/stays/detail/MapView";
import { ReviewsSection } from "@/components/stays/detail/ReviewsSection";
import { FaqAccordion } from "@/components/stays/detail/FaqAccordion";
import { SimilarProperties } from "@/components/stays/detail/SimilarProperties";
import {
  AmenitiesGrid,
  AboutProperty,
  NearbyList,
  PoliciesSection,
  ThingsToDoNearby,
} from "@/components/stays/detail/DetailSections";
import { StaysFooter } from "@/components/stays/landing/StaysFooter";

function similarStays(stay: Stay): Stay[] {
  const decoded = decodeStayId(stay.id);
  if (!decoded) return [];
  return generateStays({
    destination: decoded.destination,
    checkIn: decoded.checkIn,
    checkOut: decoded.checkOut,
    adults: 2,
    rooms: decoded.rooms,
  })
    .filter((s) => s.id !== stay.id)
    .slice(0, 6);
}

export default async function StayDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const stay = await resolveStay(decodeURIComponent(id));
  if (!stay) notFound();

  const photos: StayPhoto[] = stay.photos ?? stay.images.map((url) => ({ url }));
  const similar = similarStays(stay);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {/* Header row */}
      <div className="mb-3 flex items-center justify-between">
        <Link href="/stays" className="flex items-center gap-1 text-sm font-medium text-price hover:underline">
          <ChevronLeft className="h-4 w-4" /> See all properties
        </Link>
        <div className="flex items-center gap-3 text-sm text-muted">
          <button type="button" className="flex items-center gap-1 hover:text-text"><Share2 className="h-4 w-4" /> Share</button>
          <button type="button" className="flex items-center gap-1 hover:text-text"><Heart className="h-4 w-4" /> Save</button>
        </div>
      </div>

      <PhotoGallery photos={photos} name={stay.name} />

      <StickySubNav />

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          {/* Title block */}
          <p className="text-sm font-medium text-price">{propertyTypeLabel(stay)}</p>
          <h1 className="mt-1 text-2xl font-extrabold">{stay.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
            <span className="flex items-center gap-0.5">
              {Array.from({ length: stay.starRating }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              ))}
            </span>
            <span>·</span>
            <span>{stay.area ? `${stay.area}, ` : ""}{stay.city}</span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            {stay.refundable ? (
              <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5" /> Free cancellation
              </span>
            ) : (
              <span className="rounded-full bg-rose-50 px-2 py-1 font-medium text-rose-600 dark:bg-rose-950/40">Non-refundable</span>
            )}
            <span className="flex items-center gap-1 rounded-full bg-surface-2 px-2 py-1 text-muted">
              <BadgeCheck className="h-3.5 w-3.5 text-price" /> Your dates are available
            </span>
          </div>

          {/* Key facts */}
          <div className="mt-4 flex flex-wrap gap-4 border-y border-border py-3 text-sm">
            {stay.bedrooms != null && <span className="flex items-center gap-1.5"><BedDouble className="h-4 w-4 text-price" /> {stay.bedrooms} bedroom{stay.bedrooms === 1 ? "" : "s"}</span>}
            {stay.bathrooms != null && <span className="flex items-center gap-1.5"><Bath className="h-4 w-4 text-price" /> {stay.bathrooms} bathroom{stay.bathrooms === 1 ? "" : "s"}</span>}
            {stay.sleeps != null && <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-price" /> Sleeps {stay.sleeps}</span>}
            {stay.sqft != null && <span className="flex items-center gap-1.5"><Maximize className="h-4 w-4 text-price" /> {stay.sqft} sq ft</span>}
          </div>

          <div className="mt-4">
            <h2 className="font-semibold">{highlightsHeading(stay.nights)}</h2>
            <div className="mt-2 flex items-center gap-2 text-sm text-muted">
              <span className="rounded-lg bg-price px-2 py-1 text-sm font-bold text-white">{stay.guestRating.toFixed(1)}</span>
              <span className="font-semibold text-price">{ratingWordFor(stay.guestRating)}</span>
              <span>· {stay.reviewCount} reviews</span>
            </div>
          </div>

          <AmenitiesGrid groups={stay.amenityGroups ?? []} />

          {/* Explore the area */}
          <section id="area" className="scroll-mt-28 border-t border-border py-6">
            <h2 className="text-lg font-bold">Explore the area</h2>
            <div className="mt-3">
              <MapView lat={stay.lat} lng={stay.lng} name={stay.name} />
            </div>
            <NearbyList landmarks={stay.nearbyLandmarks ?? []} />
          </section>

          <AboutProperty name={stay.name} description={stay.description} hostName={stay.hostName} hostType={stay.hostType} />

          <PoliciesSection policies={stay.policies} />

          <ReviewsSection
            rating={stay.guestRating}
            reviewCount={stay.reviewCount}
            breakdown={stay.reviewBreakdown}
            reviews={stay.reviews}
          />

          <ThingsToDoNearby items={stay.thingsToDo ?? []} />

          <FaqAccordion faqs={stay.faqs ?? []} />

          <SimilarProperties stays={similar} />
        </div>

        <BookingBox stay={stay} />
      </div>

      <StaysFooter />

      {/* Always-reachable Reserve on small screens (side box collapses to page end) */}
      <StickyReserveBar stay={stay} />
      {/* spacer so the sticky bar never hides the footer on mobile */}
      <div className="h-20 lg:hidden" />
    </div>
  );
}
