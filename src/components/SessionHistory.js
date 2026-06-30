import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  ScrollView, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';
import { COLORS, FONTS, RADIUS, SHADOW } from '../utils/theme';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES   = ['S','M','T','W','T','F','S'];

function fmtShort(sec) {
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
}

function buildHeatmap(sessions) {
  const map = {};
  sessions.forEach(s => {
    if (s.type !== 'study') return;
    const key = new Date(s.startTime).toDateString();
    map[key] = (map[key] || 0) + s.duration;
  });
  return map;
}

function heatColor(sec) {
  if (!sec) return COLORS.card;
  const h = sec / 3600;
  if (h < 1)  return '#1A3A5C';
  if (h < 2)  return '#1A5C8A';
  if (h < 4)  return '#1B7FBF';
  if (h < 6)  return '#2A9FE0';
  return '#6C63FF';
}

// Calculate streak
function calcStreak(heatmap) {
  const today = new Date();
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toDateString();
    if (heatmap[key] > 0) streak++;
    else if (i > 0) break;
  }
  return streak;
}

export default function SessionHistory() {
  const { sessions } = useStore();
  const insets = useSafeAreaInsets();
  const [visible,      setVisible]      = useState(false);
  const [selectedDay,  setSelectedDay]  = useState(null);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const heatmap = useMemo(() => buildHeatmap(sessions), [sessions]);

  const totalStudySec = sessions.filter(s => s.type==='study').reduce((a,s) => a+s.duration, 0);
  const studyDays     = new Set(sessions.filter(s => s.type==='study').map(s => new Date(s.startTime).toDateString())).size;
  const streak        = useMemo(() => calcStreak(heatmap), [heatmap]);

  const prevMonth = () => setCurrentMonth(({ year, month }) => {
    if (month === 0) return { year: year-1, month: 11 };
    return { year, month: month-1 };
  });
  const nextMonth = () => setCurrentMonth(({ year, month }) => {
    if (month === 11) return { year: year+1, month: 0 };
    return { year, month: month+1 };
  });

  const { year, month } = currentMonth;
  const firstDay     = new Date(year, month, 1).getDay();
  const daysInMonth  = new Date(year, month+1, 0).getDate();
  const today        = new Date();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  // Selected day data
  const selectedData = useMemo(() => {
    if (!selectedDay) return null;
    const daySessions = sessions
      .filter(s => new Date(s.startTime).toDateString() === selectedDay)
      .sort((a,b) => a.startTime - b.startTime);
    const studySec = daySessions.filter(s=>s.type==='study').reduce((a,s)=>a+s.duration,0);
    const breakSec = daySessions.filter(s=>s.type==='break').reduce((a,s)=>a+s.duration,0);
    const studyCount = daySessions.filter(s=>s.type==='study').length;
    // Insights
    const longest = daySessions.filter(s=>s.type==='study').sort((a,b)=>b.duration-a.duration)[0];
    const subjectMap = {};
    daySessions.filter(s=>s.type==='study').forEach(s => {
      subjectMap[s.subject] = (subjectMap[s.subject]||0) + s.duration;
    });
    const mostStudied = Object.entries(subjectMap).sort((a,b)=>b[1]-a[1])[0];
    return { daySessions, studySec, breakSec, studyCount, longest, mostStudied };
  }, [selectedDay, sessions]);

  return (
    <>
      <TouchableOpacity style={styles.triggerBtn} onPress={() => setVisible(true)}>
        <Ionicons name="calendar-outline" size={22} color={COLORS.textSecondary} />
      </TouchableOpacity>

      <Modal visible={visible} animationType="slide" onRequestClose={() => setVisible(false)}>
        <View style={[styles.safe, { paddingTop: insets.top }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Study History</Text>
            <TouchableOpacity onPress={() => setVisible(false)}>
              <Ionicons name="close" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Stats row */}
            <View style={styles.statsRow}>
              <View style={[styles.statCard, SHADOW.card]}>
                <Text style={styles.statVal}>{fmtShort(totalStudySec)}</Text>
                <Text style={styles.statLabel}>Total Studied</Text>
              </View>
              <View style={[styles.statCard, SHADOW.card]}>
                <Text style={styles.statVal}>{studyDays}</Text>
                <Text style={styles.statLabel}>Study Days</Text>
              </View>
              <View style={[styles.statCard, SHADOW.card]}>
                <Text style={[styles.statVal, { color: COLORS.amber }]}>🔥 {streak}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
            </View>

            {/* Month navigation */}
            <View style={styles.monthNav}>
              <TouchableOpacity onPress={prevMonth} style={styles.monthNavBtn}>
                <Ionicons name="chevron-back" size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.monthTitle}>{MONTH_NAMES[month]} {year}</Text>
              <TouchableOpacity onPress={nextMonth} style={styles.monthNavBtn}
                disabled={year === today.getFullYear() && month === today.getMonth()}>
                <Ionicons name="chevron-forward" size={20}
                  color={year === today.getFullYear() && month === today.getMonth() ? COLORS.textMuted : COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Legend */}
            <View style={styles.legend}>
              <Text style={styles.legendLabel}>Less</Text>
              {[0, 1800, 7200, 14400, 21600].map((s,i) => (
                <View key={i} style={[styles.legendBox, { backgroundColor: heatColor(s) }]} />
              ))}
              <Text style={styles.legendLabel}>More</Text>
            </View>

            {/* Day headers */}
            <View style={styles.weekRow}>
              {DAY_NAMES.map((d,i) => <Text key={i} style={styles.dayHeader}>{d}</Text>)}
            </View>

            {/* Calendar grid */}
            <View style={styles.grid}>
              {cells.map((d, i) => {
                if (!d) return <View key={`e${i}`} style={styles.cell} />;
                const dateStr  = new Date(year, month, d).toDateString();
                const sec      = heatmap[dateStr] || 0;
                const isToday  = today.getFullYear()===year && today.getMonth()===month && today.getDate()===d;
                const isSel    = selectedDay === dateStr;
                const isFuture = new Date(year, month, d) > today;
                return (
                  <TouchableOpacity key={d} style={styles.cell}
                    onPress={() => !isFuture && setSelectedDay(isSel ? null : dateStr)}
                    disabled={isFuture}>
                    <View style={[
                      styles.daySq,
                      { backgroundColor: isFuture ? 'transparent' : heatColor(sec) },
                      isToday && styles.todaySq,
                      isSel   && styles.selSq,
                    ]}>
                      <Text style={[
                        styles.dayNum,
                        isToday && styles.todayNum,
                        isSel   && styles.selNum,
                        isFuture && styles.futureNum,
                        sec > 0 && !isSel && !isToday && { color:'#fff' },
                      ]}>{d}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Selected day expanded inline */}
            {selectedDay && selectedData && (
              <View style={styles.dayDetail}>
                <Text style={styles.dayDetailTitle}>
                  {new Date(selectedDay).toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long' })}
                </Text>

                {selectedData.studySec === 0 ? (
                  <View style={styles.noDayStudy}>
                    <Text style={styles.noDayEmoji}>😴</Text>
                    <Text style={styles.noDayText}>No study sessions on this day</Text>
                  </View>
                ) : (
                  <>
                    {/* Day stats */}
                    <View style={styles.dayStats}>
                      <View style={styles.dayStat}>
                        <Ionicons name="book-outline" size={16} color={COLORS.green} />
                        <Text style={styles.dayStatVal}>{fmtShort(selectedData.studySec)}</Text>
                        <Text style={styles.dayStatLabel}>Study</Text>
                      </View>
                      <View style={styles.dayStat}>
                        <Ionicons name="cafe-outline" size={16} color={COLORS.amber} />
                        <Text style={styles.dayStatVal}>{fmtShort(selectedData.breakSec)}</Text>
                        <Text style={styles.dayStatLabel}>Breaks</Text>
                      </View>
                      <View style={styles.dayStat}>
                        <Ionicons name="flash-outline" size={16} color={COLORS.accentLight} />
                        <Text style={styles.dayStatVal}>{selectedData.studyCount}</Text>
                        <Text style={styles.dayStatLabel}>Sessions</Text>
                      </View>
                    </View>

                    {/* Timeline */}
                    <Text style={styles.sectionLabel}>Timeline</Text>
                    <View style={styles.timeline}>
                      {selectedData.daySessions.map((s, i) => (
                        <View key={s.id} style={styles.timelineRow}>
                          <Text style={styles.timelineTime}>{fmtTime(s.startTime)}</Text>
                          <View style={styles.timelineLine}>
                            <View style={[styles.timelineDot, { backgroundColor: s.type==='study' ? COLORS.green : COLORS.amber }]} />
                            {i < selectedData.daySessions.length-1 && <View style={styles.timelineConnector} />}
                          </View>
                          <View style={styles.timelineContent}>
                            <Text style={styles.timelineTopic} numberOfLines={1}>{s.topic}</Text>
                            <Text style={styles.timelineMeta}>{s.type==='study' ? s.subject : 'Break'} · {fmtShort(s.duration)}</Text>
                          </View>
                        </View>
                      ))}
                    </View>

                    {/* Insights */}
                    <Text style={styles.sectionLabel}>Insights</Text>
                    <View style={styles.insights}>
                      {selectedData.longest && (
                        <View style={styles.insightRow}>
                          <Ionicons name="trophy-outline" size={15} color={COLORS.amber} />
                          <Text style={styles.insightText}>Longest session: <Text style={styles.insightVal}>{fmtShort(selectedData.longest.duration)}</Text></Text>
                        </View>
                      )}
                      {selectedData.mostStudied && (
                        <View style={styles.insightRow}>
                          <Ionicons name="star-outline" size={15} color={COLORS.accent} />
                          <Text style={styles.insightText}>Most studied: <Text style={styles.insightVal}>{selectedData.mostStudied[0]}</Text></Text>
                        </View>
                      )}
                      {selectedData.studyCount > 0 && (
                        <View style={styles.insightRow}>
                          <Ionicons name="time-outline" size={15} color={COLORS.green} />
                          <Text style={styles.insightText}>Avg session: <Text style={styles.insightVal}>{fmtShort(Math.round(selectedData.studySec / selectedData.studyCount))}</Text></Text>
                        </View>
                      )}
                    </View>
                  </>
                )}
              </View>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const CELL_SIZE = 40;

const styles = StyleSheet.create({
  triggerBtn: { padding:6 },
  safe:   { flex:1, backgroundColor:COLORS.bg },
  header: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:16, paddingTop:8, borderBottomWidth:1, borderBottomColor:COLORS.border },
  title:  { fontSize:FONTS.xl, fontWeight:'700', color:COLORS.textPrimary },

  statsRow: { flexDirection:'row', gap:10, padding:16, paddingBottom:8 },
  statCard: { flex:1, backgroundColor:COLORS.card, borderRadius:RADIUS.lg, padding:12, alignItems:'center', gap:4 },
  statVal:  { fontSize:FONTS.lg, fontWeight:'700', color:COLORS.textPrimary },
  statLabel:{ fontSize:FONTS.xs, color:COLORS.textSecondary, fontWeight:'500' },

  monthNav:    { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingVertical:10 },
  monthNavBtn: { padding:8, backgroundColor:COLORS.card, borderRadius:RADIUS.md },
  monthTitle:  { fontSize:FONTS.lg, fontWeight:'700', color:COLORS.textPrimary },

  legend:      { flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:16, marginBottom:10, justifyContent:'flex-end' },
  legendBox:   { width:14, height:14, borderRadius:3 },
  legendLabel: { fontSize:10, color:COLORS.textMuted },

  weekRow:   { flexDirection:'row', paddingHorizontal:10, marginBottom:4 },
  dayHeader: { width:`${100/7}%`, textAlign:'center', fontSize:11, color:COLORS.textMuted, fontWeight:'700' },

  grid:    { flexDirection:'row', flexWrap:'wrap', paddingHorizontal:10 },
  cell:    { width:`${100/7}%`, alignItems:'center', paddingVertical:3 },
  daySq:   { width:CELL_SIZE-6, height:CELL_SIZE-6, borderRadius:8, alignItems:'center', justifyContent:'center' },
  todaySq: { borderWidth:2, borderColor:COLORS.accent },
  selSq:   { backgroundColor:COLORS.accent },
  dayNum:  { fontSize:12, color:COLORS.textMuted, fontWeight:'500' },
  todayNum:{ color:COLORS.accentLight, fontWeight:'700' },
  selNum:  { color:'#fff', fontWeight:'700' },
  futureNum:{ color:COLORS.border },

  // Day detail
  dayDetail:      { margin:16, backgroundColor:COLORS.card, borderRadius:RADIUS.xl, padding:16, borderWidth:1, borderColor:COLORS.border },
  dayDetailTitle: { fontSize:FONTS.md, fontWeight:'700', color:COLORS.textPrimary, marginBottom:14 },
  noDayStudy:     { alignItems:'center', paddingVertical:20, gap:8 },
  noDayEmoji:     { fontSize:32 },
  noDayText:      { fontSize:FONTS.sm, color:COLORS.textMuted },

  dayStats: { flexDirection:'row', gap:8, marginBottom:16 },
  dayStat:  { flex:1, backgroundColor:COLORS.bg, borderRadius:RADIUS.md, padding:10, alignItems:'center', gap:4 },
  dayStatVal:   { fontSize:FONTS.md, fontWeight:'700', color:COLORS.textPrimary },
  dayStatLabel: { fontSize:FONTS.xs, color:COLORS.textSecondary },

  sectionLabel: { fontSize:FONTS.xs, color:COLORS.textSecondary, fontWeight:'700', textTransform:'uppercase', letterSpacing:0.5, marginBottom:10 },

  // Timeline
  timeline:        { gap:0, marginBottom:16 },
  timelineRow:     { flexDirection:'row', alignItems:'flex-start', gap:10 },
  timelineTime:    { fontSize:11, color:COLORS.textMuted, width:42, marginTop:4, textAlign:'right' },
  timelineLine:    { alignItems:'center', width:20 },
  timelineDot:     { width:10, height:10, borderRadius:5, marginTop:5 },
  timelineConnector: { width:2, flex:1, minHeight:24, backgroundColor:COLORS.border, marginVertical:2 },
  timelineContent: { flex:1, paddingBottom:12 },
  timelineTopic:   { fontSize:FONTS.sm, color:COLORS.textPrimary, fontWeight:'600' },
  timelineMeta:    { fontSize:FONTS.xs, color:COLORS.textSecondary, marginTop:2 },

  // Insights
  insights:    { gap:10 },
  insightRow:  { flexDirection:'row', alignItems:'center', gap:8 },
  insightText: { fontSize:FONTS.sm, color:COLORS.textSecondary },
  insightVal:  { color:COLORS.textPrimary, fontWeight:'700' },
});
