import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';

import { COLORS, FONTS, RADIUS } from '../utils/theme';
import { installUpdate } from '../services/updateService';
import updateInfo from '../config/update.json';

export default function UpdateModal({ visible, onClose }) {
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    try {
      setLoading(true);
      await installUpdate();
    } catch (err) {
      console.log(err);
      setLoading(false);
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
    >
      <View style={styles.overlay}>

        <View style={styles.card}>

          <Image
            source={require('../../assets/pip/Pip_Waving.png')}
            style={styles.image}
            resizeMode="contain"
          />

          <Text style={styles.title}>
            Pip brought an update!
          </Text>

          <Text style={styles.message}>
            Hey Learner! 👋{"\n\n"}
            I found some new improvements for{" "}
            <Text style={styles.bold}>StudyTracker</Text>.
          </Text>

          <View style={styles.notesContainer}>

            <Text style={styles.heading}>
              Here's what's new
            </Text>

            {updateInfo.notes.map((note, index) => (
              <View
                key={index}
                style={styles.noteRow}
              >
                <Text style={styles.tick}>✓</Text>

                <Text style={styles.note}>
                  {note}
                </Text>
              </View>
            ))}

          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size="large"
                color={COLORS.accent}
              />

              <Text style={styles.loading}>
                Installing update...
              </Text>
            </View>
          ) : (
            <>

              <Text style={styles.question}>
                Would you like me to install it now?
              </Text>

              <View style={styles.buttons}>

                <TouchableOpacity
                  style={styles.laterButton}
                  onPress={onClose}
                >
                  <Text style={styles.laterText}>
                    Later
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.updateButton}
                  onPress={handleUpdate}
                >
                  <Text style={styles.updateText}>
                    Update Now
                  </Text>
                </TouchableOpacity>

              </View>

            </>
          )}

        </View>

      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(13,15,20,0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  card: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 24,
    alignItems: 'center',
  },

  image: {
    width: 170,
    height: 170,
    marginBottom: 12,
  },

  title: {
    color: COLORS.textPrimary,
    fontSize: FONTS.xl,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },

  message: {
    color: COLORS.textSecondary,
    fontSize: FONTS.md,
    textAlign: 'center',
    lineHeight: 24,
  },

  bold: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },

  notesContainer: {
    width: '100%',
    marginTop: 24,
    marginBottom: 24,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
  },

  heading: {
    color: COLORS.textPrimary,
    fontWeight: '700',
    marginBottom: 14,
    fontSize: FONTS.md,
  },

  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  tick: {
    color: COLORS.green,
    fontSize: 18,
    marginRight: 10,
    fontWeight: '700',
  },

  note: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: FONTS.sm,
  },

  question: {
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 24,
    fontSize: FONTS.md,
  },

  buttons: {
    flexDirection: 'row',
    width: '100%',
  },

  laterButton: {
    flex: 1,
    paddingVertical: 14,
    marginRight: 10,
    alignItems: 'center',
  },

  laterText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontSize: FONTS.md,
  },

  updateButton: {
    flex: 1,
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },

  updateText: {
    color: COLORS.textPrimary,
    fontWeight: '700',
    fontSize: FONTS.md,
  },

  loadingContainer: {
    alignItems: 'center',
  },

  loading: {
    marginTop: 14,
    color: COLORS.textSecondary,
  },

});