import React from 'react';
import { RichToolbar, actions } from 'react-native-pell-rich-editor';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../utils/theme';

const CUSTOM_CODE = "custom_code";

export default function EditorToolbar({ editorRef, onInsertImage, onPasteMarkdown }) {

  const insertCodeBlock = () => {
    editorRef.current?.insertHTML(`
      <pre style="
        background:#1E1E1E;
        color:#F8F8F2;
        padding:12px;
        border-radius:8px;
        overflow:auto;
      "><code>Write code here...</code></pre>
      <div><br></div>
    `);
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <RichToolbar
          editor={editorRef}
          actions={[
            actions.heading1,
            actions.heading2,
            actions.setBold,
            actions.setItalic,
            actions.insertBulletsList,
            actions.insertOrderedList,
            CUSTOM_CODE,
            actions.insertImage,
            actions.undo,
            actions.redo,
          ]}
          iconMap={{
            [actions.heading1]: () => <View style={styles.textIconBg}><Ionicons name="text" size={16} color={COLORS.textPrimary} /></View>,
            [actions.heading2]: () => <View style={styles.textIconBg}><Ionicons name="text" size={13} color={COLORS.textPrimary} /></View>,
            [actions.setBold]: () => <MaterialCommunityIcons name="format-bold" size={18} color={COLORS.textPrimary} />,
            [actions.setItalic]: () => <MaterialCommunityIcons name="format-italic" size={18} color={COLORS.textPrimary} />,
            [CUSTOM_CODE]: () => <MaterialCommunityIcons name="code-tags" size={18} color={COLORS.textPrimary} />,
            [actions.insertBulletsList]: () => <Ionicons name="list" size={18} color={COLORS.textPrimary} />,
            [actions.insertOrderedList]: () => <Ionicons name="list-sharp" size={18} color={COLORS.textPrimary} />,
            [actions.insertImage]: () => <Ionicons name="image-outline" size={18} color={COLORS.textPrimary} />,
            [actions.undo]: () => <Ionicons name="arrow-undo-outline" size={18} color={COLORS.textPrimary} />,
            [actions.redo]: () => <Ionicons name="arrow-redo-outline" size={18} color={COLORS.textPrimary} />,
          }}
          onPressAddImage={onInsertImage}
          style={styles.toolbar}
          darkStyle={styles.toolbar}
          onPressAction={(action) => {
            if (action === CUSTOM_CODE) insertCodeBlock();
          }}
          iconTint={COLORS.textPrimary}
          selectedIconTint={COLORS.accentLight}
          unselectedIconTint={COLORS.textPrimary}
          disabledIconTint={COLORS.textMuted}
        />

        {/* MD Import button — sits at the right end of toolbar */}
        <TouchableOpacity style={styles.mdBtn} onPress={onPasteMarkdown}>
          <MaterialCommunityIcons name="language-markdown" size={20} color={COLORS.accent} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toolbar: {
    backgroundColor: COLORS.surface,
    height: 46,
    flex: 1,
  },
  textIconBg: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mdBtn: {
    width: 42,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
  },
});