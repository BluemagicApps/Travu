import { redirect } from "next/navigation";
import Link from "next/link";
import { PlaneTakeoff } from "lucide-react";
import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/dashboard");

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-extrabold">Your trips</h1>
      <p className="mt-1 text-sm text-muted">
        Signed in as {session.user.email}
      </p>

      <div className="glass mt-6 rounded-2xl p-10 text-center text-muted">
        <PlaneTakeoff className="mx-auto h-8 w-8 text-price" />
        <p className="mt-3">No bookings yet.</p>
        <Link href="/" className="btn-accent mt-4 inline-block rounded-xl px-5 py-2.5 text-sm font-semibold">
          Search flights
        </Link>
      </div>
    </div>
  );
}
