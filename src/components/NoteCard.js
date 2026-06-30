import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, SHADOW } from '../utils/theme';

const stripHtml = (html) => {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export default function NoteCard({ note, onPress, onDelete }) {
  const color = COLORS.subjects?.[note.subject] || COLORS.accent;
  
  const updated = note.updatedAt 
    ? new Date(note.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    : '';

  const textPreview = stripHtml(note.content);

  return (
    <TouchableOpacity style={[styles.noteCard, SHADOW.card]} onPress={() => onPress(note)}>
      <View style={[styles.noteAccent, { backgroundColor: color }]} />
      <View style={{ flex: 1, padding: 14 }}>
        <View style={styles.noteCardHeader}>
          <Text style={styles.noteTitle} numberOfLines={1}>
            {note.title || 'Untitled'}
          </Text>
          <TouchableOpacity 
            onPress={() => onDelete(note.id)} 
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <Ionicons name="trash-outline" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {textPreview ? (
          <Text style={styles.notePreview} numberOfLines={3}>
            {textPreview}
          </Text>
        ) : null}

        <View style={styles.noteCardFooter}>
          <View style={[styles.subjectBadge, { backgroundColor: color + '22' }]}>
            <Text style={[styles.subjectBadgeText, { color }]}>{note.subject}</Text>
          </View>
          <Text style={styles.noteDate}>{updated}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  noteCard: { 
    flexDirection: 'row', 
    backgroundColor: COLORS.card, 
    borderRadius: RADIUS.lg, 
    marginBottom: 10, 
    overflow: 'hidden' 
  },
  noteAccent: { width: 4 },
  noteCardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 },
  noteTitle: { flex: 1, fontSize: FONTS.md, fontWeight: '700', color: COLORS.textPrimary, marginRight: 8 },
  notePreview: { fontSize: FONTS.sm, color: COLORS.textSecondary, lineHeight: 19, marginBottom: 10 },
  noteCardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  subjectBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  subjectBadgeText: { fontSize: 10, fontWeight: '600' },
  noteDate: { fontSize: FONTS.xs, color: COLORS.textMuted },
});