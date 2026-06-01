import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { formatMoney } from "@/lib/utils/currency";
import type { Stay } from "@/lib/stays/types";

function longDate(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

export interface VoucherInput {
  stay: Stay;
  rooms: number;
  guests: number;
  nights: number;
  leadGuest?: string;
  contactEmail?: string;
  contactPhone?: string;
  protectionPlan?: string;
  protectionAmount?: number;
  roomSubtotal: number;
  taxes: number;
  fees: number;
  totalAmount: number; // cents
  currency: string;
  status: string;
  issuedIso: string;
  bookingRef: string;
  cancellationTier?: string;
}

const styles = StyleSheet.create({
  page: { paddingVertical: 0, fontSize: 10, color: "#0F172A", fontFamily: "Helvetica" },
  header: { flexDirection: "row", justifyContent: "space-between", backgroundColor: "#0EA5E9", color: "#FFFFFF", paddingHorizontal: 32, paddingVertical: 22 },
  brand: { fontSize: 22, fontFamily: "Helvetica-Bold" },
  kicker: { fontSize: 8, letterSpacing: 2, marginTop: 4, color: "#E0F2FE" },
  headRight: { textAlign: "right" },
  badge: { fontSize: 8, fontFamily: "Helvetica-Bold", backgroundColor: "rgba(255,255,255,0.25)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  refLabel: { fontSize: 7, color: "#E0F2FE", marginTop: 8, textTransform: "uppercase" },
  ref: { fontSize: 15, fontFamily: "Helvetica-Bold" },
  body: { paddingHorizontal: 32, paddingTop: 22 },
  propRow: { flexDirection: "row", marginBottom: 6 },
  photo: { width: 150, height: 100, borderRadius: 6, marginRight: 14, objectFit: "cover" },
  propName: { fontSize: 16, fontFamily: "Helvetica-Bold" },
  propSub: { color: "#64748B", marginTop: 3, fontSize: 9 },
  pill: { fontSize: 8, color: "#0369A1", backgroundColor: "#EEF4FA", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, marginTop: 6, alignSelf: "flex-start" },
  sectionTitle: { fontSize: 8, color: "#64748B", textTransform: "uppercase", letterSpacing: 1, marginTop: 20, marginBottom: 6, fontFamily: "Helvetica-Bold" },
  summaryRow: { flexDirection: "row", marginTop: 4 },
  summaryCell: { flex: 1 },
  label: { color: "#64748B", fontSize: 7, textTransform: "uppercase" },
  value: { fontSize: 10, marginTop: 2, fontFamily: "Helvetica-Bold" },
  lower: { flexDirection: "row", marginTop: 20 },
  payCol: { flex: 1.4, paddingRight: 18 },
  qrCol: { flex: 1, alignItems: "center", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 6, padding: 10 },
  payLine: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  payLabel: { color: "#64748B" },
  totalLine: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1.5, borderTopColor: "#0F172A", marginTop: 4, paddingTop: 5 },
  total: { fontSize: 13, fontFamily: "Helvetica-Bold", color: "#0369A1" },
  paid: { marginTop: 10, backgroundColor: "#ECFDF5", color: "#047857", textAlign: "center", fontSize: 9, fontFamily: "Helvetica-Bold", paddingVertical: 6, borderRadius: 6 },
  qr: { width: 84, height: 84 },
  qrRef: { fontSize: 9, fontFamily: "Helvetica-Bold", marginTop: 4 },
  qrNote: { fontSize: 7, color: "#64748B", marginTop: 2, textAlign: "center" },
  fine: { marginTop: 22, fontSize: 7, color: "#94A3B8", lineHeight: 1.5, paddingBottom: 24 },
});

export interface VoucherProps {
  input: VoucherInput;
  qrDataUrl: string;
}

export function StayVoucher({ input: i, qrDataUrl }: VoucherProps) {
  const fm = (c: number) => formatMoney(c, i.currency);
  const stay = i.stay;
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>TRAVU</Text>
            <Text style={styles.kicker}>STAY CONFIRMATION VOUCHER</Text>
          </View>
          <View style={styles.headRight}>
            <Text style={styles.badge}>{i.status}</Text>
            <Text style={styles.refLabel}>Confirmation no.</Text>
            <Text style={styles.ref}>{i.bookingRef}</Text>
            <Text style={styles.refLabel}>Issued {longDate(i.issuedIso.slice(0, 10))}</Text>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.propRow}>
            {stay.images[0] && (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image style={styles.photo} src={stay.images[0]} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.propName}>{stay.name}</Text>
              <Text style={styles.propSub}>{stay.area ? `${stay.area}, ` : ""}{stay.city}</Text>
              <Text style={styles.propSub}>{stay.roomName} · {stay.boardType.replace(/_/g, " ").toLowerCase()}</Text>
              <Text style={styles.pill}>{stay.refundable ? "Refundable" : "Non-refundable"}{i.cancellationTier ? ` · ${i.cancellationTier}` : ""}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Reservation</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCell}>
              <Text style={styles.label}>Check-in</Text>
              <Text style={styles.value}>{longDate(stay.checkIn)}</Text>
              <Text style={styles.propSub}>After {stay.policies?.checkIn ?? "3:00 PM"}</Text>
            </View>
            <View style={styles.summaryCell}>
              <Text style={styles.label}>Check-out</Text>
              <Text style={styles.value}>{longDate(stay.checkOut)}</Text>
              <Text style={styles.propSub}>Before {stay.policies?.checkOut ?? "11:00 AM"}</Text>
            </View>
            <View style={styles.summaryCell}>
              <Text style={styles.label}>Stay</Text>
              <Text style={styles.value}>{i.nights} night{i.nights === 1 ? "" : "s"} · {i.rooms} room{i.rooms === 1 ? "" : "s"}</Text>
              <Text style={styles.propSub}>{i.guests} guest{i.guests === 1 ? "" : "s"}</Text>
            </View>
          </View>

          <View style={[styles.summaryRow, { marginTop: 10 }]}>
            <View style={styles.summaryCell}>
              <Text style={styles.label}>Lead guest</Text>
              <Text style={styles.value}>{i.leadGuest ?? "Guest"}</Text>
            </View>
            <View style={styles.summaryCell}>
              <Text style={styles.label}>Contact</Text>
              <Text style={styles.value}>{i.contactEmail ?? "—"}</Text>
              {i.contactPhone ? <Text style={styles.propSub}>{i.contactPhone}</Text> : null}
            </View>
            <View style={styles.summaryCell}>
              <Text style={styles.label}>Protection</Text>
              <Text style={styles.value}>{i.protectionPlan === "TRAVU_PROTECT" ? "Travu Protect" : "None"}</Text>
            </View>
          </View>

          <View style={styles.lower}>
            <View style={styles.payCol}>
              <Text style={styles.sectionTitle}>Payment summary</Text>
              <View style={styles.payLine}>
                <Text style={styles.payLabel}>{i.nights} night{i.nights === 1 ? "" : "s"} × {i.rooms} room{i.rooms === 1 ? "" : "s"}</Text>
                <Text>{fm(i.roomSubtotal)}</Text>
              </View>
              <View style={styles.payLine}>
                <Text style={styles.payLabel}>Taxes</Text>
                <Text>{fm(i.taxes)}</Text>
              </View>
              <View style={styles.payLine}>
                <Text style={styles.payLabel}>Service fee</Text>
                <Text>{fm(i.fees)}</Text>
              </View>
              {i.protectionAmount ? (
                <View style={styles.payLine}>
                  <Text style={styles.payLabel}>Travu Protect</Text>
                  <Text>{fm(i.protectionAmount)}</Text>
                </View>
              ) : null}
              <View style={styles.totalLine}>
                <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 12 }}>Total paid</Text>
                <Text style={styles.total}>{fm(i.totalAmount)}</Text>
              </View>
              <Text style={styles.paid}>PAID · SIMULATED</Text>
            </View>
            <View style={styles.qrCol}>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image style={styles.qr} src={qrDataUrl} />
              <Text style={styles.qrRef}>{i.bookingRef}</Text>
              <Text style={styles.qrNote}>Present this voucher at check-in</Text>
            </View>
          </View>

          <Text style={styles.fine}>
            This confirmation voucher is a simulated receipt generated by TRAVU for demonstration
            purposes only and is not valid for an actual stay. Your reservation is subject to the
            property&apos;s terms and the cancellation policy shown above. Please present this voucher
            and a valid photo ID at check-in. Card details are stored only as a masked summary; the
            full card number, expiry and security code are never retained. TRAVU confirmation
            reference {i.bookingRef}.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
