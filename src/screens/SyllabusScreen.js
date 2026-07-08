import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView,
  TextInput, Modal, Pressable, Alert, LayoutAnimation, Platform, UIManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';
import { COLORS, FONTS, RADIUS, SHADOW } from '../utils/theme';
import { GOAL_COLORS } from '../data/subjects';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental)
  UIManager.setLayoutAnimationEnabledExperimental(true);

// ── Topic card with subtopics ────────────────────────────────────────────────
function TopicCard({ topic, subjectColor, onToggle, onDelete, onAddSubtopic, onDeleteSubtopic }) {
  const [expanded, setExpanded] = useState(false);
  const [addingSub, setAddingSub] = useState(false);
  const [newSub, setNewSub] = useState('');

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(e => !e);
  };

  const handleAddSub = () => {
    if (newSub.trim()) { onAddSubtopic(newSub.trim()); setNewSub(''); setAddingSub(false); }
  };

  return (
    <View style={styles.topicCard}>
      <View style={styles.topicMain}>
        {/* Checkbox */}
        <TouchableOpacity onPress={onToggle}
          style={[styles.checkbox, topic.done && { backgroundColor: subjectColor, borderColor: subjectColor }]}>
          {topic.done && <Ionicons name="checkmark" size={11} color="#fff" />}
        </TouchableOpacity>

        {/* Topic text */}
        <TouchableOpacity style={{ flex:1 }} onPress={toggle}>
          <Text style={[styles.topicText, topic.done && styles.topicDone]} numberOfLines={2}>
            {topic.topic}
          </Text>
          {(topic.subtopics || []).length > 0 && (
            <Text style={styles.subCount}>{topic.subtopics.length} subtopics</Text>
          )}
        </TouchableOpacity>

        {/* Expand arrow */}
        <TouchableOpacity onPress={toggle} style={styles.expandBtn}>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={15} color={COLORS.textMuted} />
        </TouchableOpacity>

        {/* Delete topic */}
        <TouchableOpacity onPress={onDelete} style={styles.deleteBtn} hitSlop={{top:8,right:8,bottom:8,left:4}}>
          <Ionicons name="close" size={15} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Subtopics panel */}
      {expanded && (
        <View style={styles.subtopicsPanel}>
          {(topic.subtopics || []).map((sub, i) => (
            <View key={i} style={styles.subtopicRow}>
              <View style={[styles.subtopicBullet, { backgroundColor: subjectColor }]} />
              <Text style={styles.subtopicText} numberOfLines={2}>{sub}</Text>
              <TouchableOpacity onPress={() => onDeleteSubtopic(i)} hitSlop={{top:6,right:6,bottom:6,left:6}}>
                <Ionicons name="close" size={13} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
          ))}

          {addingSub ? (
            <View style={styles.addSubRow}>
              <TextInput
                style={styles.addSubInput}
                placeholder="Add subtopic..."
                placeholderTextColor={COLORS.textMuted}
                value={newSub}
                onChangeText={setNewSub}
                autoFocus
                onSubmitEditing={handleAddSub}
              />
              <TouchableOpacity onPress={handleAddSub}>
                <Ionicons name="checkmark" size={18} color={COLORS.green} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setAddingSub(false); setNewSub(''); }}>
                <Ionicons name="close" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.addSubBtn} onPress={() => setAddingSub(true)}>
              <Ionicons name="add" size={14} color={subjectColor} />
              <Text style={[styles.addSubBtnText, { color: subjectColor }]}>Add subtopic</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

// ── Subject card ─────────────────────────────────────────────────────────────
function SubjectCard({ subject, topics, onToggle, onAddTopic, onDeleteTopic, onDeleteSubject, onAddSubtopic, onDeleteSubtopic, filter, onLongPress }) {
  const [expanded, setExpanded] = useState(false);
  const [addingTopic, setAddingTopic] = useState(false);
  const [newTopic, setNewTopic] = useState('');
  const color = COLORS.subjects?.[subject] || COLORS.accent;
  const done = topics.filter(t => t.done).length;
  const pct  = topics.length ? Math.round(done / topics.length * 100) : 0;

  const handleAddTopic = () => {
    if (newTopic.trim()) { onAddTopic(newTopic.trim()); setNewTopic(''); setAddingTopic(false); }
  };

  const handleDelete = () => Alert.alert(
    'Delete Subject',
    `Delete "${subject}" and all its topics?`,
    [{ text:'Cancel', style:'cancel' }, { text:'Delete', style:'destructive', onPress: () => onDeleteSubject(subject) }]
  );

  const visibleTopics = filter === 'pending' ? topics.filter(t => !t.done)
    : filter === 'done' ? topics.filter(t => t.done) : topics;

  return (
    <View style={[styles.subjectCard, SHADOW.card]}>
      <TouchableOpacity style={styles.cardHeader} 
        onPress={() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setExpanded(e => !e);
        }}
        onLongPress={onLongPress}
      >
        <View style={[styles.subjectIcon, { backgroundColor: color + '22' }]}>
          <View style={[styles.subjectIconDot, { backgroundColor: color }]} />
        </View>
        <View style={{ flex:1 }}>
          <Text style={styles.subjectName}>{subject}</Text>
          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width:`${pct}%`, backgroundColor:color }]} />
            </View>
            <Text style={[styles.progressPct, { color }]}>{pct}%</Text>
          </View>
        </View>
        <Text style={styles.doneCount}>{done}/{topics.length}</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteSubjectBtn} hitSlop={{top:10,right:10,bottom:10,left:6}}>
          <Ionicons name="trash-outline" size={14} color={COLORS.textMuted} />
        </TouchableOpacity>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={17} color={COLORS.textSecondary} />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.topicList}>
          {visibleTopics.length === 0 && (
            <Text style={styles.emptyTopics}>{filter !== 'all' ? 'No topics match filter.' : 'No topics yet — add one below.'}</Text>
          )}
          {visibleTopics.map(t => (
            <TopicCard
              key={t.id}
              topic={t}
              subjectColor={color}
              onToggle={() => onToggle(t.id)}
              onDelete={() => onDeleteTopic(t.id)}
              onAddSubtopic={(sub) => onAddSubtopic(t.id, sub)}
              onDeleteSubtopic={(i) => onDeleteSubtopic(t.id, i)}
            />
          ))}

          {addingTopic ? (
            <View style={styles.addTopicRow}>
              <TextInput
                style={styles.addTopicInput}
                placeholder="New topic..."
                placeholderTextColor={COLORS.textMuted}
                value={newTopic}
                onChangeText={setNewTopic}
                autoFocus
                onSubmitEditing={handleAddTopic}
              />
              <TouchableOpacity onPress={handleAddTopic}>
                <Ionicons name="checkmark" size={18} color={COLORS.green} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setAddingTopic(false); setNewTopic(''); }}>
                <Ionicons name="close" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.addTopicBtn} onPress={() => setAddingTopic(true)}>
              <Ionicons name="add" size={15} color={COLORS.textMuted} />
              <Text style={styles.addTopicBtnText}>Add topic</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

// ── Main screen ──────────────────────────────────────────────────────────────
export default function SyllabusScreen() {
  const insets = useSafeAreaInsets();
  const {
    syllabus, goals, activeGoalId,
    toggleTopic, addCustomTopic, deleteTopic, deleteSubject, addSubject,
    addSubtopic, deleteSubtopic,
    addGoal, deleteGoal, setActiveGoal, addSubjectToGoal, removeSubjectFromGoal,
  } = useStore();

  const [filter, setFilter]           = useState('all');
  const [viewGoalId, setViewGoalId]   = useState(null); // filter subjects by goal
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [showAddGoal, setShowAddGoal]   = useState(false);
  const [newGoalName, setNewGoalName]   = useState('');
  const [newGoalColor, setNewGoalColor] = useState(GOAL_COLORS[0]);

  const allSubjects = Object.keys(syllabus);

  const visibleSubjects = viewGoalId
    ? (goals.find(g => g.id === viewGoalId)?.subjects || []).filter(s => syllabus[s])
    : allSubjects;

  const totalTopics = visibleSubjects.reduce((a, s) => a + (syllabus[s]?.length || 0), 0);
  const totalDone   = visibleSubjects.reduce((a, s) => a + (syllabus[s]?.filter(t => t.done).length || 0), 0);
  const overallPct  = totalTopics ? Math.round(totalDone / totalTopics * 100) : 0;

  const handleAddSubject = () => {
    const name = newSubjectName.trim();
    if (!name) return;
    addSubject(name);
    // If currently filtering by a goal, also assign this subject to that goal
    if (viewGoalId) {
      addSubjectToGoal(viewGoalId, name);
    }
    setNewSubjectName('');
    setShowAddSubject(false);
  };
  const handleAddGoal = () => {
    if (newGoalName.trim()) { addGoal(newGoalName.trim(), newGoalColor); setNewGoalName(''); setNewGoalColor(GOAL_COLORS[0]); setShowAddGoal(false); }
  };

  const handleSubjectLongPress = (subject) => {
    const targetGoalId = viewGoalId || activeGoalId;
    if (!targetGoalId) return;
    const targetGoal = goals.find(g => g.id === targetGoalId);
    if (!targetGoal) return;
    const isAssigned = (targetGoal.subjects || []).includes(subject);

    Alert.alert(
      isAssigned ? 'Remove Subject' : 'Assign Subject',
      isAssigned
        ? `Remove "${subject}" from "${targetGoal.name}" goal?`
        : `Assign "${subject}" to "${targetGoal.name}" goal?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isAssigned ? 'Remove' : 'Assign',
          style: isAssigned ? 'destructive' : 'default',
          onPress: () => {
            if (isAssigned) {
              removeSubjectFromGoal(targetGoalId, subject);
            } else {
              addSubjectToGoal(targetGoalId, subject);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Title row */}
        <View style={styles.titleRow}>
          <Text style={styles.pageTitle}>Syllabus & Goals</Text>
          <TouchableOpacity style={styles.addSubjectBtn} onPress={() => setShowAddSubject(true)}>
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Goals bar */}
        <View style={styles.goalsSection}>
          <View style={styles.goalsTitleRow}>
            <Text style={styles.goalsLabel}>GOALS</Text>
            <TouchableOpacity style={styles.addGoalBtn} onPress={() => setShowAddGoal(true)}>
              <Ionicons name="add" size={13} color={COLORS.accent} />
              <Text style={styles.addGoalText}>New goal</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection:'row', gap:8, paddingBottom:4 }}>
              <TouchableOpacity
                style={[styles.goalChip, !viewGoalId && styles.goalChipActive]}
                onPress={() => setViewGoalId(null)}>
                <Text style={[styles.goalChipText, !viewGoalId && { color:COLORS.accentLight }]}>All</Text>
              </TouchableOpacity>
              {goals.map(g => (
                <TouchableOpacity
                  key={g.id}
                  style={[styles.goalChip, viewGoalId === g.id && { backgroundColor: g.color+'22', borderColor:g.color }]}
                  onPress={() => setViewGoalId(viewGoalId === g.id ? null : g.id)}
                  onLongPress={() => Alert.alert(`Delete "${g.name}"?`, '', [
                    { text:'Cancel', style:'cancel' },
                    { text:'Delete', style:'destructive', onPress:() => { deleteGoal(g.id); if (viewGoalId===g.id) setViewGoalId(null); }},
                  ])}
                >
                  <View style={[styles.goalDot, { backgroundColor:g.color }]} />
                  <Text style={[styles.goalChipText, viewGoalId===g.id && { color:g.color }]}>{g.name}</Text>
                </TouchableOpacity>
              ))}
              {goals.length === 0 && <Text style={styles.noGoalsHint}>Add goals like "GATE 2026", "C-DAC"...</Text>}
            </View>
          </ScrollView>
        </View>

        {/* Overall progress card */}
        <View style={[styles.overallCard, SHADOW.glow]}>
          <Text style={styles.overallLabel}>{viewGoalId ? goals.find(g=>g.id===viewGoalId)?.name : 'Overall'}</Text>
          <Text style={styles.overallPct}>{overallPct}%</Text>
          <View style={styles.overallTrack}>
            <View style={[styles.overallFill, { width:`${overallPct}%` }]} />
          </View>
          <Text style={styles.overallSub}>{totalDone} of {totalTopics} topics done</Text>
        </View>

        {/* Filter pills */}
        <View style={styles.filterRow}>
          {['all','pending','done'].map(f => (
            <TouchableOpacity key={f} style={[styles.filterPill, filter===f && styles.filterPillActive]} onPress={() => setFilter(f)}>
              <Text style={[styles.filterText, filter===f && styles.filterTextActive]}>
                {f.charAt(0).toUpperCase()+f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Subject cards */}
        {visibleSubjects.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="book-outline" size={36} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>
              {viewGoalId ? 'No subjects in this goal.\nLong-press a subject name to assign it.' : 'No subjects yet.'}
            </Text>
          </View>
        ) : visibleSubjects.map(subject => (
          <SubjectCard
            key={subject}
            subject={subject}
            topics={syllabus[subject] || []}
            filter={filter}
            onToggle={id => toggleTopic(subject, id)}
            onAddTopic={name => addCustomTopic(subject, name)}
            onDeleteTopic={id => deleteTopic(subject, id)}
            onDeleteSubject={deleteSubject}
            onAddSubtopic={(topicId, sub) => addSubtopic(subject, topicId, sub)}
            onDeleteSubtopic={(topicId, i) => deleteSubtopic(subject, topicId, i)}
            onLongPress={() => handleSubjectLongPress(subject)}
          />
        ))}

        <View style={{ height:100 }} />
      </ScrollView>

      {/* Add Subject Modal */}
      <Modal visible={showAddSubject} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowAddSubject(false)}>
          <Pressable style={styles.modalSheet} onPress={()=>{}}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Add Subject</Text>
            {viewGoalId && (
              <Text style={styles.modalHint}>
                Will be added to {goals.find(g=>g.id===viewGoalId)?.name} goal
              </Text>
            )}
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Machine Learning, MPSC History..."
              placeholderTextColor={COLORS.textMuted}
              value={newSubjectName}
              onChangeText={setNewSubjectName}
              autoFocus
              onSubmitEditing={handleAddSubject}
            />
            <TouchableOpacity style={styles.modalBtn} onPress={handleAddSubject}>
              <Text style={styles.modalBtnText}>Add Subject</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Add Goal Modal */}
      <Modal visible={showAddGoal} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowAddGoal(false)}>
          <Pressable style={styles.modalSheet} onPress={()=>{}}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>New Goal</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. GATE 2026, C-DAC, MPSC, Learn AI/ML..."
              placeholderTextColor={COLORS.textMuted}
              value={newGoalName}
              onChangeText={setNewGoalName}
              autoFocus
            />
            <Text style={styles.colorLabel}>Color</Text>
            <View style={styles.colorRow}>
              {GOAL_COLORS.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.colorCircle, { backgroundColor:c }, newGoalColor===c && styles.colorCircleActive]}
                  onPress={() => setNewGoalColor(c)}>
                  {newGoalColor===c && <Ionicons name="checkmark" size={13} color="#fff" />}
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor:newGoalColor }]} onPress={handleAddGoal}>
              <Text style={styles.modalBtnText}>Create Goal</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex:1, backgroundColor:COLORS.bg },
  titleRow: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding:16, paddingBottom:10 },
  pageTitle: { fontSize:FONTS.xl, fontWeight:'700', color:COLORS.textPrimary },
  addSubjectBtn: { backgroundColor:COLORS.accent, width:36, height:36, borderRadius:18, alignItems:'center', justifyContent:'center' },
  goalsSection: { paddingHorizontal:16, marginBottom:12 },
  goalsTitleRow: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:8 },
  goalsLabel: { fontSize:10, fontWeight:'700', color:COLORS.textMuted, letterSpacing:1 },
  addGoalBtn: { flexDirection:'row', alignItems:'center', gap:3 },
  addGoalText: { fontSize:FONTS.xs, color:COLORS.accent, fontWeight:'600' },
  goalChip: { flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:12, paddingVertical:6, borderRadius:20, borderWidth:1, borderColor:COLORS.border },
  goalChipActive: { backgroundColor:COLORS.accentGlow, borderColor:COLORS.accent },
  goalChipText: { fontSize:FONTS.xs, color:COLORS.textSecondary, fontWeight:'600' },
  goalDot: { width:7, height:7, borderRadius:3.5 },
  noGoalsHint: { fontSize:FONTS.xs, color:COLORS.textMuted, fontStyle:'italic', alignSelf:'center' },
  overallCard: { backgroundColor:COLORS.card, borderRadius:RADIUS.xl, margin:16, marginTop:0, padding:20, borderWidth:1, borderColor:COLORS.border, alignItems:'center' },
  overallLabel: { fontSize:FONTS.sm, color:COLORS.textSecondary, fontWeight:'600', marginBottom:4 },
  overallPct: { fontSize:52, fontWeight:'200', color:COLORS.accentLight, letterSpacing:-2 },
  overallTrack: { width:'100%', height:6, backgroundColor:COLORS.border, borderRadius:3, overflow:'hidden', marginVertical:12 },
  overallFill: { height:'100%', backgroundColor:COLORS.accent, borderRadius:3 },
  overallSub: { fontSize:FONTS.xs, color:COLORS.textSecondary },
  filterRow: { flexDirection:'row', gap:8, paddingHorizontal:16, marginBottom:12 },
  filterPill: { paddingHorizontal:14, paddingVertical:6, borderRadius:20, borderWidth:1, borderColor:COLORS.border },
  filterPillActive: { backgroundColor:COLORS.accentGlow, borderColor:COLORS.accent },
  filterText: { fontSize:FONTS.sm, color:COLORS.textMuted, fontWeight:'500' },
  filterTextActive: { color:COLORS.accentLight },
  subjectCard: { backgroundColor:COLORS.card, borderRadius:RADIUS.lg, marginHorizontal:16, marginBottom:10 },
  cardHeader: { flexDirection:'row', alignItems:'center', padding:14, gap:10 },
  subjectIcon: { width:34, height:34, borderRadius:17, alignItems:'center', justifyContent:'center' },
  subjectIconDot: { width:9, height:9, borderRadius:4.5 },
  subjectName: { fontSize:FONTS.sm, fontWeight:'700', color:COLORS.textPrimary, marginBottom:4 },
  progressRow: { flexDirection:'row', alignItems:'center', gap:8 },
  progressTrack: { flex:1, height:4, backgroundColor:COLORS.border, borderRadius:2, overflow:'hidden' },
  progressFill: { height:'100%', borderRadius:2 },
  progressPct: { fontSize:FONTS.xs, fontWeight:'600', minWidth:26 },
  doneCount: { fontSize:FONTS.xs, color:COLORS.textMuted, fontWeight:'500' },
  deleteSubjectBtn: { padding:4 },
  topicList: { borderTopWidth:1, borderTopColor:COLORS.border, paddingHorizontal:14, paddingBottom:10 },
  emptyTopics: { fontSize:FONTS.xs, color:COLORS.textMuted, paddingVertical:10, textAlign:'center' },
  // Topic card
  topicCard: { borderBottomWidth:1, borderBottomColor:COLORS.border+'55', paddingVertical:8 },
  topicMain: { flexDirection:'row', alignItems:'flex-start', gap:8 },
  checkbox: { width:17, height:17, borderRadius:4, borderWidth:1.5, borderColor:COLORS.border, alignItems:'center', justifyContent:'center', marginTop:2 },
  topicText: { fontSize:FONTS.sm, color:COLORS.textSecondary, lineHeight:20 },
  topicDone: { color:COLORS.textMuted, textDecorationLine:'line-through' },
  subCount: { fontSize:10, color:COLORS.textMuted, marginTop:2 },
  expandBtn: { padding:4, marginTop:1 },
  deleteBtn: { padding:4, marginTop:1 },
  // Subtopics
  subtopicsPanel: { marginLeft:25, marginTop:6, paddingLeft:10, borderLeftWidth:2, borderLeftColor:COLORS.border },
  subtopicRow: { flexDirection:'row', alignItems:'flex-start', gap:7, paddingVertical:4 },
  subtopicBullet: { width:5, height:5, borderRadius:2.5, marginTop:6 },
  subtopicText: { flex:1, fontSize:FONTS.xs, color:COLORS.textSecondary, lineHeight:18 },
  addSubRow: { flexDirection:'row', alignItems:'center', gap:8, paddingTop:6 },
  addSubInput: { flex:1, backgroundColor:COLORS.bg, borderRadius:RADIUS.sm, padding:7, color:COLORS.textPrimary, fontSize:FONTS.xs, borderWidth:1, borderColor:COLORS.border },
  addSubBtn: { flexDirection:'row', alignItems:'center', gap:4, paddingVertical:6 },
  addSubBtnText: { fontSize:FONTS.xs, fontWeight:'600' },
  // Add topic
  addTopicRow: { flexDirection:'row', alignItems:'center', gap:8, paddingTop:8 },
  addTopicInput: { flex:1, backgroundColor:COLORS.bg, borderRadius:RADIUS.sm, padding:9, color:COLORS.textPrimary, fontSize:FONTS.sm, borderWidth:1, borderColor:COLORS.border },
  addTopicBtn: { flexDirection:'row', alignItems:'center', gap:4, paddingVertical:8 },
  addTopicBtnText: { fontSize:FONTS.xs, color:COLORS.textMuted },
  emptyState: { alignItems:'center', padding:40, gap:10 },
  emptyText: { fontSize:FONTS.sm, color:COLORS.textMuted, textAlign:'center', lineHeight:20 },
  // Modals
  modalOverlay: { flex:1, backgroundColor:'rgba(0,0,0,0.7)', justifyContent:'flex-end' },
  modalSheet: { backgroundColor:COLORS.surface, borderTopLeftRadius:24, borderTopRightRadius:24, padding:20, paddingBottom:40 },
  modalHandle: { width:40, height:4, backgroundColor:COLORS.border, borderRadius:2, alignSelf:'center', marginBottom:16 },
  modalTitle: { fontSize:FONTS.lg, fontWeight:'700', color:COLORS.textPrimary, marginBottom:14 },
  modalInput: { backgroundColor:COLORS.bg, borderRadius:RADIUS.md, padding:13, color:COLORS.textPrimary, fontSize:FONTS.md, borderWidth:1, borderColor:COLORS.border, marginBottom:16 },
  colorLabel: { fontSize:FONTS.xs, color:COLORS.textSecondary, fontWeight:'600', marginBottom:10, textTransform:'uppercase', letterSpacing:0.5 },
  colorRow: { flexDirection:'row', gap:10, marginBottom:20 },
  colorCircle: { width:32, height:32, borderRadius:16, alignItems:'center', justifyContent:'center', borderWidth:2, borderColor:'transparent' },
  colorCircleActive: { borderColor:'#fff', transform:[{ scale:1.15 }] },
  modalHint: { fontSize:FONTS.xs, color:COLORS.accent, fontWeight:'600', marginBottom:10 },
  modalBtn: { backgroundColor:COLORS.accent, padding:14, borderRadius:RADIUS.md, alignItems:'center' },
  modalBtnText: { color:'#fff', fontWeight:'700', fontSize:FONTS.md },
});
