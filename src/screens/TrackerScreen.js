import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Modal, Pressable, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';
import { COLORS, FONTS, RADIUS, SHADOW } from '../utils/theme';
import { SUBJECTS } from '../data/subjects';
import SessionHistory from '../components/SessionHistory';
import * as Haptics from 'expo-haptics';

function fmt(sec) {
  const h = String(Math.floor(sec / 3600)).padStart(2,'0');
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2,'0');
  const s = String(sec % 60).padStart(2,'0');
  return `${h}:${m}:${s}`;
}
function fmtShort(sec) {
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function TrackerScreen() {
  const insets = useSafeAreaInsets();
  const { activeSession, sessions, startSession, endSession } = useStore();
  const [elapsed, setElapsed] = useState(0);
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [showPicker, setShowPicker] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef(null);

  const triggerHaptic = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}
  };

  const handleStartSession = (type, title, sub) => {
    triggerHaptic();
    startSession(type, title, sub);
  };

  const handleEndSession = () => {
    triggerHaptic();
    endSession();
  };

  useEffect(() => {
    if (activeSession) {
      const tick = () => setElapsed(Math.floor((Date.now() - activeSession.startTime) / 1000));
      tick();
      intervalRef.current = setInterval(tick, 1000);
      Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue:1.04, duration:900, useNativeDriver:true }),
        Animated.timing(pulseAnim, { toValue:1,    duration:900, useNativeDriver:true }),
      ])).start();
    } else {
      clearInterval(intervalRef.current);
      setElapsed(0);
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
    return () => clearInterval(intervalRef.current);
  }, [activeSession]);

  const todaySessions = useMemo(() => {
    const today = new Date().toDateString();
    return sessions.filter(s => new Date(s.startTime).toDateString() === today);
  }, [sessions]);

  const totalStudy = todaySessions.filter(s=>s.type==='study').reduce((a,s)=>a+s.duration,0);
  const totalBreak = todaySessions.filter(s=>s.type==='break').reduce((a,s)=>a+s.duration,0);
  const isStudying = activeSession?.type === 'study';
  const isOnBreak  = activeSession?.type === 'break';
  const isIdle     = !activeSession;
  const timerColor = isStudying ? COLORS.green : isOnBreak ? COLORS.amber : COLORS.textMuted;

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <Text style={styles.pageTitle}>Session Tracker</Text>
          <SessionHistory />
        </View>

        <Animated.View style={[styles.timerCard, SHADOW.glow, { transform:[{ scale: activeSession ? pulseAnim : 1 }] }]}>
          <Text style={styles.statusLabel}>
            {isStudying ? '📚  Studying' : isOnBreak ? '☕  On Break' : '—  Idle'}
          </Text>
          <Text style={[styles.timerText, { color: timerColor }]}>{fmt(elapsed)}</Text>

          {isIdle && (
            <>
              <TextInput
                style={styles.topicInput}
                placeholder="What are you studying?"
                placeholderTextColor={COLORS.textMuted}
                value={topic}
                onChangeText={setTopic}
              />
              <TouchableOpacity style={styles.subjectPill} onPress={() => setShowPicker(true)}>
                <View style={[styles.subjectDot, { backgroundColor: COLORS.subjects?.[subject] || COLORS.accent }]} />
                <Text style={styles.subjectPillText}>{subject}</Text>
                <Ionicons name="chevron-down" size={14} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </>
          )}

          {!isIdle && (
            <View style={styles.sessionInfo}>
              <View style={[styles.subjectDot, { backgroundColor: COLORS.subjects?.[activeSession.subject] || COLORS.accent }]} />
              <Text style={styles.sessionInfoText}>{activeSession.topic || 'Session'}</Text>
              <Text style={styles.sessionSubText}> · {activeSession.subject}</Text>
            </View>
          )}

          <View style={styles.btnRow}>
            {isIdle && (
              <TouchableOpacity style={[styles.btn, styles.btnGreen]}
                onPress={() => handleStartSession('study', topic || 'Study session', subject)}>
                <Ionicons name="play" size={18} color="#fff" />
                <Text style={styles.btnText}>Start Study</Text>
              </TouchableOpacity>
            )}
            {isStudying && (
              <>
                <TouchableOpacity style={[styles.btn, styles.btnAmber]} onPress={() => { handleEndSession(); handleStartSession('break','Break','Break'); }}>
                  <Ionicons name="cafe" size={18} color="#fff" />
                  <Text style={styles.btnText}>Take Break</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.btnDanger]} onPress={handleEndSession}>
                  <Ionicons name="stop" size={18} color="#fff" />
                  <Text style={styles.btnText}>Stop</Text>
                </TouchableOpacity>
              </>
            )}
            {isOnBreak && (
              <>
                <TouchableOpacity style={[styles.btn, styles.btnGreen]} onPress={() => { handleEndSession(); handleStartSession('study', topic || 'Study session', subject); }}>
                  <Ionicons name="play" size={18} color="#fff" />
                  <Text style={styles.btnText}>Resume</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.btnDanger]} onPress={handleEndSession}>
                  <Ionicons name="stop" size={18} color="#fff" />
                  <Text style={styles.btnText}>End</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </Animated.View>

        <View style={styles.statsRow}>
          {[
            { icon:'book-outline',           color:COLORS.green,       val:fmtShort(totalStudy), label:'Studied' },
            { icon:'cafe-outline',            color:COLORS.amber,       val:fmtShort(totalBreak), label:'Breaks'  },
            { icon:'checkmark-circle-outline',color:COLORS.accentLight, val:todaySessions.filter(s=>s.type==='study').length, label:'Sessions' },
          ].map(s => (
            <View key={s.label} style={[styles.statCard, SHADOW.card]}>
              <Ionicons name={s.icon} size={18} color={s.color} />
              <Text style={styles.statVal}>{s.val}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.logTitle}>Today's Log</Text>
        {todaySessions.length === 0 ? (
          <View style={styles.emptyLog}>
            <Ionicons name="time-outline" size={32} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No sessions yet. Start studying!</Text>
          </View>
        ) : todaySessions.map(s => (
          <View key={s.id} style={[styles.logCard, SHADOW.card]}>
            <View style={[styles.logAccent, { backgroundColor: s.type==='study' ? COLORS.green : COLORS.amber }]} />
            <View style={{ flex:1 }}>
              <Text style={styles.logTopic} numberOfLines={1}>{s.topic}</Text>
              <Text style={styles.logMeta}>
                {s.subject} · {new Date(s.startTime).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
                {' → '}{new Date(s.endTime).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
              </Text>
            </View>
            <Text style={[styles.logDur, { color: s.type==='study' ? COLORS.green : COLORS.amber }]}>
              {fmtShort(s.duration)}
            </Text>
          </View>
        ))}
        <View style={{ height:100 }} />
      </ScrollView>

      <Modal visible={showPicker} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowPicker(false)}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Pick Subject</Text>
            {SUBJECTS.map(s => (
              <TouchableOpacity key={s} style={[styles.subjectOption, subject===s && styles.subjectOptionActive]}
                onPress={() => { setSubject(s); setShowPicker(false); }}>
                <View style={[styles.subjectDot, { backgroundColor: COLORS.subjects?.[s] || COLORS.accent }]} />
                <Text style={[styles.subjectOptionText, subject===s && { color:COLORS.textPrimary }]}>{s}</Text>
                {subject===s && <Ionicons name="checkmark" size={18} color={COLORS.accent} />}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex:1, backgroundColor:COLORS.bg },
  titleRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:16, paddingBottom:12, paddingTop:0 },
  pageTitle: { fontSize:FONTS.xl, fontWeight:'700', color:COLORS.textPrimary },
  timerCard: { backgroundColor:COLORS.card, borderRadius:RADIUS.xl, margin:16, marginTop:0, padding:24, alignItems:'center', borderWidth:1, borderColor:COLORS.border },
  statusLabel: { fontSize:FONTS.sm, color:COLORS.textSecondary, fontWeight:'600', marginBottom:8, letterSpacing:0.5 },
  timerText: { fontSize:58, fontWeight:'200', letterSpacing:-2, marginBottom:16 },
  topicInput: { backgroundColor:COLORS.bg, borderRadius:RADIUS.md, padding:12, color:COLORS.textPrimary, fontSize:FONTS.md, width:'100%', borderWidth:1, borderColor:COLORS.border, marginBottom:10 },
  subjectPill: { flexDirection:'row', alignItems:'center', gap:8, backgroundColor:COLORS.bg, borderRadius:RADIUS.xl, paddingHorizontal:14, paddingVertical:8, borderWidth:1, borderColor:COLORS.border, marginBottom:16 },
  subjectPillText: { fontSize:FONTS.sm, color:COLORS.textSecondary, fontWeight:'500' },
  subjectDot: { width:10, height:10, borderRadius:5 },
  sessionInfo: { flexDirection:'row', alignItems:'center', gap:6, marginBottom:16 },
  sessionInfoText: { fontSize:FONTS.sm, color:COLORS.textPrimary, fontWeight:'500' },
  sessionSubText: { fontSize:FONTS.sm, color:COLORS.textSecondary },
  btnRow: { flexDirection:'row', gap:10, width:'100%' },
  btn: { flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:6, padding:13, borderRadius:RADIUS.md },
  btnGreen:  { backgroundColor:'#1A6B4A' },
  btnAmber:  { backgroundColor:'#7A5112' },
  btnDanger: { backgroundColor:'#6B1A23' },
  btnText: { color:'#fff', fontSize:FONTS.sm, fontWeight:'600' },
  statsRow: { flexDirection:'row', gap:10, marginHorizontal:16, marginBottom:20 },
  statCard: { flex:1, backgroundColor:COLORS.card, borderRadius:RADIUS.lg, padding:12, alignItems:'center', gap:4 },
  statVal: { fontSize:FONTS.lg, fontWeight:'700', color:COLORS.textPrimary },
  statLabel: { fontSize:FONTS.xs, color:COLORS.textSecondary, fontWeight:'500' },
  logTitle: { fontSize:FONTS.md, fontWeight:'700', color:COLORS.textPrimary, marginHorizontal:16, marginBottom:10 },
  emptyLog: { alignItems:'center', padding:32, gap:10 },
  emptyText: { color:COLORS.textMuted, fontSize:FONTS.sm },
  logCard: { flexDirection:'row', alignItems:'center', backgroundColor:COLORS.card, borderRadius:RADIUS.md, marginHorizontal:16, marginBottom:8, overflow:'hidden' },
  logAccent: { width:4, alignSelf:'stretch' },
  logTopic: { fontSize:FONTS.sm, color:COLORS.textPrimary, fontWeight:'500', paddingLeft:12, paddingTop:10 },
  logMeta: { fontSize:FONTS.xs, color:COLORS.textSecondary, paddingLeft:12, paddingBottom:10, marginTop:2 },
  logDur: { fontSize:FONTS.sm, fontWeight:'700', paddingRight:14 },
  modalOverlay: { flex:1, backgroundColor:'rgba(0,0,0,0.6)', justifyContent:'flex-end' },
  modalSheet: { backgroundColor:COLORS.surface, borderTopLeftRadius:24, borderTopRightRadius:24, padding:20, paddingBottom:40 },
  modalHandle: { width:40, height:4, backgroundColor:COLORS.border, borderRadius:2, alignSelf:'center', marginBottom:16 },
  modalTitle: { fontSize:FONTS.lg, fontWeight:'700', color:COLORS.textPrimary, marginBottom:12 },
  subjectOption: { flexDirection:'row', alignItems:'center', gap:10, padding:12, borderRadius:RADIUS.md, marginBottom:4 },
  subjectOptionActive: { backgroundColor:COLORS.accentGlow },
  subjectOptionText: { flex:1, fontSize:FONTS.md, color:COLORS.textSecondary, fontWeight:'500' },
});
