import { type NextRequest, NextResponse } from "next/server";
import { predict } from "@/lib/flights/prediction";
import { daysFromToday } from "@/lib/utils/dates";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "missing_or_invalid_date" }, { status: 400 });
  }
  return NextResponse.json(predict({ daysToDeparture: daysFromToday(date) }));
}
