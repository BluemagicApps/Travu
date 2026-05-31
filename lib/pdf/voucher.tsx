import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { formatMoney } from "@/lib/utils/currency";
import type { Stay } from "@/lib/stays/types";

export interface VoucherInput {
  stay: Stay;
  rooms: number;
  totalAmount: number; // cents
  guests: number;
  bookingRef: string;
}
export interface VoucherSummary {
  title: string;
  stayLine: string;
  datesLine: string;
  total: string;
  bookingRef: string;
}

export function voucherSummary(input: VoucherInput): VoucherSummary {
  const { stay, rooms, totalAmount, guests, bookingRef } = input;
  return {
    title: `${stay.name} — ${stay.city}`,
    stayLine: `${stay.nights} night${stay.nights === 1 ? "" : "s"} · ${rooms} room${rooms === 1 ? "" : "s"} · ${guests} guest${guests === 1 ? "" : "s"}`,
    datesLine: `${stay.checkIn} → ${stay.checkOut}`,
    total: formatMoney(totalAmount, stay.currency),
    bookingRef,
  };
}

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 11, fontFamily: "Helvetica", color: "#0F172A" },
  h1: { fontSize: 18, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  muted: { color: "#64748B", marginBottom: 16 },
  card: { borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 8, padding: 16 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  total: { fontSize: 16, fontFamily: "Helvetica-Bold", marginTop: 16 },
});

export function StayVoucher({ input }: { input: VoucherInput }) {
  const s = voucherSummary(input);
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>TRAVU Stay Voucher</Text>
        <Text style={styles.muted}>Booking {s.bookingRef}</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text>{s.title}</Text>
          </View>
          <View style={styles.row}>
            <Text>{s.stayLine}</Text>
          </View>
          <View style={styles.row}>
            <Text>{s.datesLine}</Text>
            <Text>{input.stay.roomName}</Text>
          </View>
          <View style={styles.row}>
            <Text>{input.stay.refundable ? "Refundable" : "Non-refundable"}</Text>
            <Text>{input.stay.cancellationPolicy}</Text>
          </View>
        </View>
        <Text style={styles.total}>Total paid: {s.total}</Text>
      </Page>
    </Document>
  );
}
