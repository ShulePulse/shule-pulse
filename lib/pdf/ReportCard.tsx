import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { formatDateSw } from '@/lib/utils';
import type { ReportData } from '@/lib/pdf/data';

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: 'Helvetica', color: '#0f172a' },
  header: { borderBottomWidth: 2, borderBottomColor: '#2563eb', paddingBottom: 8, marginBottom: 12 },
  school: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#2563eb' },
  title: { fontSize: 11, marginTop: 2, color: '#475569' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  infoCol: { width: '50%' },
  label: { color: '#64748b', fontSize: 8 },
  value: { fontSize: 11, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  h2: { fontSize: 12, fontFamily: 'Helvetica-Bold', marginTop: 12, marginBottom: 4, color: '#1e3a8a' },
  tableHead: { flexDirection: 'row', backgroundColor: '#eff6ff', paddingVertical: 4, paddingHorizontal: 4 },
  row: { flexDirection: 'row', paddingVertical: 3, paddingHorizontal: 4, borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0' },
  cSubject: { width: '30%' },
  cAssess: { width: '32%' },
  cScore: { width: '20%', textAlign: 'right' },
  cPct: { width: '18%', textAlign: 'right' },
  bold: { fontFamily: 'Helvetica-Bold' },
  statsRow: { flexDirection: 'row', gap: 8 },
  stat: { flexGrow: 1, borderWidth: 0.5, borderColor: '#cbd5e1', borderRadius: 4, padding: 6, alignItems: 'center' },
  statNum: { fontSize: 14, fontFamily: 'Helvetica-Bold' },
  comment: { borderWidth: 0.5, borderColor: '#cbd5e1', borderRadius: 4, padding: 8, minHeight: 50 },
  footer: { position: 'absolute', bottom: 20, left: 36, right: 36, fontSize: 8, color: '#94a3b8', flexDirection: 'row', justifyContent: 'space-between' },
});

/** Report card PDF (A4). Call as a plain function: renderToBuffer(ReportCard(data)). */
export function ReportCard(d: ReportData) {
  const cls = d.student.stream ? `${d.student.class_name} ${d.student.stream}` : d.student.class_name;

  return (
    <Document title={`Ripoti - ${d.student.full_name}`} author="ShulePulse">
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.school}>{d.schoolName}</Text>
          <Text style={styles.title}>Ripoti ya Maendeleo ya Mwanafunzi - {d.term.name} {d.term.year}</Text>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoCol}>
            <Text style={styles.label}>Jina la mwanafunzi</Text>
            <Text style={styles.value}>{d.student.full_name}</Text>
            <Text style={styles.label}>Namba ya usajili</Text>
            <Text style={styles.value}>{d.student.admission_no}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.label}>Darasa</Text>
            <Text style={styles.value}>{cls}</Text>
            <Text style={styles.label}>Wastani wa jumla</Text>
            <Text style={styles.value}>{d.overall === null ? '-' : `${d.overall}%`}</Text>
          </View>
        </View>

        <Text style={styles.h2}>Alama</Text>
        {d.grades.length === 0 ? (
          <Text>Hakuna alama zilizoingizwa kwa muhula huu.</Text>
        ) : (
          <View>
            <View style={styles.tableHead}>
              <Text style={[styles.cSubject, styles.bold]}>Somo</Text>
              <Text style={[styles.cAssess, styles.bold]}>Mtihani</Text>
              <Text style={[styles.cScore, styles.bold]}>Alama</Text>
              <Text style={[styles.cPct, styles.bold]}>%</Text>
            </View>
            {d.grades.map((g, i) => (
              <View key={`${g.subject}-${g.assessment}-${i}`} style={styles.row} wrap={false}>
                <Text style={styles.cSubject}>{g.subject}</Text>
                <Text style={styles.cAssess}>{g.assessment}</Text>
                <Text style={styles.cScore}>{g.score}/{g.max}</Text>
                <Text style={styles.cPct}>{g.pct}%</Text>
              </View>
            ))}
            <Text style={[styles.h2, { fontSize: 10 }]}>Wastani kwa somo</Text>
            {d.subjectAverages.map((s) => (
              <View key={s.subject} style={styles.row} wrap={false}>
                <Text style={styles.cSubject}>{s.subject}</Text>
                <Text style={styles.cAssess} />
                <Text style={styles.cScore} />
                <Text style={[styles.cPct, styles.bold]}>{s.average}%</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.h2}>Mahudhurio</Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}><Text style={styles.statNum}>{d.attendance.present}</Text><Text style={styles.label}>Yupo</Text></View>
          <View style={styles.stat}><Text style={styles.statNum}>{d.attendance.absent}</Text><Text style={styles.label}>Hayupo</Text></View>
          <View style={styles.stat}><Text style={styles.statNum}>{d.attendance.late}</Text><Text style={styles.label}>Amechelewa</Text></View>
          <View style={styles.stat}><Text style={styles.statNum}>{d.attendance.rate === null ? '-' : `${d.attendance.rate}%`}</Text><Text style={styles.label}>Kiwango</Text></View>
        </View>

        <Text style={styles.h2}>Tabia</Text>
        <Text>
          Chanya: {d.behavior.positive}   Hasi: {d.behavior.negative}   Nyingine: {d.behavior.neutral}
        </Text>
        {d.behavior.tags.length > 0 ? (
          <Text style={{ marginTop: 2, color: '#475569' }}>{d.behavior.tags.map((t) => `${t.tag} (${t.count})`).join(', ')}</Text>
        ) : null}

        <Text style={styles.h2}>Maoni ya mwalimu</Text>
        <View style={styles.comment}>
          <Text>{d.comment.trim() ? d.comment : ' '}</Text>
        </View>

        <View style={styles.footer} fixed>
          <Text>Imezalishwa na ShulePulse - {formatDateSw(d.generatedAt)}</Text>
          <Text render={({ pageNumber, totalPages }) => `Ukurasa ${pageNumber}/${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
