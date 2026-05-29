import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { SlipData } from "@/lib/booking/confirmation";
import { hhmm, formatDuration } from "@/lib/utils/dates";
import { formatUSD } from "@/lib/utils/money";

function longDate(iso: string, naive = false): string {
  const d = new Date(naive ? iso + "Z" : iso);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

const styles = StyleSheet.create({
  page: { paddingVertical: 0, fontSize: 10, color: "#0F172A", fontFamily: "Helvetica" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#0EA5E9",
    color: "#FFFFFF",
    paddingHorizontal: 32,
    paddingVertical: 22,
  },
  brand: { fontSize: 22, fontFamily: "Helvetica-Bold" },
  kicker: { fontSize: 8, letterSpacing: 2, marginTop: 4, color: "#E0F2FE" },
  headRight: { textAlign: "right" },
  badge: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  refLabel: { fontSize: 7, color: "#E0F2FE", marginTop: 8, textTransform: "uppercase" },
  ref: { fontSize: 15, fontFamily: "Helvetica-Bold" },
  body: { paddingHorizontal: 32, paddingTop: 22 },
  routeRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  route: { fontSize: 18, fontFamily: "Helvetica-Bold" },
  pill: {
    fontSize: 8,
    color: "#0369A1",
    backgroundColor: "#EEF4FA",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 6,
  },
  summaryRow: { flexDirection: "row", marginTop: 8 },
  summaryCell: { flex: 1 },
  label: { color: "#64748B", fontSize: 7, textTransform: "uppercase" },
  value: { fontSize: 10, marginTop: 2, fontFamily: "Helvetica-Bold" },
  sectionTitle: {
    fontSize: 8,
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 20,
    marginBottom: 6,
    fontFamily: "Helvetica-Bold",
  },
  segment: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 6,
    padding: 10,
    marginBottom: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  segMain: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  segSub: { color: "#64748B", marginTop: 3, fontSize: 8.5 },
  segRight: { textAlign: "right", fontSize: 8.5 },
  lower: { flexDirection: "row", marginTop: 20 },
  payCol: { flex: 1.4, paddingRight: 18 },
  qrCol: { flex: 1, alignItems: "center", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 6, padding: 10 },
  payLine: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  payLabel: { color: "#64748B" },
  totalLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1.5,
    borderTopColor: "#0F172A",
    marginTop: 4,
    paddingTop: 5,
  },
  total: { fontSize: 13, fontFamily: "Helvetica-Bold", color: "#0369A1" },
  paid: {
    marginTop: 10,
    backgroundColor: "#ECFDF5",
    color: "#047857",
    textAlign: "center",
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    paddingVertical: 6,
    borderRadius: 6,
  },
  qr: { width: 84, height: 84 },
  qrRef: { fontSize: 9, fontFamily: "Helvetica-Bold", marginTop: 4 },
  qrNote: { fontSize: 7, color: "#64748B", marginTop: 2, textAlign: "center" },
  fine: { marginTop: 22, fontSize: 7, color: "#94A3B8", lineHeight: 1.5, paddingBottom: 24 },
});

export interface TicketProps {
  slip: SlipData;
  qrDataUrl: string;
}

export function TicketDocument({ slip, qrDataUrl }: TicketProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>TRAVU</Text>
            <Text style={styles.kicker}>BOOKING CONFIRMATION</Text>
          </View>
          <View style={styles.headRight}>
            <Text style={styles.badge}>{slip.status}</Text>
            <Text style={styles.refLabel}>Itinerary no.</Text>
            <Text style={styles.ref}>{slip.bookingRef}</Text>
            <Text style={styles.refLabel}>Issued {longDate(slip.issuedIso)}</Text>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.routeRow}>
            <Text style={styles.route}>
              {slip.routeFromCity} → {slip.routeToCity}
            </Text>
            <Text style={styles.pill}>{slip.tripType}</Text>
            <Text style={styles.pill}>
              {slip.cabin} · {slip.fareName}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryCell}>
              <Text style={styles.label}>Traveller(s)</Text>
              <Text style={styles.value}>
                {slip.passengers.map((n) => n.toUpperCase()).join(", ")}
              </Text>
            </View>
            <View style={styles.summaryCell}>
              <Text style={styles.label}>Departure</Text>
              <Text style={styles.value}>
                {longDate(slip.segments[0]?.departIso ?? slip.issuedIso, true)}
              </Text>
            </View>
            <View style={styles.summaryCell}>
              <Text style={styles.label}>Booking reference</Text>
              <Text style={styles.value}>{slip.bookingRef}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Flight details</Text>
          {slip.segments.map((s, i) => (
            <View key={i} style={styles.segment}>
              <View>
                <Text style={styles.segMain}>
                  {s.fromCity} ({s.fromIata}) → {s.toCity} ({s.toIata})
                </Text>
                <Text style={styles.segSub}>
                  Depart {hhmm(s.departIso)} · {longDate(s.departIso, true)}
                </Text>
                <Text style={styles.segSub}>
                  Arrive {hhmm(s.arriveIso)} · {longDate(s.arriveIso, true)}
                </Text>
              </View>
              <View style={styles.segRight}>
                <Text style={{ fontFamily: "Helvetica-Bold" }}>
                  {s.airlineName} {s.airlineIata}
                  {s.flightNo}
                </Text>
                <Text style={{ color: "#64748B", marginTop: 3 }}>
                  {formatDuration(s.durationMin)}
                </Text>
                <Text style={{ color: "#64748B", marginTop: 2 }}>{slip.cabin} class</Text>
              </View>
            </View>
          ))}

          <View style={styles.lower}>
            <View style={styles.payCol}>
              <Text style={styles.sectionTitle}>Payment summary</Text>
              <View style={styles.payLine}>
                <Text style={styles.payLabel}>Air fare</Text>
                <Text>{formatUSD(slip.breakdown.airFare)}</Text>
              </View>
              <View style={styles.payLine}>
                <Text style={styles.payLabel}>TRAVU booking fee</Text>
                <Text>{formatUSD(slip.breakdown.bookingFee)}</Text>
              </View>
              <View style={styles.payLine}>
                <Text style={styles.payLabel}>Taxes &amp; fees</Text>
                <Text>{formatUSD(slip.breakdown.taxesFees)}</Text>
              </View>
              <View style={styles.totalLine}>
                <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 12 }}>Total paid</Text>
                <Text style={styles.total}>{formatUSD(slip.breakdown.total)}</Text>
              </View>
              <Text style={styles.paid}>PAID VIA {slip.paymentLabel}</Text>
            </View>
            <View style={styles.qrCol}>
              {/* react-pdf Image is not an <img>; alt-text rule does not apply */}
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image style={styles.qr} src={qrDataUrl} />
              <Text style={styles.qrRef}>{slip.bookingRef}</Text>
              <Text style={styles.qrNote}>Present this slip and a valid passport at check-in</Text>
            </View>
          </View>

          <Text style={styles.fine}>
            This confirmation slip is a simulated receipt generated by TRAVU for demonstration
            purposes only and is not valid for travel. Carriage is subject to the conditions of
            contract and tariffs of the operating carrier. Please arrive at the airport at least 3
            hours before international departure with a valid passport and any required visas. Card
            details are stored only as a masked summary; the full card number, expiry and security
            code are never retained. TRAVU booking reference {slip.bookingRef}.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
