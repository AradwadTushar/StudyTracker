import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image as RNImage } from 'react-native';
import { COLORS, FONTS, RADIUS, SHADOW } from '../utils/theme';

const PIP_ONBOARD_IMAGES = {
  0: require('../../assets/pip/Pip_Waving.png'),
  1: require('../../assets/pip/Pip_Idle.png'),
  2: require('../../assets/pip/Pip_Thinking.png'),
  3: require('../../assets/pip/Pip_Reading.png'),
};

function ChibiOwl({ step = 0 }) {
  return (
    <RNImage
      source={PIP_ONBOARD_IMAGES[step] || PIP_ONBOARD_IMAGES[0]}
      style={{
        width: 160,
        height: 160,
      }}
      resizeMode="contain"
    />
  );
}

export default function OnboardingScreen({ onComplete }) {
  const insets = useSafeAreaInsets();
  const [step,        setStep]        = useState(0); // 0=welcome, 1=name, 2=apikey, 3=syllabus
  const [name,        setName]        = useState('');
  const [apiKey,      setApiKey]      = useState('');
  const [loadGate,    setLoadGate]    = useState(true);
  const [loadCdac,    setLoadCdac]    = useState(false);
  const [showKey,     setShowKey]     = useState(false);

  const steps = [
    { title: "Meet Pip 🦉", sub: "Your personal study companion for GATE & C-DAC" },
    { title: "What's your name?", sub: "Pip will use this to cheer you on" },
    { title: "Gemini API Key", sub: "Powers Pip's AI brain — free tier works great" },
    { title: "Default Syllabus", sub: "Pre-load topics so you can start tracking immediately" },
  ];

  const canNext = () => {
    if (step === 1) return name.trim().length > 0;
    return true; // API key and syllabus are optional
  };

  const handleNext = () => {
    if (step < 3) { setStep(s => s + 1); return; }
    // Done
    if (!name.trim()) { Alert.alert('Please enter your name'); return; }
    onComplete({ name: name.trim(), apiKey: apiKey.trim(), loadGate, loadCdac });
  };

  return (
    <View style={[styles.safe, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Progress dots */}
      <View style={styles.dots}>
        {[0,1,2,3].map(i => (
          <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
        ))}
      </View>

      <KeyboardAvoidingView style={{ flex:1 }} behavior={Platform.OS==='ios'?'padding':undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* Owl */}
          <View style={styles.owlWrap}>
            <ChibiOwl step={step} />
          </View>

          {/* Step title */}
          <Text style={styles.title}>{steps[step].title}</Text>
          <Text style={styles.sub}>{steps[step].sub}</Text>

          {/* Step 0: Welcome */}
          {step === 0 && (
            <View style={styles.featureList}>
              {[
                { icon:'timer-outline',     color:COLORS.green,  text:'Track every study session' },
                { icon:'book-outline',      color:COLORS.accent, text:'Manage your full GATE syllabus' },
                { icon:'layers-outline',    color:COLORS.amber,  text:'Pin topics to study later' },
                { icon:'calculator-outline',color:COLORS.blue,   text:'Scientific calculator & tools' },
                { icon:'notifications-outline', color:'#FF8FAB', text:'Smart reminders & alarms' },
              ].map(f => (
                <View key={f.text} style={styles.featureRow}>
                  <View style={[styles.featureIcon, { backgroundColor: f.color+'22' }]}>
                    <Ionicons name={f.icon} size={20} color={f.color} />
                  </View>
                  <Text style={styles.featureText}>{f.text}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Step 1: Name */}
          {step === 1 && (
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                placeholder="Enter your name..."
                placeholderTextColor={COLORS.textMuted}
                value={name}
                onChangeText={setName}
                autoFocus
                maxLength={30}
              />
              <Text style={styles.inputHint}>Pip will greet you by name every day 🌅</Text>
            </View>
          )}

          {/* Step 2: API Key */}
          {step === 2 && (
            <View style={styles.inputWrap}>
              <View style={styles.keyRow}>
                <TextInput
                  style={[styles.input, { flex:1 }]}
                  placeholder="Paste your Gemini API key..."
                  placeholderTextColor={COLORS.textMuted}
                  value={apiKey}
                  onChangeText={setApiKey}
                  secureTextEntry={!showKey}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowKey(s=>!s)}>
                  <Ionicons name={showKey?'eye-off-outline':'eye-outline'} size={20} color={COLORS.textSecondary}/>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.linkBtn} onPress={() => {}}>
                <Ionicons name="open-outline" size={14} color={COLORS.accent}/>
                <Text style={styles.linkText}>Get free key at aistudio.google.com</Text>
              </TouchableOpacity>
              <Text style={styles.inputHint}>
                Optional but recommended. Without it Pip can still help with static content.
              </Text>
              <View style={styles.skipRow}>
                <TouchableOpacity onPress={() => setStep(3)}>
                  <Text style={styles.skipText}>Skip for now →</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Step 3: Syllabus */}
          {step === 3 && (
            <View style={styles.syllabusWrap}>
              <TouchableOpacity
                style={[styles.syllabusOption, loadGate && styles.syllabusOptionActive]}
                onPress={() => setLoadGate(s=>!s)}
              >
                <View style={styles.syllabusLeft}>
                  <View style={[styles.syllabusCheck, loadGate && styles.syllabusCheckActive]}>
                    {loadGate && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </View>
                  <View>
                    <Text style={styles.syllabusTitle}>GATE CS 2026</Text>
                    <Text style={styles.syllabusSub}>10 sections · Engineering Maths, COA, OS, DBMS, CN + more</Text>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.syllabusOption, loadCdac && styles.syllabusOptionActive]}
                onPress={() => setLoadCdac(s=>!s)}
              >
                <View style={styles.syllabusLeft}>
                  <View style={[styles.syllabusCheck, loadCdac && styles.syllabusCheckActive, { backgroundColor: loadCdac ? COLORS.green : 'transparent' }]}>
                    {loadCdac && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </View>
                  <View>
                    <Text style={styles.syllabusTitle}>C-DAC C-CAT</Text>
                    <Text style={styles.syllabusSub}>C Programming, OOP, DS, OS, Networking + more</Text>
                  </View>
                </View>
              </TouchableOpacity>

              <Text style={styles.inputHint}>You can always add more subjects and topics later.</Text>
            </View>
          )}
        </ScrollView>

        {/* Next / Done button */}
        <View style={styles.btnWrap}>
          <TouchableOpacity
            style={[styles.nextBtn, !canNext() && { opacity:0.45 }]}
            onPress={handleNext}
            disabled={!canNext()}
          >
            <Text style={styles.nextBtnText}>{step === 3 ? "Let's go! 🚀" : "Continue"}</Text>
            {step < 3 && <Ionicons name="arrow-forward" size={20} color="#fff" />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:    { flex:1, backgroundColor:COLORS.bg },
  dots:    { flexDirection:'row', gap:8, justifyContent:'center', paddingTop:16 },
  dot:     { width:6, height:6, borderRadius:3, backgroundColor:COLORS.border },
  dotActive:{ width:20, backgroundColor:COLORS.accent },
  content: { alignItems:'center', paddingHorizontal:24, paddingBottom:20 },
  owlWrap: {
    marginTop: 20,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
},
  title:   { fontSize:FONTS.xxl, fontWeight:'700', color:COLORS.textPrimary, textAlign:'center', marginBottom:8 },
  sub:     { fontSize:FONTS.sm, color:COLORS.textSecondary, textAlign:'center', marginBottom:28, lineHeight:20 },
  featureList: { width:'100%', gap:12 },
  featureRow:  { flexDirection:'row', alignItems:'center', gap:14 },
  featureIcon: { width:40, height:40, borderRadius:20, alignItems:'center', justifyContent:'center' },
  featureText: { fontSize:FONTS.md, color:COLORS.textPrimary, fontWeight:'500' },
  inputWrap: { width:'100%', gap:10 },
  keyRow:    { flexDirection:'row', alignItems:'center', gap:8 },
  input: {
    backgroundColor:COLORS.card, borderRadius:RADIUS.md, padding:14,
    color:COLORS.textPrimary, fontSize:FONTS.md, borderWidth:1, borderColor:COLORS.border,
  },
  eyeBtn:    { padding:14, backgroundColor:COLORS.card, borderRadius:RADIUS.md, borderWidth:1, borderColor:COLORS.border },
  linkBtn:   { flexDirection:'row', alignItems:'center', gap:6 },
  linkText:  { fontSize:FONTS.xs, color:COLORS.accent, fontWeight:'600' },
  inputHint: { fontSize:FONTS.xs, color:COLORS.textMuted, lineHeight:18 },
  skipRow:   { alignItems:'flex-end' },
  skipText:  { fontSize:FONTS.sm, color:COLORS.textMuted },
  syllabusWrap:  { width:'100%', gap:12 },
  syllabusOption:{ backgroundColor:COLORS.card, borderRadius:RADIUS.lg, padding:16, borderWidth:1.5, borderColor:COLORS.border },
  syllabusOptionActive: { borderColor:COLORS.accent, backgroundColor:COLORS.accentGlow },
  syllabusLeft:  { flexDirection:'row', alignItems:'flex-start', gap:12 },
  syllabusCheck: { width:22, height:22, borderRadius:11, borderWidth:2, borderColor:COLORS.border, alignItems:'center', justifyContent:'center', backgroundColor:'transparent', marginTop:2 },
  syllabusCheckActive: { backgroundColor:COLORS.accent, borderColor:COLORS.accent },
  syllabusTitle: { fontSize:FONTS.md, fontWeight:'700', color:COLORS.textPrimary, marginBottom:4 },
  syllabusSub:   { fontSize:FONTS.xs, color:COLORS.textSecondary, lineHeight:17 },
  btnWrap: { paddingHorizontal:24, paddingBottom:16, paddingTop:8 },
  nextBtn: { backgroundColor:COLORS.accent, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:10, padding:16, borderRadius:RADIUS.lg, ...SHADOW.glow },
  nextBtnText: { color:'#fff', fontSize:FONTS.lg, fontWeight:'700' },
});
