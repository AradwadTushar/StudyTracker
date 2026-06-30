import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SYLLABUS } from '../data/subjects';

const KEYS = {
  sessions: 'st_sessions',
  syllabus: 'st_syllabus',
  deferred: 'st_deferred',
  notes: 'st_notes',
  activeSession: 'st_active',
  goals: 'st_goals',
  activeGoalId: 'st_activeGoalId',
  onboarded: 'st_onboarded',
  userName: 'st_userName',
  geminiKey: 'st_geminiKey',
};

// Build initial syllabus — new model: { id, topic, done, subtopics:[] }
const buildInitialSyllabus = () => {
  const state = {};
  Object.entries(SYLLABUS).forEach(([subject, topics]) => {
    state[subject] = topics.map((t) => ({
      id: t.id,
      topic: t.topic,
      done: false,
      subtopics: t.subtopics || [],
    }));
  });
  return state;
};

export const useStore = create((set, get) => ({

  // ── UI state ──────────────────────────────────────────────────────
  fullScreenModalOpen: false,
  setFullScreenModalOpen: (open) => set({ fullScreenModalOpen: open }),

  // ── Onboarding ────────────────────────────────────────────────────
  onboarded: false,
  userName: '',
  geminiKey: '',

  completeOnboarding: async (name, apiKey, loadGate = false, loadCdac = false) => {
    await AsyncStorage.setItem(KEYS.onboarded, 'true');
    await AsyncStorage.setItem(KEYS.userName, name || '');
    await AsyncStorage.setItem(KEYS.geminiKey, apiKey || '');

    set({
      onboarded: true,
      userName: name || '',
      geminiKey: apiKey || '',
    });
  },

  // ── Sessions ──────────────────────────────────────────────────────
  sessions: [],
  activeSession: null,

  startSession: (type, topic, subject) => {
    const session = { type, topic, subject, startTime: Date.now() };
    set({ activeSession: session });
    AsyncStorage.setItem(KEYS.activeSession, JSON.stringify(session));
  },

  endSession: () => {
    const { activeSession, sessions } = get();
    if (!activeSession) return;
    const endTime = Date.now();
    const duration = Math.floor((endTime - activeSession.startTime) / 1000);
    if (duration < 5) { set({ activeSession: null }); return; }
    const completed = { ...activeSession, endTime, duration, id: `${Date.now()}` };
    const updated = [completed, ...sessions].slice(0, 200);
    set({ sessions: updated, activeSession: null });
    AsyncStorage.setItem(KEYS.sessions, JSON.stringify(updated));
    AsyncStorage.removeItem(KEYS.activeSession);
  },

  clearActiveSession: () => {
    set({ activeSession: null });
    AsyncStorage.removeItem(KEYS.activeSession);
  },

  // ── Syllabus ──────────────────────────────────────────────────────
  syllabus: buildInitialSyllabus(),

  toggleTopic: (subject, topicId) => {
    const { syllabus } = get();
    const updated = {
      ...syllabus,
      [subject]: syllabus[subject].map((t) =>
        t.id === topicId ? { ...t, done: !t.done } : t
      ),
    };
    set({ syllabus: updated });
    AsyncStorage.setItem(KEYS.syllabus, JSON.stringify(updated));
  },

  addCustomTopic: (subject, topicName) => {
    const { syllabus } = get();
    const newTopic = { id: `c_${Date.now()}`, topic: topicName, done: false, subtopics: [] };
    const updated = { ...syllabus, [subject]: [...(syllabus[subject] || []), newTopic] };
    set({ syllabus: updated });
    AsyncStorage.setItem(KEYS.syllabus, JSON.stringify(updated));
  },

  deleteTopic: (subject, topicId) => {
    const { syllabus } = get();
    const updated = { ...syllabus, [subject]: syllabus[subject].filter((t) => t.id !== topicId) };
    set({ syllabus: updated });
    AsyncStorage.setItem(KEYS.syllabus, JSON.stringify(updated));
  },

  // Subtopics — reference only, no checkboxes
  addSubtopic: (subject, topicId, subtopicText) => {
    const { syllabus } = get();
    const updated = {
      ...syllabus,
      [subject]: syllabus[subject].map((t) =>
        t.id === topicId
          ? { ...t, subtopics: [...(t.subtopics || []), subtopicText] }
          : t
      ),
    };
    set({ syllabus: updated });
    AsyncStorage.setItem(KEYS.syllabus, JSON.stringify(updated));
  },

  deleteSubtopic: (subject, topicId, subtopicIndex) => {
    const { syllabus } = get();
    const updated = {
      ...syllabus,
      [subject]: syllabus[subject].map((t) =>
        t.id === topicId
          ? { ...t, subtopics: t.subtopics.filter((_, i) => i !== subtopicIndex) }
          : t
      ),
    };
    set({ syllabus: updated });
    AsyncStorage.setItem(KEYS.syllabus, JSON.stringify(updated));
  },

  addSubject: (subjectName) => {
    const current = get().syllabus;
    if (current[subjectName] !== undefined) return;
    const updated = { ...current, [subjectName]: [] };
    set({ syllabus: updated });
    AsyncStorage.setItem(KEYS.syllabus, JSON.stringify(updated));
  },

  deleteSubject: (subjectName) => {
    const { syllabus, goals } = get();
    const updated = { ...syllabus };
    delete updated[subjectName];
    const updatedGoals = (goals || []).map((g) => ({
      ...g, subjects: (g.subjects || []).filter((s) => s !== subjectName),
    }));
    set({ syllabus: updated, goals: updatedGoals });
    AsyncStorage.setItem(KEYS.syllabus, JSON.stringify(updated));
    AsyncStorage.setItem(KEYS.goals, JSON.stringify(updatedGoals));
  },

  // Bulk add topics from Pip's syllabus parse
  bulkAddTopics: (subject, topicsArray) => {
    const { syllabus } = get();
    const existing = syllabus[subject] || [];
    const existingTopics = new Set(existing.map(t => t.topic.toLowerCase()));
    const newTopics = topicsArray
      .filter(t => t.topic && !existingTopics.has(t.topic.toLowerCase()))
      .map(t => ({ id: `bulk_${Date.now()}_${Math.random().toString(36).slice(2)}`, topic: t.topic, done: false, subtopics: t.subtopics || [] }));
    const updated = { ...get().syllabus, [subject]: [...existing, ...newTopics] };
    set({ syllabus: updated });
    AsyncStorage.setItem(KEYS.syllabus, JSON.stringify(updated));
    return newTopics.length;
  },

  // ── Daily fact ───────────────────────────────────────────────────────
  dailyFact: null,       // { text, date }
  setDailyFact: (text) => {
    const fact = { text, date: new Date().toDateString() };
    set({ dailyFact: fact });
    AsyncStorage.setItem('st_dailyfact', JSON.stringify(fact));
  },

  // ── Goals ─────────────────────────────────────────────────────────
  // { id, name, color, subjects:[], done:false }
  goals: [],
  activeGoalId: null,

  addGoal: (name, color) => {
    const { goals } = get();
    const newGoal = { id: `g_${Date.now()}`, name, color, subjects: [], done: false };
    const updated = [...goals, newGoal];
    const newActiveId = goals.length === 0 ? newGoal.id : get().activeGoalId;
    set({ goals: updated, activeGoalId: newActiveId });
    AsyncStorage.setItem(KEYS.goals, JSON.stringify(updated));
    AsyncStorage.setItem(KEYS.activeGoalId, newActiveId || '');
  },

  markGoalDone: (id) => {
    const { goals, activeGoalId } = get();
    const updated = goals.map(g => g.id === id ? { ...g, done: true } : g);
    let newActiveId = activeGoalId;
    if (activeGoalId === id) {
      const nextGoal = updated.find(g => !g.done);
      newActiveId = nextGoal ? nextGoal.id : null;
    }
    set({ goals: updated, activeGoalId: newActiveId });
    AsyncStorage.setItem(KEYS.goals, JSON.stringify(updated));
    AsyncStorage.setItem(KEYS.activeGoalId, newActiveId || '');
  },

  setActiveGoal: (id) => {
    set({ activeGoalId: id });
    AsyncStorage.setItem(KEYS.activeGoalId, id || '');
  },

  deleteGoal: (id) => {
    const { goals, activeGoalId } = get();
    const updated = goals.filter(g => g.id !== id);
    let newActiveId = activeGoalId;
    if (activeGoalId === id) {
      const next = updated.find(g => !g.done);
      newActiveId = next ? next.id : null;
    }
    set({ goals: updated, activeGoalId: newActiveId });
    AsyncStorage.setItem(KEYS.goals, JSON.stringify(updated));
    AsyncStorage.setItem(KEYS.activeGoalId, newActiveId || '');
  },

  addSubjectToGoal: (goalId, subjectName) => {
    const updated = get().goals.map(g =>
      g.id === goalId && !(g.subjects || []).includes(subjectName)
        ? { ...g, subjects: [...(g.subjects || []), subjectName] }
        : g
    );
    set({ goals: updated });
    AsyncStorage.setItem(KEYS.goals, JSON.stringify(updated));
  },

  removeSubjectFromGoal: (goalId, subjectName) => {
    const updated = get().goals.map(g =>
      g.id === goalId ? { ...g, subjects: (g.subjects || []).filter(s => s !== subjectName) } : g
    );
    set({ goals: updated });
    AsyncStorage.setItem(KEYS.goals, JSON.stringify(updated));
  },

  // ── Deferred ──────────────────────────────────────────────────────
  deferred: [],

  addDeferred: (text, subject, priority, color) => {
    const rotations = [-4, -2, -1, 0, 1, 2, 3, 4];
    const note = {
      id: `d_${Date.now()}`, text, subject, priority, color,
      rotation: rotations[Math.floor(Math.random() * rotations.length)],
      done: false, createdAt: Date.now(),
    };
    const updated = [note, ...get().deferred];
    set({ deferred: updated });
    AsyncStorage.setItem(KEYS.deferred, JSON.stringify(updated));
  },

  toggleDeferred: (id) => {
    const updated = get().deferred.map(d => d.id === id ? { ...d, done: !d.done } : d);
    set({ deferred: updated });
    AsyncStorage.setItem(KEYS.deferred, JSON.stringify(updated));
  },

  deleteDeferred: (id) => {
    const updated = get().deferred.filter(d => d.id !== id);
    set({ deferred: updated });
    AsyncStorage.setItem(KEYS.deferred, JSON.stringify(updated));
  },

  // ── Notes ─────────────────────────────────────────────────────────
  notes: [],

  addNote: (title, content, subject) => {
    const note = { id:`n_${Date.now()}`, title, content, subject, createdAt:Date.now(), updatedAt:Date.now() };
    const updated = [note, ...get().notes];
    set({ notes: updated });
    AsyncStorage.setItem(KEYS.notes, JSON.stringify(updated));
    return note.id;
  },

  updateNote: (id, title, content, subject) => {
    const updated = get().notes.map(n =>
      n.id === id ? { ...n, title, content, subject, updatedAt: Date.now() } : n
    );
    set({ notes: updated });
    AsyncStorage.setItem(KEYS.notes, JSON.stringify(updated));
  },

  deleteNote: (id) => {
    const updated = get().notes.filter(n => n.id !== id);
    set({ notes: updated });
    AsyncStorage.setItem(KEYS.notes, JSON.stringify(updated));
  },

  // ── Load all ──────────────────────────────────────────────────────
  loadAll: async () => {
    try {
      const [sessionsRaw, syllabusRaw, deferredRaw, notesRaw, activeRaw, goalsRaw, activeGoalRaw] =
        await Promise.all([
          AsyncStorage.getItem(KEYS.sessions),
          AsyncStorage.getItem(KEYS.syllabus),
          AsyncStorage.getItem(KEYS.deferred),
          AsyncStorage.getItem(KEYS.notes),
          AsyncStorage.getItem(KEYS.activeSession),
          AsyncStorage.getItem(KEYS.goals),
          AsyncStorage.getItem(KEYS.activeGoalId),
        ]);

      const updates = {};
      if (sessionsRaw)   updates.sessions      = JSON.parse(sessionsRaw);
      if (deferredRaw)   updates.deferred      = JSON.parse(deferredRaw);
      if (notesRaw)      updates.notes         = JSON.parse(notesRaw);
      if (activeRaw)     updates.activeSession = JSON.parse(activeRaw);
      if (goalsRaw)      updates.goals         = JSON.parse(goalsRaw);
      if (activeGoalRaw) updates.activeGoalId  = activeGoalRaw || null;

      if (syllabusRaw) {
        const saved = JSON.parse(syllabusRaw);
        const defaults = buildInitialSyllabus();
        const merged = { ...saved };
        Object.keys(merged).forEach(sub => {
          merged[sub] = merged[sub].map(t => ({
            ...t,
            subtopics: t.subtopics || [],
          }));
        });
        Object.keys(defaults).forEach(sub => {
          if (!merged[sub]) {
            merged[sub] = defaults[sub];
          } else {
            const savedIds = new Set(merged[sub].map(t => t.id));
            const newTopics = defaults[sub].filter(t => !savedIds.has(t.id));
            if (newTopics.length) merged[sub] = [...merged[sub], ...newTopics];
          }
        });
        updates.syllabus = merged;
      }

      // Load onboarding state
      const onboardedRaw = await AsyncStorage.getItem(KEYS.onboarded);
      const userNameRaw  = await AsyncStorage.getItem(KEYS.userName);
      const geminiKeyRaw = await AsyncStorage.getItem(KEYS.geminiKey);
      if (onboardedRaw === 'true') updates.onboarded = true;
      if (userNameRaw)  updates.userName  = userNameRaw;
      if (geminiKeyRaw) updates.geminiKey = geminiKeyRaw;

      set(updates);

      // Migration: ensure Compiler Design and Theory of Computation exist
      try {
        const { GATE_SYLLABUS_TOPICS } = require('../data/subjects');
        const currentSyl = get().syllabus;
        let syllabusChanged = false;
        ['Compiler Design', 'Theory of Computation'].forEach(sub => {
          if (!currentSyl[sub] || currentSyl[sub].length === 0) {
            const topics = (GATE_SYLLABUS_TOPICS[sub] || []).map(t => ({
              id: `mig_${Date.now()}_${Math.random().toString(36).slice(2)}`,
              topic: t.topic, done: false, subtopics: t.subtopics || []
            }));
            currentSyl[sub] = topics;
            syllabusChanged = true;
          }
        });
        if (syllabusChanged) {
          set({ syllabus: { ...currentSyl } });
          await AsyncStorage.setItem(KEYS.syllabus, JSON.stringify(currentSyl));
        }
      } catch (e) {}

      // Auto-create or fix GATE 2027 goal
      const { SUBJECTS } = require('../data/subjects');
      const existingGoals = get().goals || [];
      if (existingGoals.length === 0) {
        const gateGoal = { id: 'g_gate2027', name: 'GATE 2027', color: '#6C63FF', subjects: [...SUBJECTS], done: false };
        const cdacGoal = { id: 'g_cdac', name: 'C-DAC', color: '#2DD4A0', subjects: [], done: false };
        const defaultGoals = [gateGoal, cdacGoal];
        set({ goals: defaultGoals, activeGoalId: 'g_gate2027' });
        AsyncStorage.setItem(KEYS.goals, JSON.stringify(defaultGoals));
        AsyncStorage.setItem(KEYS.activeGoalId, 'g_gate2027');
      } else {
        let changed = false;
        const fixedGoals = existingGoals.map(g => {
          if ((g.name === 'GATE 2027' || g.name === 'GATE') && (!g.subjects || g.subjects.length === 0)) {
            changed = true;
            return { ...g, subjects: [...SUBJECTS] };
          }
          return g;
        });
        if (changed) {
          set({ goals: fixedGoals });
          AsyncStorage.setItem(KEYS.goals, JSON.stringify(fixedGoals));
        }
      }

      // Load daily fact
      try {
        const factRaw = await AsyncStorage.getItem('st_dailyfact');
        if (factRaw) {
          const fact = JSON.parse(factRaw);
          if (fact.date === new Date().toDateString()) set({ dailyFact: fact });
        }
      } catch {}

    } catch (e) {
      console.warn('Store load error:', e);
    }
  },
}));
