import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  Modal, Pressable, TextInput, ScrollView, Image,
  KeyboardAvoidingView, Platform, ActivityIndicator, Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';
import { COLORS, FONTS, RADIUS, SHADOW } from '../utils/theme';

// ── Images ────────────────────────────────────────────────────────────────────
const PIP_IMAGES = {
  idle:        require('../../assets/pip/Pip_Idle.png'),
  reading:     require('../../assets/pip/Pip_Reading.png'),
  happy:       require('../../assets/pip/Pip_Happy.png'),
  excited:     require('../../assets/pip/Pip_Exieted.png'),
  thinking:    require('../../assets/pip/Pip_Thinking.png'),
  sleeping:    require('../../assets/pip/PIp_Sleeping.png'),
  surprised:   require('../../assets/pip/Pip_Surprised.png'),
  waving:      require('../../assets/pip/Pip_Waving.png'),
  celebrating: require('../../assets/pip/Pip_Celebrating.png'),
};

// ── Gemini ────────────────────────────────────────────────────────────────────
const GEMINI_MODEL_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=';

async function askGemini(prompt, maxTokens = 500, apiKey = '') {
  if (!apiKey) throw new Error('No API key set. Add it in onboarding or settings.');
  const res = await fetch(GEMINI_MODEL_URL + apiKey, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: maxTokens, temperature: 0.9 },
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(`Gemini ${data.error.code}: ${data.error.message}`);
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error(`No content returned.`);
  return text;
}

// ── State detection (mild triggers) ──────────────────────────────────────────
function getMascotState({ activeSession, todayStudySec, lastBreakSec, syllabusOverallPct, hour, isFirstOpenToday, justCompletedTopic }) {
  // First open of the day → wave hello
  if (isFirstOpenToday) return 'waving';
  // Celebrating a completed topic or 4h+ 
  if (justCompletedTopic || todayStudySec > 14400) return 'celebrating';
  // Actively studying session running
  if (activeSession?.type === 'study') {
    if (todayStudySec > 7200) return 'excited';   // 2h+ studied
    return 'reading';
  }
  // On a break
  if (activeSession?.type === 'break') {
    if (lastBreakSec > 900) return 'surprised';   // 15+ min break
    return 'thinking';
  }
  // No session running
  if (hour >= 22 || hour < 6) return 'sleeping';  // Late night / early morning
  if (todayStudySec > 3600)   return 'happy';     // 1h+ studied today
  if (todayStudySec > 0)      return 'thinking';  // Some study done, idle now
  return 'idle';
}

const STATES = {
  idle:        { lines: ["Tap me to chat! 💬", "Ready when you are 📚", "What are we studying today?", "I'm here whenever you need me~"] },
  reading:     { lines: ["Deep focus mode 🎯", "You're doing great!", "One topic at a time 📖", "Keep it up!"] },
  happy:       { lines: ["Great progress today! 🔥", "You're on a roll!", "Keep this momentum going!", "Proud of you! 💪"] },
  excited:     { lines: ["2 hours already?! 🤩", "You're absolutely crushing it!", "GATE won't know what hit it!", "This energy is everything! ⚡"] },
  thinking:    { lines: ["Taking a break? 🤔", "Rest those eyes a bit!", "Thinking of what to study next?", "I'm here if you need help~"] },
  sleeping:    { lines: ["zzz... still up? 😴", "Late night grind...", "Don't forget to sleep!", "Even owls need rest 🌙"] },
  surprised:   { lines: ["Whoa, long break! 😮", "The syllabus misses you...", "Everything okay? Let's get back!", "15 mins already — time to focus!"] },
  waving:      { lines: ["Good to see you! 👋", "Welcome back! Ready to study?", "Hey! Let's have a great session!", "Hoot hoot! Let's go! 🦉"] },
  celebrating: { lines: ["AMAZING!!! 🎉", "You absolute legend!", "This calls for a celebration!", "Look at you go!! 🏆"] },
};

// ── Subject aliases for fuzzy matching ───────────────────────────────────────
const SUBJECT_ALIASES = {
  // Compiler Design
  'compiler design': 'Compiler Design', 'cd': 'Compiler Design',
  'compilers': 'Compiler Design', 'compiler': 'Compiler Design',
  'compiler construction': 'Compiler Design',
  // Theory of Computation
  'theory of computation': 'Theory of Computation', 'toc': 'Theory of Computation',
  'automata': 'Theory of Computation', 'formal languages': 'Theory of Computation',
  'theory of automata': 'Theory of Computation',
  // COA / Digital Logic
  'computer organization': 'COA', 'coa': 'COA',
  'computer organization and architecture': 'COA',
  'digital logic': 'COA', 'digital circuits': 'COA', 'dl': 'COA',
  'digital electronics': 'COA', 'computer architecture': 'COA',
  // OS
  'operating systems': 'OS', 'os': 'OS', 'operating system': 'OS',
  // DBMS
  'database': 'DBMS', 'databases': 'DBMS', 'dbms': 'DBMS',
  'database management': 'DBMS', 'database management systems': 'DBMS',
  // CN
  'computer networks': 'Computer Networks', 'cn': 'Computer Networks',
  'networking': 'Computer Networks', 'data communications': 'Computer Networks',
  'data communication': 'Computer Networks',
  // DS
  'data structures': 'Data Structures', 'ds': 'Data Structures',
  'data structure': 'Data Structures',
  // Algorithms
  'algorithms': 'Algorithms', 'algo': 'Algorithms',
  'design and analysis of algorithms': 'Algorithms', 'daa': 'Algorithms',
  // C Programming
  'c programming': 'C Programming', 'programming in c': 'C Programming',
  'c language': 'C Programming', 'c': 'C Programming',
  // Discrete Maths
  'discrete mathematics': 'Discrete Maths', 'discrete maths': 'Discrete Maths',
  'discrete math': 'Discrete Maths', 'dm': 'Discrete Maths',
  'engineering mathematics': 'Discrete Maths', 'engineering maths': 'Discrete Maths',
  // Aptitude
  'aptitude': 'Aptitude / Quant', 'quantitative aptitude': 'Aptitude / Quant',
  'logical reasoning': 'Aptitude / Quant', 'reasoning': 'Aptitude / Quant',
  'general aptitude': 'Aptitude / Quant',
};

function resolveSubject(rawName, allSubjects) {
  const lower = rawName.toLowerCase().trim();
  // Direct alias match
  if (SUBJECT_ALIASES[lower]) return SUBJECT_ALIASES[lower];
  // Case-insensitive exact match against existing subjects
  const exact = allSubjects.find(s => s.toLowerCase() === lower);
  if (exact) return exact;
  // Partial match — subject name contains the raw name or vice versa
  const partial = allSubjects.find(s =>
    s.toLowerCase().includes(lower) || lower.includes(s.toLowerCase())
  );
  if (partial) return partial;
  // Return as-is (will create new subject)
  return rawName.trim();
}

// ── Syllabus parser ───────────────────────────────────────────────────────────
function buildSyllabusParsePrompt(rawText, allSubjects) {
  return (
    'You are a JSON generator. Parse this syllabus and output ONLY a raw JSON array. ' +
    'No markdown, no backticks, no explanation. Start with [ and end with ]. ' +
    'The syllabus may use any format: numbered sections, bullet points, colons, dashes. ' +
    'Detect section/subject names and their topics regardless of formatting. ' +
    'Output format: [{"subject":"SectionName","topic":"TopicName","subtopics":["a","b"]}] ' +
    'Use the ORIGINAL section name from the syllabus as "subject" — do NOT try to map it. ' +
    'Keep topics concise (under 8 words). Subtopics are short keywords. ' +
    'Syllabus text: ' + rawText.slice(0, 5000)
  );
}

// ── Pip Image with crossfade ──────────────────────────────────────────────────
function PipSprite({ pose, floatAnim, bounceAnim, swayAnim, scaleAnim, fadeAnim }) {
  return (
    <Animated.View style={[
      styles.pipWrap,
      {
        opacity: fadeAnim,
        transform: [
          { translateY: Animated.add(floatAnim, bounceAnim) },
          { rotate: swayAnim.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-4deg', '0deg', '4deg'] }) },
          { scale: scaleAnim },
        ],
      },
    ]}>
      <Image source={PIP_IMAGES[pose] || PIP_IMAGES.idle} style={styles.pipImage} resizeMode="contain" />
    </Animated.View>
  );
}

// ── Speech Bubble ─────────────────────────────────────────────────────────────
function Bubble({ text, fadeAnim }) {
  return (
    <Animated.View style={[styles.bubble, { opacity: fadeAnim }]}>
      <Text style={styles.bubbleText}>{text}</Text>
      <View style={styles.bubbleTail} />
    </Animated.View>
  );
}

// ── Chat Modal ────────────────────────────────────────────────────────────────
function ChatModal({ visible, onClose, appCtx }) {
  const [msgs,    setMsgs]    = useState([{ role: 'pip', text: "Hey! I'm Pip 🦉 — ask me anything or paste your syllabus to auto-import!" }]);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  const { syllabus, deferred, notes, todayStudySec, activeSession,
          bulkAddTopics, goals = [], addSubjectToGoal, geminiKey = '', userName = 'Tushar' } = appCtx;
  const allSubjects = Object.keys(syllabus || {});

  const buildCtx = (userMsg) => {
    const total   = allSubjects.reduce((a, s) => a + (syllabus[s]?.length || 0), 0);
    const done    = allSubjects.reduce((a, s) => a + (syllabus[s]?.filter(t => t.done).length || 0), 0);
    const pct     = total ? Math.round(done / total * 100) : 0;
    const hrs     = (todayStudySec / 3600).toFixed(1);
    const pending = (deferred || []).filter(d => !d.done).length;
    const activity = activeSession
      ? (activeSession.type === 'study' ? `studying ${activeSession.subject}` : 'on a break')
      : 'not studying';
    const history = msgs.slice(-6).map(m => `${m.role === 'user' ? userName : 'Pip'}: ${m.text}`).join('\n');
    return (
      `You are Pip, a witty caring owl study companion for ${userName} preparing for GATE CS and C-DAC C-CAT. ` +
      `Stats: ${hrs}h today, ${activity}, syllabus ${pct}% (${done}/${total}), ${pending} deferred, ${(notes || []).length} notes. ` +
      `Subjects: ${allSubjects.join(', ')}. ` +
      `Be concise (2-3 sentences). Reference real data. Be encouraging but honest. Use emojis occasionally.\n\n` +
      `${history}\n${userName}: ${userMsg}\nPip:`
    );
  };

  const handleSyllabusImport = async (rawText, importCmd = '') => {
    setMsgs(p => [...p, { role: 'pip', text: 'Parsing your syllabus... 🔍 (10-15 seconds)' }]);
    try {
      const prompt  = buildSyllabusParsePrompt(rawText, allSubjects);
      const reply   = await askGemini(prompt, 2048, geminiKey);
      const cleaned = reply.replace(/```json/gi, '').replace(/```/g, '').trim();
      const startIdx = cleaned.indexOf('[');
      const endIdx   = cleaned.lastIndexOf(']');
      if (startIdx === -1 || endIdx === -1) throw new Error('No JSON array found. Got: ' + cleaned.slice(0, 200));
      let jsonStr = cleaned.slice(startIdx, endIdx + 1);
      try { JSON.parse(jsonStr); } catch {
        const lastComplete = jsonStr.lastIndexOf('},');
        if (lastComplete > 0) jsonStr = jsonStr.slice(0, lastComplete + 1) + ']';
        else throw new Error('JSON truncated — try a shorter section.');
      }
      const parsed = JSON.parse(jsonStr);

      // Group by resolved subject name
      const bySubject = {};
      parsed.forEach(item => {
        // Resolve subject using aliases + fuzzy matching
        const resolvedSub = resolveSubject(item.subject, allSubjects);
        if (!bySubject[resolvedSub]) bySubject[resolvedSub] = [];
        bySubject[resolvedSub].push({ topic: item.topic, subtopics: item.subtopics || [] });
      });

      let totalAdded = 0;
      const addedSubjects = [];

      for (const [sub, topics] of Object.entries(bySubject)) {
        // Auto-create subject if it doesn't exist yet
        const currentSyllabus = useStore.getState().syllabus;
        if (currentSyllabus[sub] === undefined) {
          useStore.getState().addSubject(sub);
        }
        const added = bulkAddTopics(sub, topics);
        totalAdded += added;
        if (added > 0 || topics.length > 0) addedSubjects.push(sub);
      }

      // Link to goal if mentioned in import command
      if (addedSubjects.length > 0 && goals.length > 0 && addSubjectToGoal) {
        const goalMatch = goals.find(g => importCmd.toLowerCase().includes(g.name.toLowerCase()));
        if (goalMatch) {
          addedSubjects.forEach(sub => addSubjectToGoal(goalMatch.id, sub));
        }
      }

      const subList = addedSubjects.join(', ') || 'no matching subjects found';
      setMsgs(p => [...p, { role: 'pip', text: `Done! Added ${totalAdded} topics across ${addedSubjects.length} subjects: ${subList} ✅` }]);
    } catch (e) {
      setMsgs(p => [...p, { role: 'pip', text: `Parse error: ${e.message}` }]);
    }
    setLoading(false);
  };

  const send = async () => {
    const txt = input.trim();
    if (!txt || loading) return;
    setInput('');
    setMsgs(p => [...p, { role: 'user', text: txt }]);
    setLoading(true);
    const lower = txt.toLowerCase();

    if (lower.includes('import this syllabus') || lower.includes('import syllabus')) {
      const allUserMsgs = [...msgs.filter(m => m.role === 'user'), { role: 'user', text: txt }];
      const syllabusMsg = allUserMsgs
        .filter(m => m.text.length > 150 && !m.text.toLowerCase().includes('import'))
        .sort((a, b) => b.text.length - a.text.length)[0];
      if (syllabusMsg) {
        await handleSyllabusImport(syllabusMsg.text, txt);
      } else {
        setMsgs(p => [...p, { role: 'pip', text: 'Paste your syllabus text first, then type "import this syllabus".' }]);
        setLoading(false);
      }
      return;
    }

    if (txt.length > 300) {
      try {
        const reply = await askGemini(buildCtx(txt), 500, geminiKey);
        setMsgs(p => [...p, { role: 'pip', text: reply }]);
        setMsgs(p => [...p, { role: 'pip', text: '💡 Looks like a syllabus! Type "import this syllabus" to auto-add topics.' }]);
      } catch (e) {
        setMsgs(p => [...p, { role: 'pip', text: `Error: ${e.message}` }]);
      }
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
      return;
    }

    try {
      const reply = await askGemini(buildCtx(txt), 500, geminiKey);
      setMsgs(p => [...p, { role: 'pip', text: reply }]);
    } catch (e) {
      setMsgs(p => [...p, { role: 'pip', text: `Error: ${e.message}` }]);
    }
    setLoading(false);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const QUICK = ["Quiz me on OS 🎯", "What to study next?", "Explain virtual memory", "GATE tips?", "Motivate me!", "COA formulas?"];

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.chatOverlay} onPress={onClose}>
        <Pressable style={styles.chatSheet} onPress={() => {}}>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.chatHeader}>
              <Image source={PIP_IMAGES.waving} style={styles.chatPipImg} resizeMode="contain" />
              <View style={{ flex: 1 }}>
                <Text style={styles.chatName}>Pip</Text>
                <Text style={styles.chatSub}>Study companion · AI powered</Text>
              </View>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView ref={scrollRef} style={styles.msgList} showsVerticalScrollIndicator={false}
              onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
              {msgs.map((m, i) => (
                <View key={i} style={[styles.msgRow, m.role === 'user' && styles.msgRowUser]}>
                  {m.role === 'pip' && (
                    <Image source={PIP_IMAGES.idle} style={styles.msgPipImg} resizeMode="contain" />
                  )}
                  <View style={[styles.msgBubble, m.role === 'user' ? styles.bubbleUser : styles.bubbleBot]}>
                    <Text style={[styles.msgTxt, m.role === 'user' && { color: '#fff' }]}>{m.text}</Text>
                  </View>
                </View>
              ))}
              {loading && (
                <View style={styles.msgRow}>
                  <Image source={PIP_IMAGES.thinking} style={styles.msgPipImg} resizeMode="contain" />
                  <View style={styles.bubbleBot}>
                    <ActivityIndicator size="small" color={COLORS.accent} />
                  </View>
                </View>
              )}
            </ScrollView>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickRow}>
              {QUICK.map(q => (
                <TouchableOpacity key={q} style={styles.quickChip} onPress={() => setInput(q)}>
                  <Text style={styles.quickTxt}>{q}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.inputRow}>
              <TextInput
                style={styles.chatInput}
                placeholder="Ask Pip or paste your syllabus..."
                placeholderTextColor={COLORS.textMuted}
                value={input}
                onChangeText={setInput}
                onSubmitEditing={send}
                returnKeyType="send"
                multiline
              />
              <TouchableOpacity
                style={[styles.sendBtn, (!input.trim() || loading) && { opacity: 0.4 }]}
                onPress={send}
                disabled={!input.trim() || loading}>
                <Ionicons name="send" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Main Mascot ───────────────────────────────────────────────────────────────
export default function Mascot() {
  const {
    sessions, syllabus, deferred, notes, activeSession,
    bulkAddTopics, goals = [], addSubjectToGoal,
    setDailyFact, dailyFact, geminiKey, userName,
  } = useStore();

  const [showChat,   setShowChat]   = useState(false);
  const [pipVisible, setPipVisible] = useState(true);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Hide Pip on quiz screen - check route via navigation state
  useEffect(() => {
    // Re-show pip when chat closes
    if (!showChat) setPipVisible(true);
  }, [showChat]);
  const [pose,       setPose]       = useState('waving'); // start with wave
  const [lineIdx,    setLineIdx]    = useState(0);
  const [isFirstOpen, setIsFirstOpen] = useState(true);

  // Animations
  const floatAnim  = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const swayAnim   = useRef(new Animated.Value(0)).current;
  const scaleAnim  = useRef(new Animated.Value(1)).current;
  const fadeAnim   = useRef(new Animated.Value(1)).current;   // pip image fade
  const bubbleFade = useRef(new Animated.Value(1)).current;

  // Compute state
  const today = new Date().toDateString();
  const todaySessions  = sessions.filter(s => new Date(s.startTime).toDateString() === today);
  const todayStudySec  = todaySessions.filter(s => s.type === 'study').reduce((a, s) => a + s.duration, 0);
  const lastBreakSec   = activeSession?.type === 'break'
    ? Math.floor((Date.now() - activeSession.startTime) / 1000)
    : (todaySessions.filter(s => s.type === 'break').slice(-1)[0]?.duration || 0);
  const allSubs        = Object.keys(syllabus || {});
  const totalTopics    = allSubs.reduce((a, s) => a + (syllabus[s]?.length || 0), 0);
  const doneTopics     = allSubs.reduce((a, s) => a + (syllabus[s]?.filter(t => t.done).length || 0), 0);
  const syllabusOverallPct = totalTopics ? Math.round(doneTopics / totalTopics * 100) : 0;
  const hour = new Date().getHours();

  const appCtx = {
    activeSession, todayStudySec, lastBreakSec, syllabusOverallPct, hour,
    sessions, syllabus, deferred, notes, bulkAddTopics, goals, addSubjectToGoal,
    geminiKey: geminiKey || '', userName: userName || 'Tushar',
  };

  const targetState = getMascotState({ ...appCtx, isFirstOpenToday: isFirstOpen, justCompletedTopic: false });

  // Crossfade transition when pose changes
  const transitionToPose = useCallback((newPose) => {
    if (newPose === pose) return;
    Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
      setPose(newPose);
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1,   duration: 300, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1,   useNativeDriver: true, tension: 120, friction: 6, from: 0.85 }),
      ]).start();
    });
  }, [pose]);

  // Update pose when state changes
  useEffect(() => {
    // After first render, clear first-open flag after 4 seconds
    if (isFirstOpen) {
      const t = setTimeout(() => setIsFirstOpen(false), 4000);
      return () => clearTimeout(t);
    }
    transitionToPose(targetState);
  }, [targetState, isFirstOpen]);

  // Pose-specific animations
  useEffect(() => {
    floatAnim.stopAnimation();
    bounceAnim.stopAnimation();
    swayAnim.stopAnimation();
    floatAnim.setValue(0);
    bounceAnim.setValue(0);
    swayAnim.setValue(0);

    if (pose === 'sleeping') {
      // Gentle sway
      Animated.loop(Animated.sequence([
        Animated.timing(swayAnim, { toValue: 1,  duration: 1800, useNativeDriver: true }),
        Animated.timing(swayAnim, { toValue: -1, duration: 1800, useNativeDriver: true }),
        Animated.timing(swayAnim, { toValue: 0,  duration: 1800, useNativeDriver: true }),
      ])).start();
    } else if (pose === 'celebrating' || pose === 'excited') {
      // Bouncy jump x3 then float
      Animated.sequence([
        Animated.loop(Animated.sequence([
          Animated.timing(bounceAnim, { toValue: -14, duration: 280, useNativeDriver: true }),
          Animated.timing(bounceAnim, { toValue: 0,   duration: 280, useNativeDriver: true }),
        ]), { iterations: 4 }),
      ]).start(() => {
        Animated.loop(Animated.sequence([
          Animated.timing(floatAnim, { toValue: -5, duration: 1400, useNativeDriver: true }),
          Animated.timing(floatAnim, { toValue: 0,  duration: 1400, useNativeDriver: true }),
        ])).start();
      });
    } else if (pose === 'waving') {
      // Small side waggle
      Animated.loop(Animated.sequence([
        Animated.timing(swayAnim, { toValue: 0.6,  duration: 300, useNativeDriver: true }),
        Animated.timing(swayAnim, { toValue: -0.6, duration: 300, useNativeDriver: true }),
        Animated.timing(swayAnim, { toValue: 0,    duration: 300, useNativeDriver: true }),
      ]), { iterations: 4 }).start();
      // Also float
      Animated.loop(Animated.sequence([
        Animated.timing(floatAnim, { toValue: -5, duration: 1600, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0,  duration: 1600, useNativeDriver: true }),
      ])).start();
    } else if (pose === 'surprised') {
      // Quick scale pop
      Animated.sequence([
        Animated.spring(scaleAnim, { toValue: 1.15, useNativeDriver: true, tension: 200, friction: 4 }),
        Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true, tension: 100, friction: 8 }),
      ]).start();
      // Then float
      Animated.loop(Animated.sequence([
        Animated.timing(floatAnim, { toValue: -4, duration: 1600, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0,  duration: 1600, useNativeDriver: true }),
      ])).start();
    } else {
      // Default float for all other poses
      Animated.loop(Animated.sequence([
        Animated.timing(floatAnim, { toValue: -6, duration: 1800, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0,  duration: 1800, useNativeDriver: true }),
      ])).start();
    }
  }, [pose]);

  // Cycle bubble lines
  const lines = STATES[pose]?.lines || STATES.idle.lines;
  const bubbleLines = (dailyFact?.date === today && dailyFact?.text)
    ? [dailyFact.text, ...lines]
    : lines;

  useEffect(() => {
    bubbleFade.setValue(1);
    setLineIdx(0);
    const t = setInterval(() => {
      Animated.timing(bubbleFade, { toValue: 0, duration: 300, useNativeDriver: true }).start(({ finished }) => {
        if (!finished) return;
        setLineIdx(p => (p + 1) % bubbleLines.length);
        Animated.timing(bubbleFade, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      });
    }, 6000);
    return () => { clearInterval(t); bubbleFade.setValue(1); };
  }, [pose, bubbleLines.length]);

  // Daily fact
  useEffect(() => {
    if (!dailyFact || dailyFact.date !== today) {
      const key = useStore.getState().geminiKey;
      if (key) {
        askGemini(
          'Give one short (max 18 words) motivational study tip for a GATE CS exam student. Just the tip, no intro.',
          80, key
        ).then(text => {
          setDailyFact(text.trim().replace(/^["']|["']$/g, ''));
        }).catch(() => {});
      }
    }
  }, []);

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1.15, useNativeDriver: true, tension: 200, friction: 4 }),
      Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true, tension: 100, friction: 8 }),
    ]).start(() => setShowChat(true));
  };

  if (!pipVisible || keyboardVisible) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {!showChat && (
        <Bubble text={bubbleLines[lineIdx % bubbleLines.length]} fadeAnim={bubbleFade} />
      )}
      <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
        <PipSprite
          pose={pose}
          floatAnim={floatAnim}
          bounceAnim={bounceAnim}
          swayAnim={swayAnim}
          scaleAnim={scaleAnim}
          fadeAnim={fadeAnim}
        />
      </TouchableOpacity>
      <ChatModal visible={showChat} onClose={() => setShowChat(false)} appCtx={appCtx} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', bottom: 72, right: 14, alignItems: 'flex-end', zIndex: 999 },

  // Pip image
  pipWrap:  { width: 88, height: 88 },
  pipImage: { width: '100%', height: '100%' },

  // Bubble
  bubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5, borderColor: COLORS.accent,
    borderRadius: 14, paddingHorizontal: 11, paddingVertical: 8,
    maxWidth: 190, marginBottom: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4, elevation: 4,
  },
  bubbleText: { fontSize: 11, color: '#1A1A2E', fontWeight: '600', lineHeight: 16 },
  bubbleTail: {
    position: 'absolute', bottom: -8, right: 24,
    borderLeftWidth: 7, borderRightWidth: 7, borderTopWidth: 8,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderTopColor: COLORS.accent,
  },

  // Chat modal
  chatOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  chatSheet:   { backgroundColor: COLORS.surface, borderTopLeftRadius: 26, borderTopRightRadius: 26, height: '82%', paddingBottom: Platform.OS === 'ios' ? 24 : 0 },
  chatHeader:  { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  chatPipImg:  { width: 44, height: 44 },
  chatName:    { fontSize: FONTS.md, fontWeight: '700', color: COLORS.textPrimary },
  chatSub:     { fontSize: FONTS.xs, color: COLORS.textSecondary },
  msgList:     { flex: 1, padding: 14 },
  msgRow:      { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 10 },
  msgRowUser:  { flexDirection: 'row-reverse' },
  msgPipImg:   { width: 28, height: 28 },
  msgBubble:   { maxWidth: '76%', borderRadius: 16, padding: 10 },
  bubbleBot:   { backgroundColor: COLORS.card, borderBottomLeftRadius: 4 },
  bubbleUser:  { backgroundColor: COLORS.accent, borderBottomRightRadius: 4 },
  msgTxt:      { fontSize: FONTS.sm, color: COLORS.textPrimary, lineHeight: 20 },
  quickRow:    { paddingHorizontal: 12, paddingVertical: 6, borderTopWidth: 1, borderTopColor: COLORS.border, maxHeight: 44 },
  quickChip:   { backgroundColor: COLORS.card, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8, borderWidth: 1, borderColor: COLORS.border },
  quickTxt:    { fontSize: FONTS.xs, color: COLORS.textSecondary, fontWeight: '500' },
  inputRow:    { flexDirection: 'row', gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: COLORS.border, alignItems: 'flex-end' },
  chatInput:   { flex: 1, backgroundColor: COLORS.card, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 10, color: COLORS.textPrimary, fontSize: FONTS.sm, borderWidth: 1, borderColor: COLORS.border, maxHeight: 100 },
  sendBtn:     { backgroundColor: COLORS.accent, width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
});
