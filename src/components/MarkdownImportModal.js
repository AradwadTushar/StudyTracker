import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS } from '../utils/theme';

export default function MarkdownImportModal({ visible, onClose, onApply }) {
  const [mdText, setMdText] = useState('');

  const handleApply = () => {
    if (mdText.trim()) {
      onApply(mdText.trim());
      setMdText('');
      onClose();
    }
  };

  const handleClose = () => {
    setMdText('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.sheet}>

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Import Markdown</Text>
              <Text style={styles.subtitle}>Paste notes from Gemini, ChatGPT, Notion etc.</Text>
            </View>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Paste area */}
          <TextInput
            style={styles.input}
            placeholder={"## Heading\n**bold**, *italic*\n- bullet point\n\nPaste anything here..."}
            placeholderTextColor={COLORS.textMuted}
            value={mdText}
            onChangeText={setMdText}
            multiline
            textAlignVertical="top"
            autoFocus
          />

          {/* Supported syntax hint */}
          <View style={styles.hintRow}>
            {['## H1/H2', '**bold**', '*italic*', '- list', '```code```'].map(h => (
              <View key={h} style={styles.hintChip}>
                <Text style={styles.hintText}>{h}</Text>
              </View>
            ))}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.applyBtn, !mdText.trim() && styles.applyBtnDisabled]}
              onPress={handleApply}
              disabled={!mdText.trim()}
            >
              <Ionicons name="checkmark" size={16} color="#fff" />
              <Text style={styles.applyText}>Apply to Editor</Text>
            </TouchableOpacity>
          </View>

        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 14,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: FONTS.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: FONTS.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  input: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: 12,
    color: COLORS.textPrimary,
    fontSize: FONTS.sm,
    minHeight: 180,
    maxHeight: 280,
    lineHeight: 22,
  },
  hintRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  hintChip: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  hintText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  cancelText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontSize: FONTS.sm,
  },
  applyBtn: {
    flex: 2,
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnDisabled: {
    opacity: 0.4,
  },
  applyText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: FONTS.sm,
  },
});