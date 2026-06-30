import React, { useRef, useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert
} from 'react-native';
import { RichEditor } from 'react-native-pell-rich-editor';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { marked } from 'marked';
import EditorToolbar from './EditorToolbar';
import MarkdownImportModal from './MarkdownImportModal';
import { COLORS, FONTS, RADIUS } from '../utils/theme';
import { SUBJECTS } from '../data/subjects';

export default function RichNoteEditor({ note, onSave, onClose }) {
  const richTextRef = useRef();
  const insets = useSafeAreaInsets();
  
  const [title, setTitle] = useState(note?.title || '');
  const [subject, setSubject] = useState(note?.subject || SUBJECTS[0]);
  const [showSubs, setShowSubs] = useState(false);
  const [showMdModal, setShowMdModal] = useState(false);
  const contentRef = useRef(note?.content || '');

  const handleContentChange = (html) => {
    contentRef.current = html;
  };

  const handleApplyMarkdown = (mdText) => {
    const html = marked.parse(mdText);
    richTextRef.current?.setContentHTML(html);
    contentRef.current = html;
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Denied', 'StudyTracker needs media permissions to insert study diagrams.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      const selectedImage = result.assets[0];
      const embeddedHtml = `data:${selectedImage.mimeType || 'image/jpeg'};base64,${selectedImage.base64}`;
      richTextRef.current?.insertImage(embeddedHtml);
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please add a note title.');
      return;
    }
    onSave(title.trim(), contentRef.current, subject);
    onClose();
  };

  return (
    <View style={[styles.editorSafe, { paddingTop: insets.top }]}>

      {/* Header — sticky outside scroll */}
      <View style={styles.editorHeader}>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={22} color={COLORS.textSecondary} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.subjectPill} onPress={() => setShowSubs(s => !s)}>
          <View style={[styles.subjectDot, { backgroundColor: COLORS.subjects?.[subject] || COLORS.accent }]} />
          <Text style={styles.subjectPillText}>{subject}</Text>
          <Ionicons name="chevron-down" size={12} color={COLORS.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* Subject strip */}
      {showSubs && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subjectStrip}>
          <View style={{ flexDirection: 'row', gap: 8, padding: 8 }}>
            {SUBJECTS.map(s => (
              <TouchableOpacity 
                key={s}
                style={[styles.subChip, subject === s && { backgroundColor: COLORS.accentGlow, borderColor: COLORS.accent }]}
                onPress={() => { setSubject(s); setShowSubs(false); }}
              >
                <View style={[{ width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.subjects?.[s] || COLORS.accent }]} />
                <Text style={[styles.subChipText, subject === s && { color: COLORS.accentLight }]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Toolbar — sticky outside scroll */}
      <EditorToolbar
        editorRef={richTextRef}
        onInsertImage={pickImage}
        onPasteMarkdown={() => setShowMdModal(true)}
      />

      {/* KeyboardAwareScrollView — replaces KeyboardAvoidingView + ScrollView combo */}
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        enableOnAndroid={true}
        extraScrollHeight={20}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.metaInputWrapper}>
          <TextInput 
            style={styles.titleInput} 
            placeholder="Note title..." 
            placeholderTextColor={COLORS.textMuted}
            value={title} 
            onChangeText={setTitle} 
            multiline 
          />
        </View>

        <RichEditor
          ref={richTextRef}
          editorInitializedCallback={() => console.log("Editor initialized")}
          initialContentHTML={note?.content || ''}
          onChange={handleContentChange}
          placeholder="Write your notes here..."
          editorStyle={{
            backgroundColor: COLORS.bg,
            color: COLORS.textPrimary,
            placeholderColor: COLORS.textMuted,
            cssText: `
              body { background-color: ${COLORS.bg}; }
              pre {
                background: #1E1E1E !important;
                color: #F8F8F2 !important;
                padding: 12px !important;
                border-radius: 8px !important;
                overflow: auto !important;
                font-family: monospace !important;
                font-size: 13px !important;
                white-space: pre-wrap !important;
              }
              code { color: #F8F8F2 !important; font-family: monospace !important; }
            `,
            contentCSSText: `
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              font-size: ${FONTS.md}px;
              line-height: 1.6;
            `,
          }}
          style={styles.editorElement}
          useContainer={false}
          scrollEnabled={false}
        />
      </KeyboardAwareScrollView>

      {/* Markdown import bottom sheet */}
      <MarkdownImportModal
        visible={showMdModal}
        onClose={() => setShowMdModal(false)}
        onApply={handleApplyMarkdown}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  editorSafe: { flex: 1, backgroundColor: COLORS.bg },
  editorHeader: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: 10, backgroundColor: COLORS.bg },
  subjectPill: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.card, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border },
  subjectDot: { width: 8, height: 8, borderRadius: 4 },
  subjectPillText: { fontSize: FONTS.xs, color: COLORS.textSecondary, fontWeight: '500', flex: 1 },
  saveBtn: { backgroundColor: COLORS.accent, paddingHorizontal: 18, paddingVertical: 8, borderRadius: RADIUS.md },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: FONTS.sm },
  subjectStrip: { borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.surface },
  subChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border },
  subChipText: { fontSize: FONTS.xs, color: COLORS.textSecondary, fontWeight: '500' },
  metaInputWrapper: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8, backgroundColor: COLORS.bg },
  titleInput: { fontSize: FONTS.xl, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8, lineHeight: 34 },
  editorElement: { minHeight: 500, paddingHorizontal: 16 },
});