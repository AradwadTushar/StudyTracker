import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Modal, Pressable, ActivityIndicator,
  Animated, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore } from '../store/useStore';
import { COLORS, FONTS, RADIUS, SHADOW } from '../utils/theme';

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=';

async function generateQuiz(topic, goals, difficulty, count, apiKey) {
  const goalNames = goals.join(' and ');
  const prompt =
    `Generate ${count} MCQ questions on "${topic}" for a student preparing for ${goalNames} exam. ` +
    `Difficulty: ${difficulty}. Questions should match ${goalNames} exam style and pattern. ` +
    `Return ONLY a raw JSON object, no markdown, no backticks. Format: ` +
    `{"topic":"${topic}","questions":[{"id":1,"question":"...","options":["A","B","C","D"],"correct":0,"explanation":"..."}]}` +
    ` correct is 0-indexed. Explanation should be concise (1-2 sentences).`;

  const res = await fetch(GEMINI_URL + apiKey, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 2048, temperature: 0.7 },
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(`Gemini error: ${data.error.message}`);
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('No response from Gemini');
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('Invalid JSON response');
  return JSON.parse(cleaned.slice(start, end + 1));
}

// ── Quiz Taking Screen ────────────────────────────────────────────────────────
function QuizTaker({ quiz, onFinish, onClose }) {
  const [current,     setCurrent]     = useState(0);
  const [answers,     setAnswers]     = useState(Array(quiz.questions.length).fill(null));
  const [submitted,   setSubmitted]   = useState(false);
  const [showReview,  setShowReview]  = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const q = quiz.questions[current];
  const total = quiz.questions.length;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (current + 1) / total,
      duration: 300, useNativeDriver: false,
    }).start();
  }, [current]);

  const selectAnswer = (idx) => {
    if (submitted) return;
    const updated = [...answers];
    updated[current] = idx;
    setAnswers(updated);
  };

  const next = () => {
    if (current < total - 1) setCurrent(c => c + 1);
  };

  const prev = () => {
    if (current > 0) setCurrent(c => c - 1);
  };

  const submit = () => {
    const unanswered = answers.filter(a => a === null).length;
    if (unanswered > 0) {
      Alert.alert('Unanswered Questions', `You have ${unanswered} unanswered question(s). Submit anyway?`, [
        { text: 'Go Back', style: 'cancel' },
        { text: 'Submit', onPress: () => { setSubmitted(true); setShowReview(true); } },
      ]);
    } else {
      setSubmitted(true);
      setShowReview(true);
    }
  };

  const score = answers.filter((a, i) => a === quiz.questions[i].correct).length;

  if (showReview) {
    return (
      <View style={styles.safe}>
        {/* Score header */}
        <View style={styles.scoreHeader}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreNum}>{score}/{total}</Text>
            <Text style={styles.scoreLabel}>
              {score === total ? '🏆 Perfect!' : score >= total * 0.7 ? '🔥 Great job!' : score >= total * 0.5 ? '📚 Keep studying!' : '💪 Review needed'}
            </Text>
          </View>
          <TouchableOpacity style={styles.reattemptBtn} onPress={() => {
            setAnswers(Array(total).fill(null));
            setSubmitted(false);
            setShowReview(false);
            setCurrent(0);
            onFinish(answers, score, false); // save this attempt
          }}>
            <Ionicons name="refresh" size={16} color={COLORS.accent} />
            <Text style={styles.reattemptText}>Reattempt</Text>
          </TouchableOpacity>
        </View>

        {/* Review questions */}
        <ScrollView style={styles.reviewList} showsVerticalScrollIndicator={false}>
          {quiz.questions.map((q, i) => {
            const userAns = answers[i];
            const isCorrect = userAns === q.correct;
            return (
              <View key={q.id} style={[styles.reviewCard, SHADOW.card]}>
                <View style={styles.reviewQHeader}>
                  <View style={[styles.reviewBadge, { backgroundColor: isCorrect ? COLORS.green + '22' : COLORS.red + '22' }]}>
                    <Ionicons name={isCorrect ? 'checkmark-circle' : 'close-circle'} size={16} color={isCorrect ? COLORS.green : COLORS.red} />
                    <Text style={[styles.reviewBadgeText, { color: isCorrect ? COLORS.green : COLORS.red }]}>
                      Q{i + 1}
                    </Text>
                  </View>
                </View>
                <Text style={styles.reviewQuestion}>{q.question}</Text>
                {q.options.map((opt, oi) => {
                  const isUser    = oi === userAns;
                  const isCorrectOpt = oi === q.correct;
                  let bg = COLORS.card;
                  let border = COLORS.border;
                  if (isCorrectOpt) { bg = COLORS.green + '22'; border = COLORS.green; }
                  else if (isUser && !isCorrect) { bg = COLORS.red + '22'; border = COLORS.red; }
                  return (
                    <View key={oi} style={[styles.reviewOption, { backgroundColor: bg, borderColor: border }]}>
                      <Text style={styles.reviewOptionLetter}>{['A','B','C','D'][oi]}</Text>
                      <Text style={styles.reviewOptionText}>{opt}</Text>
                      {isCorrectOpt && <Ionicons name="checkmark" size={16} color={COLORS.green} />}
                      {isUser && !isCorrect && <Ionicons name="close" size={16} color={COLORS.red} />}
                    </View>
                  );
                })}
                <View style={styles.explanationBox}>
                  <Ionicons name="bulb-outline" size={14} color={COLORS.amber} />
                  <Text style={styles.explanationText}>{q.explanation}</Text>
                </View>
              </View>
            );
          })}
          <TouchableOpacity style={styles.saveCloseBtn} onPress={() => { onFinish(answers, score, true); }}>
            <Text style={styles.saveCloseBtnText}>Save & Close</Text>
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.safe}>
      {/* Header */}
      <View style={styles.quizHeader}>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={22} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.quizTitle} numberOfLines={1}>{quiz.topic}</Text>
        <Text style={styles.quizCounter}>{current + 1}/{total}</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, {
          width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] })
        }]} />
      </View>

      <ScrollView style={styles.quizBody} showsVerticalScrollIndicator={false}>
        <Text style={styles.questionText}>{q.question}</Text>
        {q.options.map((opt, i) => {
          const selected = answers[current] === i;
          return (
            <TouchableOpacity key={i}
              style={[styles.optionBtn, selected && styles.optionBtnSelected]}
              onPress={() => selectAnswer(i)}
              activeOpacity={0.8}>
              <View style={[styles.optionLetter, selected && styles.optionLetterSelected]}>
                <Text style={[styles.optionLetterText, selected && { color: '#fff' }]}>{['A','B','C','D'][i]}</Text>
              </View>
              <Text style={[styles.optionText, selected && { color: COLORS.textPrimary, fontWeight: '600' }]}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navRow}>
        <TouchableOpacity style={[styles.navBtn, current === 0 && { opacity: 0.3 }]} onPress={prev} disabled={current === 0}>
          <Ionicons name="chevron-back" size={20} color={COLORS.textPrimary} />
          <Text style={styles.navBtnText}>Prev</Text>
        </TouchableOpacity>

        {current === total - 1 ? (
          <TouchableOpacity style={styles.submitBtn} onPress={submit}>
            <Text style={styles.submitBtnText}>Submit Quiz</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.navBtn} onPress={next}>
            <Text style={styles.navBtnText}>Next</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ── Quiz Setup Modal ──────────────────────────────────────────────────────────
function QuizSetup({ visible, onClose, onStart, goals, geminiKey }) {
  const [topic,      setTopic]      = useState('');
  const [selGoals,   setSelGoals]   = useState([]);
  const [difficulty, setDifficulty] = useState('medium');
  const [count,      setCount]      = useState('10');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');

  const DIFFICULTIES = ['easy', 'medium', 'hard', 'mixed'];
  const COUNTS = ['5', '10', '15', '20'];

  const toggleGoal = (name) => {
    setSelGoals(p => p.includes(name) ? p.filter(g => g !== name) : [...p, name]);
  };

  const start = async () => {
    if (!topic.trim()) { setError('Please enter a topic'); return; }
    if (selGoals.length === 0) { setError('Select at least one goal'); return; }
    if (!geminiKey) { setError('No Gemini API key set. Add it in onboarding.'); return; }
    setError('');
    setLoading(true);
    try {
      const quiz = await generateQuiz(topic.trim(), selGoals, difficulty, parseInt(count), geminiKey);
      onStart(quiz, selGoals);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.setupSheet} onPress={() => {}}>
          <View style={styles.modalHandle} />
          <Text style={styles.setupTitle}>New Quiz 🧠</Text>

          <Text style={styles.fieldLabel}>Topic</Text>
          <TextInput
            style={styles.topicInput}
            placeholder="e.g. OS CPU Scheduling, DBMS Normalization..."
            placeholderTextColor={COLORS.textMuted}
            value={topic}
            onChangeText={t => { setTopic(t); setError(''); }}
          />

          <Text style={styles.fieldLabel}>Goal / Exam Style</Text>
          <View style={styles.goalChips}>
            {goals.filter(g => !g.done).map(g => (
              <TouchableOpacity key={g.id}
                style={[styles.goalChip, { borderColor: g.color },
                  selGoals.includes(g.name) && { backgroundColor: g.color + '33' }]}
                onPress={() => toggleGoal(g.name)}>
                {selGoals.includes(g.name) && <Ionicons name="checkmark" size={13} color={g.color} />}
                <Text style={[styles.goalChipText, { color: g.color }]}>{g.name}</Text>
              </TouchableOpacity>
            ))}
            {goals.length === 0 && <Text style={styles.noGoalsHint}>Add goals in Syllabus screen first</Text>}
          </View>

          <Text style={styles.fieldLabel}>Difficulty</Text>
          <View style={styles.diffRow}>
            {DIFFICULTIES.map(d => (
              <TouchableOpacity key={d}
                style={[styles.diffBtn, difficulty === d && styles.diffBtnActive]}
                onPress={() => setDifficulty(d)}>
                <Text style={[styles.diffBtnText, difficulty === d && styles.diffBtnTextActive]}>
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Number of Questions</Text>
          <View style={styles.countRow}>
            {COUNTS.map(c => (
              <TouchableOpacity key={c}
                style={[styles.countBtn, count === c && styles.countBtnActive]}
                onPress={() => setCount(c)}>
                <Text style={[styles.countBtnText, count === c && styles.countBtnTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={[styles.startBtn, loading && { opacity: 0.6 }]} onPress={start} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <><Ionicons name="flash" size={18} color="#fff" /><Text style={styles.startBtnText}>Generate Quiz</Text></>
            }
          </TouchableOpacity>
          {loading && <Text style={styles.loadingHint}>Generating questions... 10-15 seconds</Text>}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Main Quiz Screen ──────────────────────────────────────────────────────────
export default function QuizScreen({ onClose }) {
  const insets = useSafeAreaInsets();
  const { goals = [], geminiKey, setFullScreenModalOpen } = useStore();

  // Hide Pip/Tools while Quiz is open
  useEffect(() => {
    setFullScreenModalOpen(true);
    return () => setFullScreenModalOpen(false);
  }, []);
  const [history,    setHistory]    = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(null); // quiz data being taken
  const [showSetup,  setShowSetup]  = useState(false);
  const [reviewing,  setReviewing]  = useState(null); // quiz from history being reviewed

  useEffect(() => {
    AsyncStorage.getItem('st_quiz_history').then(r => { if (r) setHistory(JSON.parse(r)); });
  }, []);

  const saveHistory = async (updated) => {
    setHistory(updated);
    await AsyncStorage.setItem('st_quiz_history', JSON.stringify(updated));
  };

  const handleQuizFinish = async (answers, score, close) => {
    // Save / overwrite attempt for this topic
    const existing = history.findIndex(h => h.topic.toLowerCase() === activeQuiz.topic.toLowerCase());
    const record = {
      id: existing >= 0 ? history[existing].id : `q_${Date.now()}`,
      topic: activeQuiz.topic,
      goals: activeQuiz.goals || [],
      score,
      total: activeQuiz.questions.length,
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      quiz: activeQuiz,
      answers,
    };
    let updated;
    if (existing >= 0) {
      updated = [...history];
      updated[existing] = record;
    } else {
      updated = [record, ...history];
    }
    await saveHistory(updated);
    if (close) setActiveQuiz(null);
  };

  // Taking a quiz
  if (activeQuiz) {
    return (
      <QuizTaker
        quiz={activeQuiz}
        onFinish={handleQuizFinish}
        onClose={() => setActiveQuiz(null)}
      />
    );
  }

  // Reviewing a past attempt
  if (reviewing) {
    return (
      <View style={[styles.safe, { paddingTop: insets.top }]}>
        <View style={styles.reviewHeader}>
          <TouchableOpacity onPress={() => setReviewing(null)}>
            <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.reviewHeaderTitle}>Review — {reviewing.topic}</Text>
        </View>
        <ScrollView style={styles.reviewList} showsVerticalScrollIndicator={false}>
          <View style={styles.reviewScoreBanner}>
            <Text style={styles.reviewScoreText}>Score: {reviewing.score}/{reviewing.total}</Text>
            <Text style={styles.reviewScoreDate}>{reviewing.date}</Text>
          </View>
          {reviewing.quiz.questions.map((q, i) => {
            const userAns   = reviewing.answers[i];
            const isCorrect = userAns === q.correct;
            return (
              <View key={q.id} style={[styles.reviewCard, SHADOW.card]}>
                <View style={styles.reviewQHeader}>
                  <View style={[styles.reviewBadge, { backgroundColor: isCorrect ? COLORS.green + '22' : COLORS.red + '22' }]}>
                    <Ionicons name={isCorrect ? 'checkmark-circle' : 'close-circle'} size={16} color={isCorrect ? COLORS.green : COLORS.red} />
                    <Text style={[styles.reviewBadgeText, { color: isCorrect ? COLORS.green : COLORS.red }]}>Q{i + 1}</Text>
                  </View>
                </View>
                <Text style={styles.reviewQuestion}>{q.question}</Text>
                {q.options.map((opt, oi) => {
                  const isUser = oi === userAns;
                  const isCorrectOpt = oi === q.correct;
                  let bg = COLORS.card, border = COLORS.border;
                  if (isCorrectOpt) { bg = COLORS.green + '22'; border = COLORS.green; }
                  else if (isUser && !isCorrect) { bg = COLORS.red + '22'; border = COLORS.red; }
                  return (
                    <View key={oi} style={[styles.reviewOption, { backgroundColor: bg, borderColor: border }]}>
                      <Text style={styles.reviewOptionLetter}>{['A','B','C','D'][oi]}</Text>
                      <Text style={styles.reviewOptionText}>{opt}</Text>
                      {isCorrectOpt && <Ionicons name="checkmark" size={16} color={COLORS.green} />}
                      {isUser && !isCorrect && <Ionicons name="close" size={16} color={COLORS.red} />}
                    </View>
                  );
                })}
                <View style={styles.explanationBox}>
                  <Ionicons name="bulb-outline" size={14} color={COLORS.amber} />
                  <Text style={styles.explanationText}>{q.explanation}</Text>
                </View>
              </View>
            );
          })}
          <TouchableOpacity style={styles.reattemptFullBtn} onPress={() => {
            setActiveQuiz(reviewing.quiz);
            setReviewing(null);
          }}>
            <Ionicons name="refresh" size={18} color="#fff" />
            <Text style={styles.reattemptFullBtnText}>Reattempt Same Questions</Text>
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    );
  }

  // Main quiz list
  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onClose} style={{ marginRight: 4 }}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.pageTitle}>Quiz 🧠</Text>
          <Text style={styles.pageSubtitle}>Practice makes perfect</Text>
        </View>
        <TouchableOpacity style={styles.newQuizBtn} onPress={() => setShowSetup(true)}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.newQuizBtnText}>New Quiz</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.historyList}>
        {history.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📝</Text>
            <Text style={styles.emptyTitle}>No quizzes yet</Text>
            <Text style={styles.emptyText}>Tap "New Quiz" to generate your first practice test using AI</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowSetup(true)}>
              <Text style={styles.emptyBtnText}>Start First Quiz</Text>
            </TouchableOpacity>
          </View>
        ) : history.map(h => {
          const pct = Math.round(h.score / h.total * 100);
          const color = pct >= 70 ? COLORS.green : pct >= 50 ? COLORS.amber : COLORS.red;
          return (
            <View key={h.id} style={[styles.historyCard, SHADOW.card]}>
              <View style={styles.historyCardLeft}>
                <Text style={styles.historyTopic} numberOfLines={1}>Quiz on {h.topic}</Text>
                <View style={styles.historyMeta}>
                  {h.goals.map(g => (
                    <View key={g} style={styles.historyGoalTag}>
                      <Text style={styles.historyGoalText}>{g}</Text>
                    </View>
                  ))}
                  <Text style={styles.historyDate}>{h.date}</Text>
                </View>
                <View style={styles.historyScoreRow}>
                  <View style={styles.historyScoreBar}>
                    <View style={[styles.historyScoreFill, { width: `${pct}%`, backgroundColor: color }]} />
                  </View>
                  <Text style={[styles.historyScoreText, { color }]}>{h.score}/{h.total}</Text>
                </View>
              </View>
              <View style={styles.historyActions}>
                <TouchableOpacity style={styles.historyBtn} onPress={() => setReviewing(h)}>
                  <Ionicons name="eye-outline" size={18} color={COLORS.accent} />
                  <Text style={styles.historyBtnText}>Review</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.historyBtn, styles.historyBtnSecondary]}
                  onPress={() => setActiveQuiz(h.quiz)}>
                  <Ionicons name="refresh" size={18} color={COLORS.textSecondary} />
                  <Text style={[styles.historyBtnText, { color: COLORS.textSecondary }]}>Retry</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
        <View style={{ height: 100 }} />
      </ScrollView>

      <QuizSetup
        visible={showSetup}
        onClose={() => setShowSetup(false)}
        goals={goals}
        geminiKey={geminiKey || ''}
        onStart={(quiz, selectedGoals) => {
          setShowSetup(false);
          setActiveQuiz({ ...quiz, goals: selectedGoals });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  // Main header
  headerRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 10 },
  pageTitle:      { fontSize: FONTS.xl, fontWeight: '700', color: COLORS.textPrimary },
  pageSubtitle:   { fontSize: FONTS.xs, color: COLORS.textSecondary, marginTop: 2 },
  newQuizBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.accent, paddingHorizontal: 14, paddingVertical: 10, borderRadius: RADIUS.md, ...SHADOW.glow },
  newQuizBtnText: { color: '#fff', fontWeight: '700', fontSize: FONTS.sm },
  historyList:    { flex: 1, paddingHorizontal: 16 },

  // Empty state
  emptyState: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: FONTS.lg, fontWeight: '700', color: COLORS.textPrimary },
  emptyText:  { fontSize: FONTS.sm, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20, maxWidth: 260 },
  emptyBtn:   { backgroundColor: COLORS.accent, paddingHorizontal: 24, paddingVertical: 12, borderRadius: RADIUS.md, marginTop: 8 },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: FONTS.sm },

  // History cards
  historyCard:      { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, padding: 14, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
  historyCardLeft:  { flex: 1 },
  historyTopic:     { fontSize: FONTS.md, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 6 },
  historyMeta:      { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8, alignItems: 'center' },
  historyGoalTag:   { backgroundColor: COLORS.accentGlow, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  historyGoalText:  { fontSize: 10, color: COLORS.accentLight, fontWeight: '600' },
  historyDate:      { fontSize: FONTS.xs, color: COLORS.textMuted },
  historyScoreRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  historyScoreBar:  { flex: 1, height: 5, backgroundColor: COLORS.border, borderRadius: 3, overflow: 'hidden' },
  historyScoreFill: { height: '100%', borderRadius: 3 },
  historyScoreText: { fontSize: FONTS.xs, fontWeight: '700', minWidth: 36 },
  historyActions:   { gap: 8, marginLeft: 10 },
  historyBtn:       { alignItems: 'center', gap: 3, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: COLORS.accentGlow, borderRadius: RADIUS.md },
  historyBtnSecondary: { backgroundColor: COLORS.bg },
  historyBtnText:   { fontSize: 10, color: COLORS.accent, fontWeight: '600' },

  // Quiz setup modal
  modalOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  setupSheet:    { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
  modalHandle:   { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  setupTitle:    { fontSize: FONTS.xl, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 16 },
  fieldLabel:    { fontSize: FONTS.xs, color: COLORS.textSecondary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  topicInput:    { backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: 13, color: COLORS.textPrimary, fontSize: FONTS.md, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16 },
  goalChips:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  goalChip:      { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5 },
  goalChipText:  { fontSize: FONTS.xs, fontWeight: '700' },
  noGoalsHint:   { fontSize: FONTS.xs, color: COLORS.textMuted, fontStyle: 'italic' },
  diffRow:       { flexDirection: 'row', gap: 8, marginBottom: 16 },
  diffBtn:       { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: RADIUS.md, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
  diffBtnActive: { backgroundColor: COLORS.accentGlow, borderColor: COLORS.accent },
  diffBtnText:   { fontSize: FONTS.xs, color: COLORS.textMuted, fontWeight: '600' },
  diffBtnTextActive: { color: COLORS.accentLight },
  countRow:      { flexDirection: 'row', gap: 8, marginBottom: 16 },
  countBtn:      { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: RADIUS.md, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
  countBtnActive: { backgroundColor: COLORS.accentGlow, borderColor: COLORS.accent },
  countBtnText:  { fontSize: FONTS.sm, color: COLORS.textMuted, fontWeight: '600' },
  countBtnTextActive: { color: COLORS.accentLight },
  errorText:     { color: COLORS.red, fontSize: FONTS.xs, marginBottom: 10, textAlign: 'center' },
  startBtn:      { backgroundColor: COLORS.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 15, borderRadius: RADIUS.md },
  startBtnText:  { color: '#fff', fontWeight: '700', fontSize: FONTS.md },
  loadingHint:   { textAlign: 'center', color: COLORS.textMuted, fontSize: FONTS.xs, marginTop: 8 },

  // Quiz taking
  quizHeader:    { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, paddingTop: 52 },
  quizTitle:     { flex: 1, fontSize: FONTS.md, fontWeight: '700', color: COLORS.textPrimary },
  quizCounter:   { fontSize: FONTS.sm, color: COLORS.textSecondary, fontWeight: '600' },
  progressTrack: { height: 4, backgroundColor: COLORS.border, marginHorizontal: 16, borderRadius: 2, overflow: 'hidden', marginBottom: 16 },
  progressFill:  { height: '100%', backgroundColor: COLORS.accent, borderRadius: 2 },
  quizBody:      { flex: 1, paddingHorizontal: 16 },
  questionText:  { fontSize: FONTS.lg, fontWeight: '600', color: COLORS.textPrimary, lineHeight: 28, marginBottom: 20 },
  optionBtn:     { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: 14, marginBottom: 10, borderWidth: 1.5, borderColor: COLORS.border },
  optionBtnSelected: { borderColor: COLORS.accent, backgroundColor: COLORS.accentGlow },
  optionLetter:  { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  optionLetterSelected: { backgroundColor: COLORS.accent },
  optionLetterText: { fontSize: FONTS.sm, fontWeight: '700', color: COLORS.textSecondary },
  optionText:    { flex: 1, fontSize: FONTS.sm, color: COLORS.textSecondary, lineHeight: 20 },
  navRow:        { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderTopWidth: 1, borderTopColor: COLORS.border },
  navBtn:        { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.card, paddingHorizontal: 16, paddingVertical: 12, borderRadius: RADIUS.md },
  navBtnText:    { fontSize: FONTS.sm, color: COLORS.textPrimary, fontWeight: '600' },
  submitBtn:     { backgroundColor: COLORS.accent, paddingHorizontal: 28, paddingVertical: 12, borderRadius: RADIUS.md },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: FONTS.sm },

  // Score / review
  scoreHeader:    { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 52, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: 10 },
  closeBtn:       { padding: 4 },
  scoreBadge:     { flex: 1, alignItems: 'center' },
  scoreNum:       { fontSize: FONTS.xxl, fontWeight: '700', color: COLORS.textPrimary },
  scoreLabel:     { fontSize: FONTS.sm, color: COLORS.textSecondary, marginTop: 2 },
  reattemptBtn:   { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.accentGlow, paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.accent },
  reattemptText:  { fontSize: FONTS.xs, color: COLORS.accent, fontWeight: '700' },
  reviewList:     { flex: 1, padding: 16 },
  reviewScoreBanner: { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  reviewScoreText:   { fontSize: FONTS.lg, fontWeight: '700', color: COLORS.textPrimary },
  reviewScoreDate:   { fontSize: FONTS.xs, color: COLORS.textMuted },
  reviewCard:     { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, padding: 14, marginBottom: 12 },
  reviewQHeader:  { marginBottom: 8 },
  reviewBadge:    { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, alignSelf: 'flex-start' },
  reviewBadgeText: { fontSize: FONTS.xs, fontWeight: '700' },
  reviewQuestion: { fontSize: FONTS.sm, fontWeight: '600', color: COLORS.textPrimary, lineHeight: 20, marginBottom: 10 },
  reviewOption:   { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: RADIUS.md, padding: 10, marginBottom: 6, borderWidth: 1.5 },
  reviewOptionLetter: { fontSize: FONTS.xs, fontWeight: '700', color: COLORS.textSecondary, width: 16 },
  reviewOptionText:   { flex: 1, fontSize: FONTS.xs, color: COLORS.textSecondary, lineHeight: 18 },
  explanationBox: { flexDirection: 'row', gap: 8, backgroundColor: COLORS.amber + '15', borderRadius: RADIUS.md, padding: 10, marginTop: 8, alignItems: 'flex-start' },
  explanationText: { flex: 1, fontSize: FONTS.xs, color: COLORS.textSecondary, lineHeight: 18 },
  saveCloseBtn:   { backgroundColor: COLORS.card, padding: 14, borderRadius: RADIUS.md, alignItems: 'center', marginTop: 8 },
  saveCloseBtnTxt: { color: COLORS.textPrimary, fontWeight: '600', fontSize: FONTS.sm },
  saveCloseBtnText: { color: COLORS.textPrimary, fontWeight: '600', fontSize: FONTS.sm },
  reattemptFullBtn: { backgroundColor: COLORS.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: RADIUS.md, marginTop: 8 },
  reattemptFullBtnText: { color: '#fff', fontWeight: '700', fontSize: FONTS.md },

  // Review header
  reviewHeader:      { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, paddingTop: 52, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  reviewHeaderTitle: { flex: 1, fontSize: FONTS.md, fontWeight: '700', color: COLORS.textPrimary },
});
