import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  Alert 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore'; 
import NoteCard from '../components/NoteCard';
import RichNoteEditor from '../components/RichNoteEditor';
import { COLORS, FONTS, RADIUS, SHADOW } from '../utils/theme';
import { SUBJECTS } from '../data/subjects';

export default function NotesScreen() {
  const insets = useSafeAreaInsets();
  const { notes, addNote, updateNote, deleteNote } = useStore();
  
  const [editing, setEditing] = useState(null);
  const [isNew, setIsNew] = useState(false);
  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState(null);

  // Integrated Title + Content search filters 
  const filtered = useMemo(() => {
    return notes.filter(n => {
      const matchSearch = !search || 
        (n.title && n.title.toLowerCase().includes(search.toLowerCase())) || 
        (n.content && n.content.toLowerCase().includes(search.toLowerCase()));
        
      const matchSubject = !filterSubject || n.subject === filterSubject;
      return matchSearch && matchSubject;
    });
  }, [notes, search, filterSubject]);

  const usedSubjects = useMemo(() => {
    return [...new Set(notes.map(n => n.subject).filter(Boolean))];
  }, [notes]);

  const handleDeleteConfirmation = (id) => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to permanently delete this study note?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteNote(id) }
      ]
    );
  };

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <View style={styles.headerRow}>
        <Text style={styles.pageTitle}>Notes</Text>
        <TouchableOpacity 
          style={styles.addBtn} 
          onPress={() => { setEditing({ title: '', content: '', subject: SUBJECTS[0] }); setIsNew(true); }}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={16} color={COLORS.textMuted} style={{ marginLeft: 12 }} />
        <TextInput 
          style={styles.searchInput} 
          placeholder="Search notes..." 
          placeholderTextColor={COLORS.textMuted}
          value={search} 
          onChangeText={setSearch} 
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')} style={{ marginRight: 10 }}>
            <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Track Filter Tabs — Fixed layout structure to prevent vertical stretching */}
      {usedSubjects.length > 0 && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.subjectFilter}
          contentContainerStyle={styles.subjectFilterContent}
        >
          <TouchableOpacity 
            style={[styles.filterChip, !filterSubject && styles.filterChipActive]} 
            onPress={() => setFilterSubject(null)}
          >
            <Text style={[styles.filterChipText, !filterSubject && styles.filterChipTextActive]}>All</Text>
          </TouchableOpacity>
          {usedSubjects.map(s => (
            <TouchableOpacity 
              key={s} 
              style={[styles.filterChip, filterSubject === s && styles.filterChipActive]}
              onPress={() => setFilterSubject(filterSubject === s ? null : s)}
            >
              <View style={[{ width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.subjects?.[s] || COLORS.accent }]} />
              <Text style={[styles.filterChipText, filterSubject === s && styles.filterChipTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Main Stream Flat Scroll Interface */}
      <ScrollView showsVerticalScrollIndicator={false} style={styles.list}>
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={40} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>{notes.length === 0 ? 'No notes yet' : 'No results'}</Text>
            <Text style={styles.emptyText}>
              {notes.length === 0 ? 'Jot down key concepts, formulas, or exam tricks.' : 'Try a different search.'}
            </Text>
            {notes.length === 0 && (
              <TouchableOpacity 
                style={styles.emptyBtn} 
                onPress={() => { setEditing({ title: '', content: '', subject: SUBJECTS[0] }); setIsNew(true); }}
              >
                <Text style={styles.emptyBtnText}>Write first note</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filtered.map(note => (
            <NoteCard 
              key={note.id} 
              note={note}
              onPress={n => { setEditing(n); setIsNew(false); }}
              onDelete={handleDeleteConfirmation} 
            />
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Modal Rich Text Canvas Overlays */}
      <Modal 
        visible={!!editing} 
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setEditing(null)}
      >
        {editing && (
          <RichNoteEditor 
            note={editing} 
            onClose={() => setEditing(null)}
            onSave={(title, content, subject) => {
              if (isNew) addNote(title, content, subject);
              else updateNote(editing.id, title, content, subject);
            }} 
          />
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 10 },
  pageTitle: { fontSize: FONTS.xl, fontWeight: '700', color: COLORS.textPrimary },
  addBtn: { backgroundColor: COLORS.accent, width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', ...SHADOW.glow },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: RADIUS.md, marginHorizontal: 16, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  searchInput: { flex: 1, padding: 10, color: COLORS.textPrimary, fontSize: FONTS.sm },
  
  // Fixed ScrollView container sizing limits
  subjectFilter: { 
    maxHeight: 46, 
    marginBottom: 12,
  },
  subjectFilterContent: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterChip: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    height: 34,
    paddingHorizontal: 14, 
    borderRadius: 17, 
    borderWidth: 1, 
    borderColor: COLORS.border,
    backgroundColor: COLORS.card
  },
  filterChipActive: { backgroundColor: COLORS.accentGlow, borderColor: COLORS.accent },
  filterChipText: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600' },
  filterChipTextActive: { color: COLORS.accentLight },
  
  list: { flex: 1, paddingHorizontal: 16 },
  emptyState: { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyTitle: { fontSize: FONTS.lg, fontWeight: '700', color: COLORS.textPrimary },
  emptyText: { fontSize: FONTS.sm, color: COLORS.textSecondary, textAlign: 'center' },
  emptyBtn: { backgroundColor: COLORS.accent, paddingHorizontal: 24, paddingVertical: 12, borderRadius: RADIUS.md, marginTop: 8 },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: FONTS.sm },
});