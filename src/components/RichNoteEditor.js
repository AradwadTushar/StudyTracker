import React, { useRef, useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { RichEditor } from 'react-native-pell-rich-editor';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { marked } from 'marked';
import { useStore } from '../store/useStore';

// Configure marked to ignore math blocks ($...$ and $$...$$) and treat them as raw text
marked.use({
  extensions: [
    {
      name: 'inlineMath',
      level: 'inline',
      start(src) { 
        const index = src.indexOf('$');
        return index === -1 ? undefined : index;
      },
      tokenizer(src) {
        const match = /^\$([^$\n]+?)\$/.exec(src);
        if (match) {
          return {
            type: 'inlineMath',
            raw: match[0],
            text: match[1]
          };
        }
      },
      renderer(token) {
        return `$${token.text}$`;
      }
    },
    {
      name: 'blockMath',
      level: 'block',
      start(src) { 
        const index = src.indexOf('$$');
        return index === -1 ? undefined : index;
      },
      tokenizer(src) {
        const match = /^\$\$([\s\S]*?)\$\$/.exec(src);
        if (match) {
          return {
            type: 'blockMath',
            raw: match[0],
            text: match[1]
          };
        }
      },
      renderer(token) {
        return `$$${token.text}$$`;
      }
    }
  ]
});

import EditorToolbar from './EditorToolbar';
import MarkdownImportModal from './MarkdownImportModal';
import { COLORS, FONTS, RADIUS } from '../utils/theme';
import { SUBJECTS } from '../data/subjects';

const cleanKaTeXHTML = (html) => {
  if (!html) return '';

  let result = '';
  let i = 0;

  while (i < html.length) {
    const remaining = html.slice(i);
    const isDisplayDiv = remaining.startsWith('<div class="katex-display"');
    const isKatexSpan = remaining.startsWith('<span class="katex"');

    if (isDisplayDiv || isKatexSpan) {
      const startIdx = i;
      const tagName = isDisplayDiv ? 'div' : 'span';

      // Find the annotation tag containing the original formula
      const annotStartTag = '<annotation encoding="application/x-tex">';
      const annotStartIdx = html.indexOf(annotStartTag, startIdx);
      
      if (annotStartIdx !== -1) {
        const annotEndIdx = html.indexOf('</annotation>', annotStartIdx);
        if (annotEndIdx !== -1) {
          const formula = html.slice(annotStartIdx + annotStartTag.length, annotEndIdx).trim();

          // Find the matching closing tag of the outer element
          let count = 1;
          let currentIdx = startIdx + 1;
          while (count > 0 && currentIdx < html.length) {
            const nextOpen = html.indexOf('<' + tagName, currentIdx);
            const nextClose = html.indexOf('</' + tagName + '>', currentIdx);

            if (nextClose === -1) {
              break; // Malformed HTML fallback
            }

            if (nextOpen !== -1 && nextOpen < nextClose) {
              count++;
              currentIdx = nextOpen + 1;
            } else {
              count--;
              currentIdx = nextClose + tagName.length + 3;
              if (count === 0) {
                i = currentIdx;
                break;
              }
            }
          }

          if (count === 0) {
            result += isDisplayDiv ? `$$\n${formula}\n$$` : `$${formula}$`;
            continue;
          }
        }
      }
    }

    result += html[i];
    i++;
  }

  return result;
};

export default function RichNoteEditor({ note, onSave, onClose }) {
  const richTextRef = useRef();
  const insets = useSafeAreaInsets();
  
  const [title, setTitle] = useState(note?.title || '');
  const [subject, setSubject] = useState(note?.subject || SUBJECTS[0]);
  const [showSubs, setShowSubs] = useState(false);
  const [showMdModal, setShowMdModal] = useState(false);
  const contentRef = useRef(note?.content || '');

  const setFullScreenModalOpen = useStore(s => s.setFullScreenModalOpen);

  useEffect(() => {
    setFullScreenModalOpen(true);
    return () => setFullScreenModalOpen(false);
  }, []);

  const handleContentChange = (html) => {
    contentRef.current = html;
  };

  // Safe DOM macro execution pattern
  const triggerMathRender = () => {
    const jsInject = `
      function loadMathStyles() {
        if (!document.getElementById('katex-core-css')) {
          var link = document.createElement('link');
          link.id = 'katex-core-css';
          link.rel = 'stylesheet';
          link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
          document.head.appendChild(link);
        }
      }

      function executeKatexParsing() {
        if (window.renderMathInElement) {
          window.renderMathInElement(document.body, {
            delimiters: [
              {left: "$$", right: "$$", display: true},
              {left: "$", right: "$", display: false}
            ],
            throwOnError: false
          });
        }
      }

      loadMathStyles();

      if (!window.renderMathInElement) {
        var s1 = document.createElement('script');
        s1.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js';
        s1.onload = function() {
          var s2 = document.createElement('script');
          s2.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js';
          s2.onload = executeKatexParsing;
          document.head.appendChild(s2);
        };
        document.head.appendChild(s1);
      } else {
        executeKatexParsing();
      }
    `;

    setTimeout(() => {
      richTextRef.current?.commandDOM(jsInject);
    }, 250);
  };

  const handleApplyMarkdown = (mdText) => {
    const html = marked.parse(mdText);
    richTextRef.current?.setContentHTML(html);
    contentRef.current = html;
    
    // Process newly imported formula symbols instantly
    triggerMathRender();
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
    const cleanContent = cleanKaTeXHTML(contentRef.current);
    onSave(title.trim(), cleanContent, subject);
    onClose();
  };

  const renderEditorContent = () => (
    <View style={{ flex: 1 }}>
      {/* Header */}
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

      {/* Subject Strip Container */}
      {showSubs && (
        <View style={styles.subjectStripContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.subjectStripContent}
          >
            {SUBJECTS.map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.subChip, subject === s && styles.subChipActive]}
                onPress={() => {
                  setSubject(s);
                  setShowSubs(false);
                }}
              >
                <View style={[styles.subjectDotSmall, { backgroundColor: COLORS.subjects?.[s] || COLORS.accent }]} />
                <Text style={[styles.subChipText, subject === s && styles.subChipTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Text Canvas Area */}
      <ScrollView 
        style={styles.scrollContainer} 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.metaInputWrapper}>
          <TextInput 
            style={styles.titleInput} 
            placeholder="Note title" 
            placeholderTextColor={COLORS.textMuted}
            value={title} 
            onChangeText={setTitle} 
            multiline 
          />
        </View>

        <RichEditor
          ref={richTextRef}
          editorInitializedCallback={() => {
            console.log("Editor initialized");
            triggerMathRender();
          }}
          initialContentHTML={note?.content || ''}
          onChange={handleContentChange}
          placeholder="Write your notes here..."
          editorStyle={{
            backgroundColor: COLORS.bg,
            color: COLORS.textPrimary,
            placeholderColor: COLORS.textMuted,
            cssText: `
              body { background-color: ${COLORS.bg}; margin: 0; padding: 0; }
              @import url('https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/tokyo-night-dark.min.css');
            `,
            contentCSSText: `
              body { 
                font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; 
                font-size:17px; 
                line-height:1.6; 
                color:white; 
              }
              p { margin:10px 0; }
              
              /* Code Blocks & Highlight Layouts */
              pre { 
                background:#1A1B26; 
                border-radius:10px; 
                padding:14px; 
                overflow:auto; 
                border:1px solid #2F334D; 
                margin:16px 0; 
              }
              code { 
                font-family:'Courier New', monospace; 
                font-size:14px; 
                color:#A9B1D6; 
              }

              /* Markdown Engineering Table Styles Layout */
              table { 
                border-collapse: collapse; 
                width: 100%; 
                margin: 16px 0; 
                background-color: #1F2335; 
                border-radius: 8px; 
                overflow: hidden; 
              }
              th, td { 
                border: 1px solid #383E56; 
                padding: 10px 12px; 
                text-align: left; 
              }
              th { 
                background-color: #24283E; 
                color: #7AA2F7; 
                font-weight: 600; 
              }
              tr:nth-child(even) { 
                background-color: #1A1B26; 
              }

              /* Mathematics Element Overflows Constraints */
              .katex-display { 
                margin: 12px 0; 
                padding: 6px; 
                overflow-x: auto; 
                overflow-y: hidden;
                text-align: center;
              }
            `,
          }}
          style={styles.editorElement}
          androidHardwareAccelerationDisabled={true}
        />
      </ScrollView>

      {/* Toolbar pinned at the bottom */}
      <EditorToolbar
        editorRef={richTextRef}
        onInsertImage={pickImage}
        onPasteMarkdown={() => setShowMdModal(true)}
      />
    </View>
  );

  return (
    <View style={[styles.mainContainer, { paddingTop: insets.top }]}>
      {Platform.OS === 'ios' ? (
        <KeyboardAvoidingView 
          behavior="padding" 
          style={styles.keyboardContainer}
          keyboardVerticalOffset={insets.top + 44}
        >
          {renderEditorContent()}
        </KeyboardAvoidingView>
      ) : (
        renderEditorContent()
      )}

      <MarkdownImportModal
        visible={showMdModal}
        onClose={() => setShowMdModal(false)}
        onApply={handleApplyMarkdown}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: COLORS.bg },
  keyboardContainer: { flex: 1 },
  scrollContainer: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 20 },
  editorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  subjectPill: {
    flex: 1,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderRadius: 22,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginHorizontal: 12,
  },
  subjectDot: { width: 8, height: 8, borderRadius: 4 },
  subjectPillText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '500', flex: 1, marginLeft: 8 },
  saveBtn: { backgroundColor: COLORS.accent, paddingHorizontal: 18, paddingVertical: 8, borderRadius: RADIUS.md },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  subjectStripContainer: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
    height: 58,
  },
  subjectStripContent: { paddingHorizontal: 12, alignItems: 'center' },
  subChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    paddingHorizontal: 14,
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  subChipActive: { backgroundColor: COLORS.accentGlow, borderColor: COLORS.accent },
  subChipText: { marginLeft: 6, fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  subChipTextActive: { color: COLORS.accentLight },
  subjectDotSmall: { width: 8, height: 8, borderRadius: 4 },
  metaInputWrapper: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4, backgroundColor: COLORS.bg },
  titleInput: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
    paddingVertical: 0,
    lineHeight: 38,
  },
  editorElement: { flex: 1, minHeight: 300, paddingHorizontal: 16 } 
});