import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Modal } from 'react-native';
import QuizScreen from './QuizScreen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';
import { COLORS, FONTS, RADIUS, SHADOW } from '../utils/theme';

function fmtDuration(sec) {
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function ProgressBar({ pct, color }) {
  return (
    <View style={styles.pbarTrack}>
      <View style={[styles.pbarFill, { width: `${pct}%`, backgroundColor: color }]} />
    </View>
  );
}

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [showQuiz, setShowQuiz] = useState(false);
  const { sessions, syllabus, deferred, notes, activeSession, goals, activeGoalId, setActiveGoal, markGoalDone, userName } = useStore();

  const todaySessions = useMemo(() => {
    const today = new Date().toDateString();
    return sessions.filter(s => new Date(s.startTime).toDateString() === today);
  }, [sessions]);

  const todayStudySec = useMemo(
    () => todaySessions.filter(s => s.type === 'study').reduce((a, s) => a + s.duration, 0),
    [todaySessions]
  );

  const pendingDeferred = deferred.filter(d => !d.done).length;

  // Active goal progress
  const activeGoal = goals.find(g => g.id === activeGoalId) || goals.find(g => !g.done) || null;
  const goalProgress = useMemo(() => {
    if (!activeGoal) return null;
    const subs = activeGoal.subjects || [];
    const total = subs.reduce((a, s) => a + (syllabus[s]?.length || 0), 0);
    const done  = subs.reduce((a, s) => a + (syllabus[s]?.filter(t => t.done).length || 0), 0);
    const bySubject = subs.map(s => {
      const topics = syllabus[s] || [];
      return { subject: s, done: topics.filter(t => t.done).length, total: topics.length };
    });
    return { total, done, pct: total ? Math.round(done / total * 100) : 0, bySubject };
  }, [activeGoal, syllabus]);

  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  };
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting()}, {userName || 'Tushar'} 👋</Text>
            <Text style={styles.date}>{today}</Text>
          </View>
          <View style={styles.flameBadge}>
            <Ionicons name="flame" size={18} color={COLORS.amber} />
            <Text style={styles.flameText}>{todaySessions.filter(s => s.type === 'study').length}</Text>
          </View>
        </View>

        {/* Active session banner */}
        {activeSession && (
          <TouchableOpacity style={styles.activeBanner} onPress={() => navigation.navigate('Tracker')}>
            <View style={styles.activeDot} />
            <Text style={styles.activeBannerText}>
              {activeSession.type === 'study' ? '📚 Studying' : '☕ On break'} — {activeSession.topic}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.accent} />
          </TouchableOpacity>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { icon:'time-outline', color:COLORS.green, val:fmtDuration(todayStudySec), label:'Today' },
            { icon:'layers-outline', color:COLORS.accent, val:pendingDeferred, label:'Pending' },
            { icon:'document-text-outline', color:COLORS.amber, val:notes.length, label:'Notes' },
          ].map(s => (
            <View key={s.label} style={[styles.statCard, SHADOW.card]}>
              <Ionicons name={s.icon} size={20} color={s.color} />
              <Text style={styles.statVal}>{s.val}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Goals chips */}
        {goals.length > 0 && (
          <View style={[styles.section, SHADOW.card]}>
            <Text style={styles.sectionTitle}>Goals</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection:'row', gap:8, paddingBottom:4 }}>
                {goals.map(g => (
                  <TouchableOpacity
                    key={g.id}
                    style={[styles.goalChip,
                      { borderColor: g.color },
                      activeGoal?.id === g.id && { backgroundColor: g.color + '22' },
                      g.done && { opacity: 0.45 },
                    ]}
                    onPress={() => setActiveGoal(g.id)}
                    onLongPress={() => {
                      if (!g.done) {
                        Alert.alert(`Mark "${g.name}" done?`, 'Baton passes to next goal.', [
                          { text:'Cancel', style:'cancel' },
                          { text:'Mark Done ✅', onPress: () => markGoalDone(g.id) },
                        ]);
                      }
                    }}
                  >
                    <View style={[styles.goalDot, { backgroundColor: g.color }]} />
                    <Text style={[styles.goalChipText, { color: g.color }]}>{g.name}</Text>
                    {g.done && <Ionicons name="checkmark-circle" size={13} color={g.color} />}
                    {activeGoal?.id === g.id && !g.done && (
                      <View style={[styles.activePip, { backgroundColor: g.color }]} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Active goal progress */}
        {activeGoal && goalProgress && (
          <View style={[styles.section, SHADOW.card]}>
            <View style={styles.goalProgressHeader}>
              <View>
                <Text style={styles.sectionTitle}>{activeGoal.name}</Text>
                <Text style={styles.goalProgressSub}>{goalProgress.done}/{goalProgress.total} topics · {goalProgress.pct}%</Text>
              </View>
              <Text style={[styles.goalPctBig, { color: activeGoal.color }]}>{goalProgress.pct}%</Text>
            </View>
            <ProgressBar pct={goalProgress.pct} color={activeGoal.color} />
            <View style={{ marginTop: 14, gap: 8 }}>
              {goalProgress.bySubject.map(s => {
                const p = s.total ? Math.round(s.done / s.total * 100) : 0;
                const c = COLORS.subjects?.[s.subject] || activeGoal.color;
                return (
                  <View key={s.subject} style={styles.subRow}>
                    <Text style={[styles.subName, { color: c }]} numberOfLines={1}>{s.subject}</Text>
                    <ProgressBar pct={p} color={c} />
                    <Text style={styles.subPct}>{p}%</Text>
                  </View>
                );
              })}
              {goalProgress.bySubject.length === 0 && (
                <Text style={styles.noSubsText}>No subjects added to this goal yet. Go to Syllabus → Goals.</Text>
              )}
            </View>
          </View>
        )}

        {/* Quick actions */}
        <Text style={styles.quickTitle}>Quick Actions</Text>
        <View style={styles.quickGrid}>
          {[
            { label:'Start Session', icon:'timer-outline', screen:'Tracker', color:COLORS.green },
            { label:'Add Note', icon:'create-outline', screen:'Notes', color:COLORS.amber },
            { label:'Study Later', icon:'bookmark-outline', screen:'Study Later', color:COLORS.accentLight },
            { label:'Quiz', icon:'help-circle-outline', screen:'Quiz', color:COLORS.blue },
          ].map(q => (
            <TouchableOpacity key={q.label} style={[styles.quickCard, SHADOW.card]}
              onPress={() => q.screen === 'Quiz' ? setShowQuiz(true) : navigation.navigate(q.screen)}>
              <Ionicons name={q.icon} size={24} color={q.color} />
              <Text style={styles.quickLabel}>{q.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Today's log */}
        {todaySessions.length > 0 && (
          <View style={[styles.section, SHADOW.card]}>
            <Text style={styles.sectionTitle}>Today's Log</Text>
            {todaySessions.slice(0, 5).map(s => (
              <View key={s.id} style={styles.logRow}>
                <View style={[styles.logDot, { backgroundColor: s.type === 'study' ? COLORS.green : COLORS.amber }]} />
                <View style={{ flex:1 }}>
                  <Text style={styles.logTopic} numberOfLines={1}>{s.topic}</Text>
                  <Text style={styles.logSub}>{s.subject} · {new Date(s.startTime).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</Text>
                </View>
                <Text style={styles.logDur}>{fmtDuration(s.duration)}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <Modal visible={showQuiz} animationType="slide" onRequestClose={() => setShowQuiz(false)}>
        <QuizScreen onClose={() => setShowQuiz(false)} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:   { flex:1, backgroundColor:COLORS.bg },
  scroll: { paddingHorizontal:16 },
  header: { flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', paddingTop:16, paddingBottom:16 },
  greeting: { fontSize:FONTS.xl, fontWeight:'700', color:COLORS.textPrimary },
  date:     { fontSize:FONTS.sm, color:COLORS.textSecondary, marginTop:2 },
  flameBadge: { flexDirection:'row', alignItems:'center', backgroundColor:COLORS.card, padding:8, borderRadius:RADIUS.md, gap:4 },
  flameText:  { color:COLORS.amber, fontWeight:'700', fontSize:FONTS.md },
  activeBanner: { flexDirection:'row', alignItems:'center', backgroundColor:COLORS.accentGlow, borderWidth:1, borderColor:COLORS.accent, borderRadius:RADIUS.md, padding:12, marginBottom:16, gap:8 },
  activeDot:   { width:8, height:8, borderRadius:4, backgroundColor:COLORS.green },
  activeBannerText: { flex:1, color:COLORS.textPrimary, fontSize:FONTS.sm, fontWeight:'500' },
  statsRow: { flexDirection:'row', gap:10, marginBottom:16 },
  statCard: { flex:1, backgroundColor:COLORS.card, borderRadius:RADIUS.lg, padding:14, alignItems:'center', gap:6 },
  statVal:  { fontSize:FONTS.lg, fontWeight:'700', color:COLORS.textPrimary },
  statLabel:{ fontSize:FONTS.xs, color:COLORS.textSecondary, fontWeight:'500' },
  section:  { backgroundColor:COLORS.card, borderRadius:RADIUS.lg, padding:16, marginBottom:16 },
  sectionTitle: { fontSize:FONTS.md, fontWeight:'700', color:COLORS.textPrimary, marginBottom:10 },
  goalChip: { flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:12, paddingVertical:7, borderRadius:20, borderWidth:1.5 },
  goalDot:  { width:7, height:7, borderRadius:3.5 },
  goalChipText: { fontSize:FONTS.xs, fontWeight:'700' },
  activePip:{ width:5, height:5, borderRadius:2.5 },
  goalProgressHeader: { flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 },
  goalProgressSub: { fontSize:FONTS.xs, color:COLORS.textSecondary, marginTop:2 },
  goalPctBig: { fontSize:32, fontWeight:'200', letterSpacing:-1 },
  pbarTrack: { flex:1, height:5, backgroundColor:COLORS.border, borderRadius:3, overflow:'hidden' },
  pbarFill:  { height:'100%', borderRadius:3 },
  subRow:    { flexDirection:'row', alignItems:'center', gap:8 },
  subName:   { fontSize:FONTS.xs, fontWeight:'600', width:90 },
  subPct:    { fontSize:FONTS.xs, color:COLORS.textMuted, width:28, textAlign:'right' },
  noSubsText:{ fontSize:FONTS.xs, color:COLORS.textMuted, fontStyle:'italic', textAlign:'center', paddingVertical:8 },
  quickTitle:{ fontSize:FONTS.md, fontWeight:'700', color:COLORS.textPrimary, marginBottom:10 },
  quickGrid: { flexDirection:'row', flexWrap:'wrap', gap:10, marginBottom:16 },
  quickCard: { width:'47%', backgroundColor:COLORS.card, borderRadius:RADIUS.lg, padding:16, gap:8 },
  quickLabel:{ fontSize:FONTS.sm, fontWeight:'600', color:COLORS.textPrimary },
  logRow:    { flexDirection:'row', alignItems:'center', gap:10, paddingVertical:8, borderTopWidth:1, borderTopColor:COLORS.border },
  logDot:    { width:8, height:8, borderRadius:4 },
  logTopic:  { fontSize:FONTS.sm, color:COLORS.textPrimary, fontWeight:'500' },
  logSub:    { fontSize:FONTS.xs, color:COLORS.textSecondary, marginTop:2 },
  logDur:    { fontSize:FONTS.sm, color:COLORS.textMuted, fontWeight:'500' },
});
