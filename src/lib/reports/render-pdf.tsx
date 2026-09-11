// src/lib/reports/render-pdf.tsx
// Server-only PDF renderer using @react-pdf/renderer — chosen over a
// headless-Chromium approach (puppeteer-core + @sparticuz/chromium)
// for reliability on Vercel serverless (no browser binary, no cold-
// start/size concerns) while still producing a real, professionally
// paginated PDF with headers/footers/page numbers/tables, built from
// the exact same canonical Report document the web reader renders
// (AGENTS §128 HTML/PDF parity — same data, medium-appropriate
// templates). TrueLoger branding only; no competitor branding.
import { Document, Page, Text, View, StyleSheet, Font, renderToBuffer } from "@react-pdf/renderer";
import { REPORT_PRODUCTS } from "./products";
import type { Report } from "./types";
import type { ReportBlueprint } from "./blueprints/types";

// TrueLoger report palette — deep plum / royal purple / warm ivory /
// subtle gold, matching the site's own design tokens (see
// tailwind config's nav-* colors) translated to hex for react-pdf,
// which can't consume CSS custom properties.
const COLORS = {
  plum: "#4a2f63",
  violet: "#6b3fa0",
  amethystDeep: "#7c3aed",
  amethyst: "#9d6fd6",
  gold: "#b8935f",
  ivory: "#fdfbf7",
  pearl: "#f6f1ea",
  lavenderLine: "#e4d9f0",
};

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 10.5, fontFamily: "Helvetica", color: COLORS.plum, backgroundColor: "#ffffff" },
  coverPage: { padding: 0, backgroundColor: COLORS.ivory, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" },
  coverBrand: { fontSize: 28, fontFamily: "Helvetica-Bold", color: COLORS.violet, letterSpacing: 2, marginBottom: 24 },
  coverKicker: { fontSize: 11, color: COLORS.gold, letterSpacing: 3, textTransform: "uppercase", marginBottom: 8 },
  coverTitle: { fontSize: 26, fontFamily: "Helvetica-Bold", color: COLORS.plum, textAlign: "center", marginBottom: 32 },
  coverLabel: { fontSize: 9, color: COLORS.amethyst, textTransform: "uppercase", letterSpacing: 1, marginTop: 16 },
  coverValue: { fontSize: 13, color: COLORS.plum, marginTop: 2 },
  header: { position: "absolute", top: 20, left: 48, right: 48, flexDirection: "row", justifyContent: "space-between", fontSize: 8, color: COLORS.amethyst, borderBottomWidth: 0.5, borderBottomColor: COLORS.lavenderLine, paddingBottom: 6 },
  footer: { position: "absolute", bottom: 20, left: 48, right: 48, flexDirection: "row", justifyContent: "space-between", fontSize: 8, color: COLORS.amethyst, borderTopWidth: 0.5, borderTopColor: COLORS.lavenderLine, paddingTop: 6 },
  sectionTitle: { fontSize: 16, fontFamily: "Helvetica-Bold", color: COLORS.violet, marginBottom: 10, marginTop: 4 },
  paragraph: { marginBottom: 8, lineHeight: 1.5, textAlign: "justify" },
  card: { backgroundColor: COLORS.pearl, borderRadius: 4, padding: 10, marginBottom: 10, borderLeftWidth: 2, borderLeftColor: COLORS.gold },
  cardTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", color: COLORS.violet, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  keyPoint: { fontSize: 10, marginBottom: 3 },
  tableHeaderRow: { flexDirection: "row", backgroundColor: COLORS.lavenderLine, paddingVertical: 4, paddingHorizontal: 4 },
  tableRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: COLORS.lavenderLine, paddingVertical: 4, paddingHorizontal: 4 },
  tableCellHeader: { flex: 1, fontSize: 8, fontFamily: "Helvetica-Bold", color: COLORS.plum },
  tableCell: { flex: 1, fontSize: 8.5, color: COLORS.plum },
  tocRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: COLORS.lavenderLine },
  disclaimer: { fontSize: 7.5, color: COLORS.amethyst, lineHeight: 1.4 },
});

function HeaderFooter({ title, reportId }: { title: string; reportId: string }) {
  return (
    <>
      <View style={styles.header} fixed>
        <Text>TRUELOGER</Text>
        <Text>{title}</Text>
      </View>
      <View style={styles.footer} fixed>
        <Text>TrueLoger · Personal & Confidential</Text>
        <Text>Report {reportId.slice(-8).toUpperCase()}</Text>
        <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
      </View>
    </>
  );
}

function CoverPage({ report, productName, generatedAt }: { report: Report; productName: string; generatedAt: number }) {
  const p = report.profileSnapshot;
  return (
    <Page size="A4" style={styles.coverPage}>
      <Text style={styles.coverBrand}>TRUELOGER</Text>
      <Text style={styles.coverKicker}>Personalized Vedic Astrology Report</Text>
      <Text style={styles.coverTitle}>{productName}</Text>
      <View style={{ alignItems: "center" }}>
        <Text style={styles.coverLabel}>Prepared For</Text>
        <Text style={styles.coverValue}>{p.fullName}</Text>
        <Text style={styles.coverLabel}>Birth Date</Text>
        <Text style={styles.coverValue}>{p.dob}</Text>
        <Text style={styles.coverLabel}>Birth Time</Text>
        <Text style={styles.coverValue}>{p.timeUnknown ? "Not specified" : p.timeOfBirth}</Text>
        <Text style={styles.coverLabel}>Birth Place</Text>
        <Text style={styles.coverValue}>{p.birthCity}{p.birthState ? `, ${p.birthState}` : ""}</Text>
        <Text style={styles.coverLabel}>Report ID</Text>
        <Text style={styles.coverValue}>{report.id}</Text>
        <Text style={styles.coverLabel}>Generated</Text>
        <Text style={styles.coverValue}>{new Date(generatedAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</Text>
      </View>
    </Page>
  );
}

function TableOfContentsPage({ report, blueprint, productName }: { report: Report; blueprint: ReportBlueprint; productName: string }) {
  return (
    <Page size="A4" style={styles.page}>
      <HeaderFooter title={productName} reportId={report.id} />
      <Text style={styles.sectionTitle}>Table of Contents</Text>
      <View style={styles.tocRow}>
        <Text>Basic Details</Text>
        <Text>3</Text>
      </View>
      {blueprint.sections.map((s, i) => (
        <View key={s.id} style={styles.tocRow}>
          <Text>{s.title}</Text>
          <Text>{4 + i}</Text>
        </View>
      ))}
    </Page>
  );
}

function BasicDetailsPage({ report, productName }: { report: Report; productName: string }) {
  const p = report.profileSnapshot;
  const snap = report.astrologySnapshot;
  const rows: [string, string][] = [
    ["Full Name", p.fullName],
    ["Date of Birth", p.dob],
    ["Time of Birth", p.timeUnknown ? "Not specified" : p.timeOfBirth],
    ["Birth Place", `${p.birthCity}${p.birthState ? `, ${p.birthState}` : ""}, ${p.birthCountry}`],
    ["Latitude / Longitude", `${p.birthLatitude.toFixed(4)}, ${p.birthLongitude.toFixed(4)}`],
    ["Timezone (UTC offset)", `${p.birthTimezoneHours >= 0 ? "+" : ""}${p.birthTimezoneHours}`],
  ];
  if (snap) {
    rows.push(
      ["Ascendant (Lagna)", snap.ascendant.signName],
      ["Moon Sign (Rashi)", snap.moonSign.signName],
      ["Nakshatra", `${snap.nakshatra.name}, Pada ${snap.nakshatra.pada}`],
      ["Ayanamsha (Lahiri)", `${snap.ayanamsha.toFixed(4)}°`],
    );
  }
  return (
    <Page size="A4" style={styles.page}>
      <HeaderFooter title={productName} reportId={report.id} />
      <Text style={styles.sectionTitle}>Basic Details</Text>
      {rows.map(([label, value]) => (
        <View key={label} style={styles.tableRow}>
          <Text style={styles.tableCellHeader}>{label}</Text>
          <Text style={styles.tableCell}>{value}</Text>
        </View>
      ))}
    </Page>
  );
}

function SectionPage({ section, productName, reportId }: { section: Report["sections"][number]; productName: string; reportId: string }) {
  return (
    <Page size="A4" style={styles.page} wrap>
      <HeaderFooter title={productName} reportId={reportId} />
      <Text style={styles.sectionTitle}>{section.title}</Text>

      {section.content.keyPoints && section.content.keyPoints.length > 0 && (
        <View style={styles.card} wrap={false}>
          <Text style={styles.cardTitle}>Key Insights</Text>
          {section.content.keyPoints.map((kp, i) => (
            <Text key={i} style={styles.keyPoint}>• {kp}</Text>
          ))}
        </View>
      )}

      {section.content.paragraphs.map((para, i) => (
        <Text key={i} style={styles.paragraph}>{para}</Text>
      ))}

      {section.content.table && section.content.table.rows.length > 0 && (
        <View style={{ marginTop: 6, marginBottom: 10 }} wrap={false}>
          <View style={styles.tableHeaderRow}>
            {section.content.table.headers.map((h, i) => (
              <Text key={i} style={styles.tableCellHeader}>{h}</Text>
            ))}
          </View>
          {section.content.table.rows.map((row, ri) => (
            <View key={ri} style={styles.tableRow}>
              {row.cells.map((cell, ci) => (
                <Text key={ci} style={styles.tableCell}>{cell}</Text>
              ))}
            </View>
          ))}
        </View>
      )}

      {section.content.remedies && section.content.remedies.length > 0 && (
        <View style={styles.card} wrap={false}>
          <Text style={styles.cardTitle}>Traditional Remedies</Text>
          {section.content.remedies.map((r, i) => (
            <Text key={i} style={styles.keyPoint}>• {r}</Text>
          ))}
        </View>
      )}
    </Page>
  );
}

function DisclaimerPage({ productName, reportId }: { productName: string; reportId: string }) {
  return (
    <Page size="A4" style={styles.page}>
      <HeaderFooter title={productName} reportId={reportId} />
      <Text style={styles.sectionTitle}>Disclaimer</Text>
      <Text style={styles.disclaimer}>
        This report reflects traditional Vedic astrology interpretations based on the birth details
        provided and calculated planetary positions. It is intended for guidance and self-reflection
        only, and should not be treated as a medical diagnosis, legal advice, financial advice, or a
        guaranteed prediction of future events. Traditional astrological interpretation suggests
        certain tendencies and patterns; individual outcomes depend on many factors beyond the scope
        of this report. Please consult appropriately licensed professionals for medical, legal, or
        financial decisions. Remedies described are traditional practices offered for reflection, not
        a substitute for professional advice.
      </Text>
      <Text style={{ ...styles.disclaimer, marginTop: 16 }}>
        © TrueLoger. This report is generated exclusively for the named recipient and is confidential.
      </Text>
    </Page>
  );
}

export async function renderReportPdf(report: Report, blueprint: ReportBlueprint): Promise<Buffer> {
  const product = REPORT_PRODUCTS.find((p) => p.type === report.reportType);
  const productName = product?.name ?? "Personalized Report";
  // Computed once, here — never inside a component's render (report.completedAt
  // isn't set yet at this point in the pipeline; finishRendering in generate.ts
  // sets it only after this PDF has already been rendered).
  const generatedAt = report.completedAt ?? Date.now();

  const doc = (
    <Document title={`${productName} — ${report.profileSnapshot.fullName}`} author="TrueLoger">
      <CoverPage report={report} productName={productName} generatedAt={generatedAt} />
      <TableOfContentsPage report={report} blueprint={blueprint} productName={productName} />
      <BasicDetailsPage report={report} productName={productName} />
      {report.sections.map((section) => (
        <SectionPage key={section.id} section={section} productName={productName} reportId={report.id} />
      ))}
      <DisclaimerPage productName={productName} reportId={report.id} />
    </Document>
  );

  return renderToBuffer(doc);
}

// Silences an unused-import lint on Font in case no custom font gets
// registered in this pass — kept imported since a follow-up may
// register a serif display face for headings without touching imports.
void Font;
