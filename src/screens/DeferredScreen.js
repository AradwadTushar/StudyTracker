import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Modal, Pressable, Animated, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';
import { COLORS, FONTS, RADIUS, SHADOW } from '../utils/theme';
import { SUBJECTS, STICKY_COLORS, PRIORITY_COLORS } from '../data/subjects';

const { width: SW } = Dimensions.get('window');
const NOTE_W = (SW - 48) / 2;

function StickyNote({ note, onToggle, onDelete }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const pop = (cb) => Animated.sequence([
    Animated.timing(scaleAnim, { toValue:0.92, duration:80, useNativeDriver:true }),
    Animated.timing(scaleAnim, { toValue:1,    duration:80, useNativeDriver:true }),
  ]).start(cb);

  const bg = note.color || COLORS.stickyYellow;
  const pc = PRIORITY_COLORS[note.priority] || PRIORITY_COLORS.medium;
  const tc = '#1A1A2E';

  return (
    <Animated.View style={[styles.noteWrapper, { transform:[{ rotate:`${note.rotation}deg` },{ scale:scaleAnim }] }]}>
      <TouchableOpacity onPress={() => pop(() => onToggle(note.id))} onLongPress={() => pop(() => onDelete(note.id))}
        activeOpacity={0.9}
        style={[styles.note, { backgroundColor:bg, opacity: note.done ? 0.4 : 1 }]}>
        <View style={[styles.priorityCorner, { backgroundColor:pc }]}>
          <Text style={styles.priorityText}>{note.priority}</Text>
        </View>
        <View style={styles.pin}>
          <View style={styles.pinHead} />
          <View style={styles.pinNeedle} />
        </View>
        <Text style={[styles.noteText, { color:tc }, note.done && styles.noteTextDone]} numberOfLines={5}>{note.text}</Text>
        <Text style={[styles.noteSubject, { color:tc+'99' }]} numberOfLines={1}>{note.subject}</Text>
        {note.done && <View style={styles.doneStamp}><Ionicons name="checkmark-circle" size={22} color={COLORS.green} /></View>}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function DeferredScreen() {
  const insets = useSafeAreaInsets();
  const { deferred, addDeferred, toggleDeferred, deleteDeferred } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [text,     setText]       = useState('');
  const [subject,  setSubject]    = useState(SUBJECTS[0]);
  const [priority, setPriority]   = useState('medium');
  const [color,    setColor]      = useState(STICKY_COLORS[0]);
  const [filter,   setFilter]     = useState('all');

  const filtered = deferred.filter(n =>
    filter === 'pending' ? !n.done : filter === 'done' ? n.done : true
  );
  const col1 = filtered.filter((_,i) => i%2===0);
  const col2 = filtered.filter((_,i) => i%2===1);

  const handleAdd = () => {
    if (!text.trim()) return;
    addDeferred(text.trim(), subject, priority, color);
    setText(''); setSubject(SUBJECTS[0]); setPriority('medium'); setColor(STICKY_COLORS[0]);
    setShowModal(false);
  };

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.pageTitle}>Study Later</Text>
          <Text style={styles.subTitle}>{deferred.filter(n=>!n.done).length} topics pending</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        {['all','pending','done'].map(f => (
          <TouchableOpacity key={f} style={[styles.filterPill, filter===f && styles.filterPillActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter===f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase()+f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📌</Text>
          <Text style={styles.emptyTitle}>No sticky notes yet</Text>
          <Text style={styles.emptyText}>Pin topics you want to revisit later.</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowModal(true)}>
            <Text style={styles.emptyBtnText}>Add first note</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} style={styles.board}>
          <Text style={styles.hintText}>Tap to toggle done · Long press to delete</Text>
          <View style={styles.columns}>
            <View style={styles.column}>{col1.map(n => <StickyNote key={n.id} note={n} onToggle={toggleDeferred} onDelete={deleteDeferred} />)}</View>
            <View style={styles.column}>{col2.map(n => <StickyNote key={n.id} note={n} onToggle={toggleDeferred} onDelete={deleteDeferred} />)}</View>
          </View>
          <View style={{ height:100 }} />
        </ScrollView>
      )}

      <Modal visible={showModal} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowModal(false)}>
          <Pressable style={styles.modalSheet} onPress={()=>{}}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Pin a topic</Text>
            <TextInput style={styles.textInput} placeholder="What do you need to study later?"
              placeholderTextColor={COLORS.textMuted} value={text} onChangeText={setText}
              multiline numberOfLines={3} textAlignVertical="top" />

            <Text style={styles.fieldLabel}>Subject</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom:16 }}>
              <View style={{ flexDirection:'row', gap:8 }}>
                {SUBJECTS.map(s => (
                  <TouchableOpacity key={s}
                    style={[styles.chipBtn, subject===s && { backgroundColor:COLORS.accentGlow, borderColor:COLORS.accent }]}
                    onPress={() => setSubject(s)}>
                    <View style={[styles.chipDot, { backgroundColor: COLORS.subjects?.[s] || COLORS.accent }]} />
                    <Text style={[styles.chipText, subject===s && { color:COLORS.accentLight }]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={styles.fieldLabel}>Priority</Text>
            <View style={styles.priorityRow}>
              {['high','medium','low'].map(p => (
                <TouchableOpacity key={p}
                  style={[styles.priorityBtn, { borderColor:PRIORITY_COLORS[p] }, priority===p && { backgroundColor:PRIORITY_COLORS[p]+'33' }]}
                  onPress={() => setPriority(p)}>
                  <Text style={[styles.priorityBtnText, { color:PRIORITY_COLORS[p] }]}>{p.charAt(0).toUpperCase()+p.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Color</Text>
            <View style={styles.colorRow}>
              {STICKY_COLORS.map(c => (
                <TouchableOpacity key={c} style={[styles.colorCircle, { backgroundColor:c }, color===c && styles.colorCircleActive]}
                  onPress={() => setColor(c)}>
                  {color===c && <Ionicons name="checkmark" size={13} color="#1A1A2E" />}
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.addNoteBtn} onPress={handleAdd}>
              <Ionicons name="pin" size={18} color="#fff" />
              <Text style={styles.addNoteBtnText}>Pin Note</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex:1, backgroundColor:COLORS.bg },
  headerRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:16, paddingBottom:8 },
  pageTitle: { fontSize:FONTS.xl, fontWeight:'700', color:COLORS.textPrimary },
  subTitle:  { fontSize:FONTS.xs, color:COLORS.textSecondary, marginTop:2 },
  addBtn: { backgroundColor:COLORS.accent, width:42, height:42, borderRadius:21, alignItems:'center', justifyContent:'center', ...SHADOW.glow },
  filterRow: { flexDirection:'row', gap:8, paddingHorizontal:16, marginBottom:12 },
  filterPill: { paddingHorizontal:14, paddingVertical:6, borderRadius:20, borderWidth:1, borderColor:COLORS.border },
  filterPillActive: { backgroundColor:COLORS.accentGlow, borderColor:COLORS.accent },
  filterText: { fontSize:FONTS.xs, color:COLORS.textMuted, fontWeight:'500' },
  filterTextActive: { color:COLORS.accentLight },
  board: { flex:1, paddingHorizontal:12 },
  hintText: { fontSize:FONTS.xs, color:COLORS.textMuted, textAlign:'center', marginBottom:12 },
  columns: { flexDirection:'row', gap:8 },
  column:  { flex:1 },
  noteWrapper: { marginBottom:12 },
  note: { borderRadius:4, padding:14, minHeight:110, position:'relative', shadowColor:'#000', shadowOffset:{width:2,height:4}, shadowOpacity:0.35, shadowRadius:6, elevation:6 },
  priorityCorner: { position:'absolute', top:0, right:0, paddingHorizontal:7, paddingVertical:3, borderBottomLeftRadius:6, borderTopRightRadius:3 },
  priorityText: { fontSize:9, fontWeight:'800', color:'#fff', textTransform:'uppercase', letterSpacing:0.5 },
  pin: { alignItems:'center', marginBottom:6 },
  pinHead: { width:10, height:10, borderRadius:5, backgroundColor:'#c0392b', borderWidth:1, borderColor:'#922b21' },
  pinNeedle: { width:1.5, height:6, backgroundColor:'#7f8c8d', marginTop:-1 },
  noteText: { fontSize:FONTS.sm, fontWeight:'500', lineHeight:20, marginTop:4 },
  noteTextDone: { textDecorationLine:'line-through', opacity:0.6 },
  noteSubject: { fontSize:10, fontWeight:'600', marginTop:8, textTransform:'uppercase', letterSpacing:0.5 },
  doneStamp: { position:'absolute', bottom:8, right:8 },
  emptyState: { flex:1, alignItems:'center', justifyContent:'center', padding:40, gap:10 },
  emptyEmoji: { fontSize:48 },
  emptyTitle: { fontSize:FONTS.lg, fontWeight:'700', color:COLORS.textPrimary },
  emptyText:  { fontSize:FONTS.sm, color:COLORS.textSecondary, textAlign:'center', lineHeight:20 },
  emptyBtn:   { backgroundColor:COLORS.accent, paddingHorizontal:24, paddingVertical:12, borderRadius:RADIUS.md, marginTop:8 },
  emptyBtnText: { color:'#fff', fontWeight:'700', fontSize:FONTS.sm },
  modalOverlay: { flex:1, backgroundColor:'rgba(0,0,0,0.7)', justifyContent:'flex-end' },
  modalSheet: { backgroundColor:COLORS.surface, borderTopLeftRadius:24, borderTopRightRadius:24, padding:20, paddingBottom:40 },
  modalHandle: { width:40, height:4, backgroundColor:COLORS.border, borderRadius:2, alignSelf:'center', marginBottom:16 },
  modalTitle: { fontSize:FONTS.lg, fontWeight:'700', color:COLORS.textPrimary, marginBottom:14 },
  textInput: { backgroundColor:COLORS.bg, borderRadius:RADIUS.md, padding:12, color:COLORS.textPrimary, fontSize:FONTS.md, borderWidth:1, borderColor:COLORS.border, minHeight:80, marginBottom:16 },
  fieldLabel: { fontSize:FONTS.xs, color:COLORS.textSecondary, fontWeight:'600', marginBottom:8, textTransform:'uppercase', letterSpacing:0.5 },
  chipBtn: { flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:10, paddingVertical:6, borderRadius:20, borderWidth:1, borderColor:COLORS.border },
  chipDot: { width:7, height:7, borderRadius:3.5 },
  chipText: { fontSize:FONTS.xs, color:COLORS.textSecondary, fontWeight:'500' },
  priorityRow: { flexDirection:'row', gap:10, marginBottom:16 },
  priorityBtn: { flex:1, alignItems:'center', paddingVertical:9, borderRadius:RADIUS.md, borderWidth:1.5 },
  priorityBtnText: { fontSize:FONTS.sm, fontWeight:'700' },
  colorRow: { flexDirection:'row', gap:10, marginBottom:20 },
  colorCircle: { width:32, height:32, borderRadius:16, alignItems:'center', justifyContent:'center', borderWidth:2, borderColor:'transparent' },
  colorCircleActive: { borderColor:'#fff', transform:[{scale:1.15}] },
  addNoteBtn: { backgroundColor:COLORS.accent, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, padding:14, borderRadius:RADIUS.md },
  addNoteBtnText: { color:'#fff', fontSize:FONTS.md, fontWeight:'700' },
});
