import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  Modal, TextInput, ScrollView, Alert, Linking, Platform,
  TouchableWithoutFeedback, SafeAreaView,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONTS, RADIUS, SHADOW } from '../utils/theme';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false,
  }),
});

async function requestNotifPermission() {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

async function scheduleReminder(title, body, date) {
  const granted = await requestNotifPermission();
  if (!granted) { Alert.alert('Permission needed', 'Allow notifications in phone settings.'); return null; }
  return await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: { date },
  });
}

function openAlarm(hour, minute) {
  if (Platform.OS === 'android') {
    const url = `intent:#Intent;action=android.intent.action.SET_ALARM;I.android.intent.extra.alarm.HOUR=${hour};I.android.intent.extra.alarm.MINUTES=${minute};Z.android.intent.extra.alarm.SKIP_UI=false;end`;
    Linking.openURL(url).catch(() => Alert.alert('Could not open Clock app'));
  } else {
    Alert.alert('Set Alarm', `Open Clock app and set for ${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`);
  }
}

// ── Calculator ────────────────────────────────────────────────────────────────
function Calculator({ onClose }) {
  const [display, setDisplay] = useState('0');
  const [expr,    setExpr]    = useState('');
  const [history, setHistory] = useState([]);

  const press = (val) => {
    if (val === 'C')  { setDisplay('0'); setExpr(''); return; }
    if (val === '⌫')  { setDisplay(s => s.length > 1 ? s.slice(0,-1) : '0'); return; }
    if (val === '=')  {
      try {
        const full = expr + display;
        const result = Function('"use strict";return(' + full + ')')();
        const out = parseFloat(result.toFixed(10)).toString();
        setHistory(h => [`${full} = ${out}`, ...h].slice(0,8));
        setExpr(''); setDisplay(out);
      } catch { setDisplay('Err'); setExpr(''); }
      return;
    }
    const jsVal = val==='×'?'*': val==='÷'?'/': val;
    const isOp  = ['+','-','*','/','%','(',')','.'].includes(jsVal);
    const sciMap = { sin:'Math.sin(', cos:'Math.cos(', tan:'Math.tan(',
      log:'Math.log10(', ln:'Math.log(', '√':'Math.sqrt(', 'x²':'**2', π:'Math.PI', e:'Math.E' };
    if (sciMap[val]) {
      if (val==='π') { setDisplay(String(Math.PI)); return; }
      if (val==='e') { setDisplay(String(Math.E));  return; }
      if (val==='x²') {
        // immediately square the current display value
        try {
          const result = parseFloat((parseFloat(display) ** 2).toFixed(10)).toString();
          setHistory(h => [`${display}² = ${result}`, ...h].slice(0,8));
          setExpr(''); setDisplay(result);
        } catch { setDisplay('Err'); }
        return;
      }
      // sin/cos/tan/log/ln/√ — open function waiting for input
      setExpr(expr + sciMap[val]); setDisplay('0'); return;
    }
    if (isOp) { setExpr(expr+display+jsVal); setDisplay('0'); return; }
    setDisplay(s => s==='0'||s==='Err' ? val : s+val);
  };

  const ROWS = [
    ['sin','cos','tan','⌫'],
    ['log','ln', '√',  'C'],
    ['(',  ')',  'x²', '%'],
    ['7',  '8',  '9',  '÷'],
    ['4',  '5',  '6',  '×'],
    ['1',  '2',  '3',  '-'],
    ['π',  '0',  '.',  '+'],
    ['e',  '00', '(',  '='],
  ];

  const btnBg = v => v==='='?COLORS.accent: ['÷','×','-','+','%'].includes(v)?'#252A42':
    ['sin','cos','tan','log','ln','√','x²','π','e'].includes(v)?'#1C2038':
    v==='C'?'#6B1A23': v==='⌫'?'#4A2A00': COLORS.card;

  return (
    <SafeAreaView style={cal.safe}>
      <View style={cal.header}>
        <Text style={cal.title}>Calculator 🧮</Text>
        <TouchableOpacity onPress={onClose}><Ionicons name="close" size={22} color={COLORS.textSecondary}/></TouchableOpacity>
      </View>
      {history.length > 0 && (
        <ScrollView style={cal.hist} showsVerticalScrollIndicator={false}>
          {history.map((h,i) => <Text key={i} style={cal.histTxt}>{h}</Text>)}
        </ScrollView>
      )}
      {expr ? <Text style={cal.expr} numberOfLines={1}>{expr}</Text> : null}
      <Text style={cal.display} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.4}>{display}</Text>
      <View style={cal.grid}>
        {ROWS.map((row,ri) => (
          <View key={ri} style={cal.row}>
            {row.map(b => (
              <TouchableOpacity key={b} style={[cal.btn, { backgroundColor: btnBg(b) }]} onPress={() => press(b)}>
                <Text style={[cal.btnTxt, b==='='&&{color:'#fff',fontWeight:'700'}]}>{b}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

const cal = StyleSheet.create({
  safe:    { flex:1, backgroundColor:COLORS.bg, paddingHorizontal:12 },
  header:  { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingVertical:14 },
  title:   { fontSize:FONTS.lg, fontWeight:'700', color:COLORS.textPrimary },
  hist:    { maxHeight:56, marginBottom:2 },
  histTxt: { fontSize:10, color:COLORS.textMuted, textAlign:'right', lineHeight:16 },
  expr:    { fontSize:FONTS.sm, color:COLORS.textSecondary, textAlign:'right', marginBottom:2, paddingHorizontal:4 },
  display: { fontSize:44, fontWeight:'200', color:COLORS.textPrimary, textAlign:'right', marginBottom:10, paddingHorizontal:4 },
  grid:    { gap:5, flex:1, justifyContent:'flex-end', paddingBottom:8 },
  row:     { flexDirection:'row', gap:5 },
  btn:     { flex:1, height:50, borderRadius:10, alignItems:'center', justifyContent:'center' },
  btnTxt:  { fontSize:FONTS.sm, color:COLORS.textPrimary, fontWeight:'500' },
});

// ── Reminders ─────────────────────────────────────────────────────────────────
function RemindersSheet({ onClose }) {
  const [reminders, setReminders] = useState([]);
  const [msg,  setMsg]  = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  useEffect(() => {
    AsyncStorage.getItem('st_reminders').then(r => { if(r) setReminders(JSON.parse(r)); });
  }, []);

  const save = async (updated) => {
    setReminders(updated);
    await AsyncStorage.setItem('st_reminders', JSON.stringify(updated));
  };

  // Auto-format date as DD/MM/YYYY
  const handleDateChange = (txt) => {
    const digits = txt.replace(/\D/g,'').slice(0,8);
    let out = digits;
    if (digits.length > 4) out = digits.slice(0,2)+'/'+digits.slice(2,4)+'/'+digits.slice(4);
    else if (digits.length > 2) out = digits.slice(0,2)+'/'+digits.slice(2);
    setDate(out);
  };

  // Auto-format time as HH:MM
  const handleTimeChange = (txt) => {
    const digits = txt.replace(/\D/g,'').slice(0,4);
    let out = digits;
    if (digits.length > 2) out = digits.slice(0,2)+':'+digits.slice(2);
    setTime(out);
  };

  const addReminder = async () => {
    if (!msg.trim()||!date.trim()||!time.trim()) {
      Alert.alert('Fill all fields'); return;
    }
    const parts = date.split('/');
    const tParts = time.split(':');
    if (parts.length!==3||tParts.length!==2) { Alert.alert('Use DD/MM/YYYY and HH:MM'); return; }
    const [d,m,y] = parts.map(Number);
    const [hh,mm] = tParts.map(Number);
    const fireDate = new Date(y, m-1, d, hh, mm, 0);
    if (isNaN(fireDate.getTime())||fireDate<=new Date()) { Alert.alert('Set a future date and time'); return; }
    const notifId = await scheduleReminder('📚 Study Reminder', msg.trim(), fireDate);
    if (!notifId) return;
    const r = { id:`r_${Date.now()}`, notifId, msg:msg.trim(), date, time, fireDate:fireDate.toISOString() };
    await save([r, ...reminders]);
    setMsg(''); setDate(''); setTime('');
    Alert.alert('Reminder set! 🔔', `${date} at ${time}`);
  };

  return (
    <SafeAreaView style={rem.safe}>
      <View style={rem.header}>
        <Text style={rem.title}>Reminders 🔔</Text>
        <TouchableOpacity onPress={onClose}><Ionicons name="close" size={22} color={COLORS.textSecondary}/></TouchableOpacity>
      </View>
      <TextInput style={rem.input} placeholder="Reminder message e.g. Practice OS scheduling"
        placeholderTextColor={COLORS.textMuted} value={msg} onChangeText={setMsg}/>
      <View style={rem.row}>
        <TextInput style={[rem.input,{flex:1}]} placeholder="DD/MM/YYYY"
          placeholderTextColor={COLORS.textMuted} value={date} onChangeText={handleDateChange}
          keyboardType="numeric" maxLength={10}/>
        <TextInput style={[rem.input,{flex:1}]} placeholder="HH:MM"
          placeholderTextColor={COLORS.textMuted} value={time} onChangeText={handleTimeChange}
          keyboardType="numeric" maxLength={5}/>
      </View>
      <TouchableOpacity style={rem.addBtn} onPress={addReminder}>
        <Ionicons name="alarm-outline" size={18} color="#fff"/>
        <Text style={rem.addBtnTxt}>Set Reminder</Text>
      </TouchableOpacity>
      <ScrollView style={{flex:1,marginTop:16}} showsVerticalScrollIndicator={false}>
        {reminders.length===0
          ? <Text style={rem.empty}>No reminders yet!</Text>
          : reminders.map(r => (
            <View key={r.id} style={rem.card}>
              <Ionicons name="notifications-outline" size={18} color={COLORS.accent} style={{marginTop:2}}/>
              <View style={{flex:1}}>
                <Text style={rem.cardMsg}>{r.msg}</Text>
                <Text style={rem.cardTime}>📅 {r.date} at {r.time}</Text>
              </View>
              <TouchableOpacity onPress={async()=>{
                await Notifications.cancelScheduledNotificationAsync(r.notifId);
                save(reminders.filter(x=>x.id!==r.id));
              }}>
                <Ionicons name="trash-outline" size={18} color={COLORS.red}/>
              </TouchableOpacity>
            </View>
          ))
        }
        <View style={{height:40}}/>
      </ScrollView>
    </SafeAreaView>
  );
}

const rem = StyleSheet.create({
  safe:      { flex:1, backgroundColor:COLORS.bg, paddingHorizontal:16 },
  header:    { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingVertical:14 },
  title:     { fontSize:FONTS.lg, fontWeight:'700', color:COLORS.textPrimary },
  input:     { backgroundColor:COLORS.card, borderRadius:RADIUS.md, padding:13, color:COLORS.textPrimary, fontSize:FONTS.md, borderWidth:1, borderColor:COLORS.border, marginBottom:10 },
  row:       { flexDirection:'row', gap:10 },
  addBtn:    { backgroundColor:COLORS.accent, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, padding:14, borderRadius:RADIUS.md },
  addBtnTxt: { color:'#fff', fontWeight:'700', fontSize:FONTS.sm },
  empty:     { textAlign:'center', color:COLORS.textMuted, fontSize:FONTS.sm, marginTop:40 },
  card:      { flexDirection:'row', alignItems:'flex-start', gap:10, backgroundColor:COLORS.card, borderRadius:RADIUS.md, padding:14, marginBottom:10, borderWidth:1, borderColor:COLORS.border },
  cardMsg:   { fontSize:FONTS.sm, color:COLORS.textPrimary, fontWeight:'600', marginBottom:4 },
  cardTime:  { fontSize:FONTS.xs, color:COLORS.textSecondary },
});

// ── Alarm ─────────────────────────────────────────────────────────────────────
function AlarmSheet({ onClose }) {
  const [hour,   setHour]   = useState('06');
  const [minute, setMinute] = useState('00');

  const PRESETS = [
    {label:'5:00 AM 🌅',h:5,m:0},{label:'6:00 AM ☀️',h:6,m:0},
    {label:'7:00 AM 📚',h:7,m:0},{label:'10:00 PM 🌙',h:22,m:0},{label:'11:00 PM 🦉',h:23,m:0},
  ];

  return (
    <SafeAreaView style={alm.safe}>
      <View style={alm.header}>
        <Text style={alm.title}>Set Alarm ⏰</Text>
        <TouchableOpacity onPress={onClose}><Ionicons name="close" size={22} color={COLORS.textSecondary}/></TouchableOpacity>
      </View>
      <Text style={alm.sub}>Opens your phone's native Clock app</Text>
      <View style={alm.timeRow}>
        <TextInput style={alm.timeInput} value={hour} onChangeText={v=>setHour(v.replace(/\D/g,'').slice(0,2))}
          keyboardType="numeric" maxLength={2} placeholder="HH" placeholderTextColor={COLORS.textMuted}/>
        <Text style={alm.colon}>:</Text>
        <TextInput style={alm.timeInput} value={minute} onChangeText={v=>setMinute(v.replace(/\D/g,'').slice(0,2))}
          keyboardType="numeric" maxLength={2} placeholder="MM" placeholderTextColor={COLORS.textMuted}/>
      </View>
      <TouchableOpacity style={alm.setBtn} onPress={()=>{openAlarm(parseInt(hour)||6,parseInt(minute)||0);onClose();}}>
        <Ionicons name="alarm-outline" size={20} color="#fff"/>
        <Text style={alm.setBtnTxt}>Open Clock App</Text>
      </TouchableOpacity>
      <Text style={alm.presetsLabel}>Quick presets</Text>
      <View style={alm.presets}>
        {PRESETS.map(p=>(
          <TouchableOpacity key={p.label} style={alm.preset}
            onPress={()=>{setHour(String(p.h).padStart(2,'0'));setMinute(String(p.m).padStart(2,'0'));}}>
            <Text style={alm.presetTxt}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const alm = StyleSheet.create({
  safe:        { flex:1, backgroundColor:COLORS.bg, paddingHorizontal:16 },
  header:      { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingVertical:14 },
  title:       { fontSize:FONTS.lg, fontWeight:'700', color:COLORS.textPrimary },
  sub:         { fontSize:FONTS.xs, color:COLORS.textSecondary, marginBottom:24 },
  timeRow:     { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:12, marginBottom:20 },
  timeInput:   { width:80, height:72, backgroundColor:COLORS.card, borderRadius:RADIUS.lg, textAlign:'center', fontSize:36, fontWeight:'200', color:COLORS.textPrimary, borderWidth:1, borderColor:COLORS.border },
  colon:       { fontSize:36, fontWeight:'200', color:COLORS.textSecondary },
  setBtn:      { backgroundColor:COLORS.accent, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, padding:14, borderRadius:RADIUS.md, marginBottom:24 },
  setBtnTxt:   { color:'#fff', fontWeight:'700', fontSize:FONTS.md },
  presetsLabel:{ fontSize:FONTS.xs, color:COLORS.textMuted, fontWeight:'600', textTransform:'uppercase', letterSpacing:0.5, marginBottom:10 },
  presets:     { flexDirection:'row', flexWrap:'wrap', gap:8 },
  preset:      { backgroundColor:COLORS.card, paddingHorizontal:12, paddingVertical:8, borderRadius:20, borderWidth:1, borderColor:COLORS.border },
  presetTxt:   { fontSize:FONTS.xs, color:COLORS.textSecondary, fontWeight:'500' },
});

// ── Formula Sheet ─────────────────────────────────────────────────────────────
const FORMULAS = {
  OS: [
    'CPU Util = 1 - pⁿ  (p = I/O fraction, n = processes)',
    'Turnaround = Completion − Arrival',
    'Waiting = Turnaround − Burst',
    'Response = First CPU − Arrival',
    'EAT (cache) = h·Tc + (1−h)·Tm',
    'EAT (VM) = (1−p)·ma + p·page_fault_time',
    'Throughput = jobs completed / time',
  ],
  COA: [
    'CPI = Clock cycles / Instruction count',
    'CPU Time = IC × CPI / Clock rate',
    'MIPS = Clock rate / (CPI × 10⁶)',
    'Speedup (Amdahl) = 1 / [(1−f) + f/S]',
    'Cache EAT = h·Tc + (1−h)·(Tc + Tm)',
    'IEEE 754 float: (−1)^S × 1.M × 2^(E−127)',
    '2s complement: invert all bits + 1',
  ],
  Algos: [
    'Master: T(n)=aT(n/b)+f(n)',
    '  Case1: f=O(n^log_b(a)−ε) → Θ(n^log_b(a))',
    '  Case2: f=Θ(n^log_b(a)) → Θ(n^log_b(a)·lgn)',
    '  Case3: f=Ω(n^log_b(a)+ε) → Θ(f(n))',
    'Quick Sort: avg O(n logn), worst O(n²)',
    'Merge Sort: O(n log n) always, O(n) space',
    'Dijkstra: O((V+E) log V) with min-heap',
    'Bellman-Ford: O(VE)',
    'Floyd-Warshall: O(V³)',
  ],
  DBMS: [
    'Relational: σ=select, π=project, ⋈=join',
    '1NF: atomic values',
    '2NF: 1NF + no partial dependency',
    '3NF: 2NF + no transitive dependency',
    'BCNF: every determinant is a candidate key',
    '2PL: growing phase → lock point → shrinking',
    'B+ tree order m: ⌈m/2⌉ to m pointers',
  ],
  CN: [
    'Shannon: C = B·log₂(1 + S/N)',
    'Nyquist: C = 2B·log₂(M)',
    'BDP = Bandwidth × RTT',
    'Subnet hosts = 2^(32−prefix) − 2',
    'TCP throughput ≈ Window size / RTT',
    'CRC: msg ÷ generator (mod 2)',
    'Hamming dist ≥ 2d+1 to correct d errors',
  ],
  DiscMath: [
    'nPr = n! / (n−r)!',
    'nCr = n! / r!(n−r)!',
    '|A∪B| = |A|+|B|−|A∩B|',
    'Bayes: P(A|B) = P(B|A)·P(A) / P(B)',
    'Handshake: Σdeg(v) = 2|E|',
    'Euler circuit: all vertices even degree',
    'Tree: V = E + 1',
    'Pigeonhole: n+1 items in n boxes → ≥2 share',
  ],
};

function FormulaSheet({ onClose }) {
  const [active, setActive] = useState('OS');
  const subjects = Object.keys(FORMULAS);

  return (
    <SafeAreaView style={frm.safe}>
      <View style={frm.header}>
        <Text style={frm.title}>Formula Sheet 📐</Text>
        <TouchableOpacity onPress={onClose}><Ionicons name="close" size={22} color={COLORS.textSecondary}/></TouchableOpacity>
      </View>

      {/* Subject tabs — horizontal scroll */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={frm.tabScroll} contentContainerStyle={frm.tabContent}>
        {subjects.map(s => (
          <TouchableOpacity key={s} style={[frm.tab, active===s && frm.tabActive]} onPress={()=>setActive(s)}>
            <Text style={[frm.tabTxt, active===s && frm.tabTxtActive]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Formulas list */}
      <ScrollView style={frm.list} showsVerticalScrollIndicator={false}>
        {FORMULAS[active].map((f,i) => (
          <View key={i} style={frm.row}>
            {!f.startsWith('  ') && <View style={frm.dot}/>}
            <Text style={[frm.txt, f.startsWith('  ') && frm.indented]} selectable>{f.trim()}</Text>
          </View>
        ))}
        <View style={{height:60}}/>
      </ScrollView>
    </SafeAreaView>
  );
}

const frm = StyleSheet.create({
  safe:       { flex:1, backgroundColor:COLORS.bg, paddingHorizontal:16 },
  header:     { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingVertical:14 },
  title:      { fontSize:FONTS.lg, fontWeight:'700', color:COLORS.textPrimary },
  tabScroll:  { flexGrow:0, marginBottom:14 },
  tabContent: { flexDirection:'row', gap:8, paddingVertical:4 },
  tab:        { paddingHorizontal:14, paddingVertical:8, borderRadius:20, borderWidth:1, borderColor:COLORS.border, backgroundColor:COLORS.card },
  tabActive:  { backgroundColor:COLORS.accentGlow, borderColor:COLORS.accent },
  tabTxt:     { fontSize:FONTS.xs, color:COLORS.textMuted, fontWeight:'600' },
  tabTxtActive:{ color:COLORS.accentLight },
  list:       { flex:1 },
  row:        { flexDirection:'row', gap:10, paddingVertical:9, borderBottomWidth:1, borderBottomColor:COLORS.border+'33', alignItems:'flex-start' },
  dot:        { width:6, height:6, borderRadius:3, backgroundColor:COLORS.accent, marginTop:6, flexShrink:0 },
  txt:        { flex:1, fontSize:FONTS.sm, color:COLORS.textSecondary, lineHeight:21, fontFamily:Platform.OS==='ios'?'Courier New':'monospace' },
  indented:   { color:COLORS.textMuted, fontSize:12, paddingLeft:8 },
});

// ── Unit Converter ────────────────────────────────────────────────────────────
const CONVERTERS = {
  Length: {
    units: ['m','km','cm','mm','ft','in','mi'],
    toBase: { m:1, km:1000, cm:0.01, mm:0.001, ft:0.3048, in:0.0254, mi:1609.34 },
  },
  Weight: {
    units: ['kg','g','mg','lb','oz','ton'],
    toBase: { kg:1, g:0.001, mg:0.000001, lb:0.453592, oz:0.0283495, ton:1000 },
  },
  Time: {
    units: ['s','min','hr','day','week','ms'],
    toBase: { s:1, min:60, hr:3600, day:86400, week:604800, ms:0.001 },
  },
  Speed: {
    units: ['m/s','km/h','mph','knot'],
    toBase: { 'm/s':1, 'km/h':0.277778, mph:0.44704, knot:0.514444 },
  },
  Data: {
    units: ['B','KB','MB','GB','TB'],
    toBase: { B:1, KB:1024, MB:1048576, GB:1073741824, TB:1099511627776 },
  },
  Temp: { units: ['°C','°F','K'], toBase: null }, // special case
};

function convertTemp(val, from, to) {
  let celsius;
  if (from==='°C') celsius = val;
  else if (from==='°F') celsius = (val-32)*5/9;
  else celsius = val-273.15;
  if (to==='°C') return celsius;
  if (to==='°F') return celsius*9/5+32;
  return celsius+273.15;
}

function UnitConverter({ onClose }) {
  const [category, setCategory] = useState('Length');
  const [fromUnit, setFromUnit] = useState('m');
  const [toUnit,   setToUnit]   = useState('km');
  const [input,    setInput]    = useState('');
  const cats = Object.keys(CONVERTERS);

  useEffect(() => {
    const units = CONVERTERS[category].units;
    setFromUnit(units[0]); setToUnit(units[1]); setInput('');
  }, [category]);

  const convert = () => {
    const val = parseFloat(input);
    if (isNaN(val)) return '—';
    if (category==='Temp') {
      return parseFloat(convertTemp(val,fromUnit,toUnit).toFixed(6)).toString();
    }
    const base = val * CONVERTERS[category].toBase[fromUnit];
    return parseFloat((base / CONVERTERS[category].toBase[toUnit]).toFixed(8)).toString();
  };

  const units = CONVERTERS[category].units;
  const result = input ? convert() : '';

  return (
    <SafeAreaView style={uc.safe}>
      <View style={uc.header}>
        <Text style={uc.title}>Unit Converter 📏</Text>
        <TouchableOpacity onPress={onClose}><Ionicons name="close" size={22} color={COLORS.textSecondary}/></TouchableOpacity>
      </View>

      {/* Category pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{flexGrow:0,marginBottom:16}} contentContainerStyle={{gap:8,paddingVertical:4}}>
        {cats.map(c => (
          <TouchableOpacity key={c} style={[uc.catPill, category===c && uc.catPillActive]} onPress={()=>setCategory(c)}>
            <Text style={[uc.catTxt, category===c && uc.catTxtActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* From/To selectors */}
      <View style={uc.convRow}>
        <View style={uc.side}>
          <Text style={uc.sideLabel}>From</Text>
          <ScrollView style={uc.unitList} showsVerticalScrollIndicator={false}>
            {units.map(u => (
              <TouchableOpacity key={u} style={[uc.unitBtn, fromUnit===u && uc.unitBtnActive]} onPress={()=>setFromUnit(u)}>
                <Text style={[uc.unitTxt, fromUnit===u && uc.unitTxtActive]}>{u}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={uc.arrowCol}>
          <Ionicons name="swap-horizontal" size={22} color={COLORS.accent}
            onPress={()=>{setFromUnit(toUnit);setToUnit(fromUnit);}} style={{marginTop:36}}/>
        </View>

        <View style={uc.side}>
          <Text style={uc.sideLabel}>To</Text>
          <ScrollView style={uc.unitList} showsVerticalScrollIndicator={false}>
            {units.map(u => (
              <TouchableOpacity key={u} style={[uc.unitBtn, toUnit===u && uc.unitBtnActive]} onPress={()=>setToUnit(u)}>
                <Text style={[uc.unitTxt, toUnit===u && uc.unitTxtActive]}>{u}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Input + result */}
      <TextInput style={uc.input} placeholder={`Enter value in ${fromUnit}...`}
        placeholderTextColor={COLORS.textMuted} value={input} onChangeText={setInput}
        keyboardType="numeric"/>
      {result ? (
        <View style={uc.resultCard}>
          <Text style={uc.resultLabel}>{input} {fromUnit} =</Text>
          <Text style={uc.resultVal}>{result} {toUnit}</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const uc = StyleSheet.create({
  safe:         { flex:1, backgroundColor:COLORS.bg, paddingHorizontal:16 },
  header:       { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingVertical:14 },
  title:        { fontSize:FONTS.lg, fontWeight:'700', color:COLORS.textPrimary },
  catPill:      { paddingHorizontal:14, paddingVertical:7, borderRadius:20, borderWidth:1, borderColor:COLORS.border, backgroundColor:COLORS.card },
  catPillActive:{ backgroundColor:COLORS.accentGlow, borderColor:COLORS.accent },
  catTxt:       { fontSize:FONTS.xs, color:COLORS.textMuted, fontWeight:'600' },
  catTxtActive: { color:COLORS.accentLight },
  convRow:      { flexDirection:'row', gap:8, height:180, marginBottom:16 },
  side:         { flex:1 },
  sideLabel:    { fontSize:FONTS.xs, color:COLORS.textSecondary, fontWeight:'600', marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 },
  unitList:     { flex:1, backgroundColor:COLORS.card, borderRadius:RADIUS.md, borderWidth:1, borderColor:COLORS.border },
  unitBtn:      { paddingVertical:9, paddingHorizontal:12, borderBottomWidth:1, borderBottomColor:COLORS.border+'44' },
  unitBtnActive:{ backgroundColor:COLORS.accentGlow },
  unitTxt:      { fontSize:FONTS.sm, color:COLORS.textSecondary, fontWeight:'500' },
  unitTxtActive:{ color:COLORS.accentLight, fontWeight:'700' },
  arrowCol:     { justifyContent:'flex-start', alignItems:'center', paddingTop:4 },
  input:        { backgroundColor:COLORS.card, borderRadius:RADIUS.md, padding:14, color:COLORS.textPrimary, fontSize:FONTS.lg, borderWidth:1, borderColor:COLORS.border, marginBottom:12 },
  resultCard:   { backgroundColor:COLORS.accentGlow, borderRadius:RADIUS.md, padding:16, borderWidth:1, borderColor:COLORS.accent, alignItems:'center' },
  resultLabel:  { fontSize:FONTS.sm, color:COLORS.textSecondary, marginBottom:4 },
  resultVal:    { fontSize:FONTS.xl, fontWeight:'700', color:COLORS.accentLight },
});


// ── Water Tracker ─────────────────────────────────────────────────────────────
function WaterTracker({ onClose }) {
  const [glassesCount, setGlassesCount] = React.useState(0);
  const [glassSize,    setGlassSize]    = React.useState(250);
  const [reminderMins, setReminderMins] = React.useState(45);
  const [goalMl,       setGoalMl]       = React.useState(2000);
  const GLASS_SIZES   = [150, 200, 250, 300, 350];
  const REMINDER_OPTS = [20, 30, 45, 60, 90];

  React.useEffect(() => {
    AsyncStorage.getItem('st_water').then(r => {
      if (r) {
        const d = JSON.parse(r);
        const today = new Date().toDateString();
        if (d.date === today) {
          setGlassesCount(d.count || 0);
          setGlassSize(d.glassSize || 250);
          setReminderMins(d.reminderMins || 45);
          setGoalMl(d.goalMl || 2000);
        }
      }
    });
  }, []);

  const save = async (count, gs, rm, gml) => {
    const data = { date: new Date().toDateString(), count, glassSize: gs, reminderMins: rm, goalMl: gml };
    await AsyncStorage.setItem('st_water', JSON.stringify(data));
  };

  const drink = async () => {
    const next = glassesCount + 1;
    setGlassesCount(next);
    await save(next, glassSize, reminderMins, goalMl);
    // Schedule next reminder
    try {
      await Notifications.scheduleNotificationAsync({
        content: { title: '💧 Time to hydrate!', body: 'Drink a glass of water — your brain needs it!', sound: true },
        trigger: { seconds: reminderMins * 60 },
      });
    } catch {}
  };

  const reset = async () => {
    setGlassesCount(0);
    await save(0, glassSize, reminderMins, goalMl);
  };

  const totalMl   = glassesCount * glassSize;
  const pct       = Math.min(Math.round(totalMl / goalMl * 100), 100);
  const glassGoal = Math.ceil(goalMl / glassSize);

  return (
    <SafeAreaView style={wtr.safe}>
      <View style={wtr.header}>
        <Text style={wtr.title}>💧 Hydration Station</Text>
        <TouchableOpacity onPress={onClose}><Ionicons name="close" size={22} color={COLORS.textSecondary}/></TouchableOpacity>
      </View>

      <View style={wtr.progressCard}>
        <Text style={wtr.progressLabel}>Today's Progress</Text>
        <Text style={wtr.progressMl}>🎯 {totalMl} ml / {goalMl} ml</Text>
        <View style={wtr.barTrack}>
          <View style={[wtr.barFill, { width: pct + '%' }]}/>
        </View>
        <Text style={wtr.pctText}>{pct}%  ·  {glassesCount} / {glassGoal} glasses</Text>
      </View>

      <View style={wtr.settingsCard}>
        <Text style={wtr.settingsTitle}>⚙️ Quick Settings</Text>
        <View style={wtr.settingRow}>
          <Text style={wtr.settingLabel}>Glass Size</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{flexDirection:'row',gap:6}}>
              {GLASS_SIZES.map(s => (
                <TouchableOpacity key={s} style={[wtr.pill, glassSize===s && wtr.pillActive]} onPress={async()=>{setGlassSize(s);await save(glassesCount,s,reminderMins,goalMl);}}>
                  <Text style={[wtr.pillText, glassSize===s && wtr.pillTextActive]}>{s} ml</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
        <View style={wtr.settingRow}>
          <Text style={wtr.settingLabel}>Remind every</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{flexDirection:'row',gap:6}}>
              {REMINDER_OPTS.map(r => (
                <TouchableOpacity key={r} style={[wtr.pill, reminderMins===r && wtr.pillActive]} onPress={async()=>{setReminderMins(r);await save(glassesCount,glassSize,r,goalMl);}}>
                  <Text style={[wtr.pillText, reminderMins===r && wtr.pillTextActive]}>{r} min</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>

      <TouchableOpacity style={wtr.drinkBtn} onPress={drink}>
        <Text style={wtr.drinkIcon}>🚰</Text>
        <Text style={wtr.drinkBtnText}>DRINK 1 GLASS</Text>
        <Text style={wtr.drinkSub}>(+{glassSize} ml)</Text>
      </TouchableOpacity>

      <TouchableOpacity style={wtr.resetBtn} onPress={reset}>
        <Ionicons name="refresh" size={14} color={COLORS.textMuted}/>
        <Text style={wtr.resetText}>Reset for Today</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const wtr = StyleSheet.create({
  safe:         { flex:1, backgroundColor:COLORS.bg, padding:16 },
  header:       { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:16 },
  title:        { fontSize:FONTS.lg, fontWeight:'700', color:COLORS.textPrimary },
  progressCard: { backgroundColor:COLORS.card, borderRadius:RADIUS.lg, padding:16, marginBottom:14, borderWidth:1, borderColor:COLORS.border },
  progressLabel:{ fontSize:FONTS.xs, color:COLORS.textSecondary, fontWeight:'600', marginBottom:6 },
  progressMl:   { fontSize:FONTS.lg, fontWeight:'700', color:COLORS.textPrimary, marginBottom:12 },
  barTrack:     { height:12, backgroundColor:COLORS.border, borderRadius:6, overflow:'hidden', marginBottom:8 },
  barFill:      { height:'100%', backgroundColor:'#3B9EFF', borderRadius:6 },
  pctText:      { fontSize:FONTS.xs, color:COLORS.textSecondary },
  settingsCard: { backgroundColor:COLORS.card, borderRadius:RADIUS.lg, padding:14, marginBottom:16, borderWidth:1, borderColor:COLORS.border, gap:12 },
  settingsTitle:{ fontSize:FONTS.sm, fontWeight:'700', color:COLORS.textPrimary, marginBottom:4 },
  settingRow:   { gap:8 },
  settingLabel: { fontSize:FONTS.xs, color:COLORS.textSecondary, fontWeight:'600' },
  pill:         { paddingHorizontal:12, paddingVertical:6, borderRadius:20, borderWidth:1, borderColor:COLORS.border, backgroundColor:COLORS.bg },
  pillActive:   { backgroundColor:'#3B9EFF'+ '33', borderColor:'#3B9EFF' },
  pillText:     { fontSize:FONTS.xs, color:COLORS.textMuted, fontWeight:'500' },
  pillTextActive:{ color:'#3B9EFF', fontWeight:'700' },
  drinkBtn:     { backgroundColor:'#1A3A5C', borderRadius:RADIUS.lg, padding:20, alignItems:'center', borderWidth:2, borderColor:'#3B9EFF', marginBottom:12 },
  drinkIcon:    { fontSize:32, marginBottom:4 },
  drinkBtnText: { fontSize:FONTS.lg, fontWeight:'900', color:'#3B9EFF', letterSpacing:1 },
  drinkSub:     { fontSize:FONTS.xs, color:'#3B9EFF', opacity:0.7, marginTop:2 },
  resetBtn:     { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:6, paddingVertical:12 },
  resetText:    { fontSize:FONTS.xs, color:COLORS.textMuted },
});

// ── FAB Wheel ─────────────────────────────────────────────────────────────────
const TOOLS = [
  { id:'calc',      icon:'calculator-outline',       label:'Calc',      color:'#6C63FF' },
  { id:'reminder',  icon:'alarm-outline',             label:'Remind',    color:'#2DD4A0' },
  { id:'alarm',     icon:'time-outline',              label:'Alarm',     color:'#F5A623' },
  { id:'formula',   icon:'flask-outline',             label:'Formulas',  color:'#FF5C6C' },
  { id:'converter', icon:'swap-horizontal-outline',   label:'Units',     color:'#74B9FF' },
  { id:'water',     icon:'water-outline',             label:'Water',     color:'#3B9EFF' },
];

export default function FloatingTools() {
  const [open,       setOpen]       = useState(false);
  const [activeTool, setActiveTool] = useState(null);
  const spinAnim  = useRef(new Animated.Value(0)).current;
  const itemAnims = useRef(TOOLS.map(()=>new Animated.Value(0))).current;

  const toggle = (forceClose = false) => {
    const toOpen = forceClose ? false : !open;
    setOpen(toOpen);
    Animated.parallel([
      Animated.spring(spinAnim, { toValue:toOpen?1:0, useNativeDriver:true, tension:60, friction:8 }),
      ...itemAnims.map((a,i) => Animated.spring(a, {
        toValue: toOpen?1:0,
        useNativeDriver:true,
        tension:80, friction:8,
        delay: toOpen ? i*55 : (TOOLS.length-1-i)*35,
      })),
    ]).start();
  };

  const openTool = (id) => {
    toggle(true);
    setTimeout(()=>setActiveTool(id), 200);
  };

  const spin = spinAnim.interpolate({ inputRange:[0,1], outputRange:['0deg','135deg'] });

  const SPACING = 58;

  return (
    <>
      {/* Full-screen backdrop when open */}
      {open && (
        <TouchableWithoutFeedback onPress={()=>toggle(true)}>
          <View style={styles.backdrop}/>
        </TouchableWithoutFeedback>
      )}

      <View style={styles.container} pointerEvents="box-none">
        {TOOLS.map((tool,i) => {
          const ty   = itemAnims[i].interpolate({ inputRange:[0,1], outputRange:[0,-(SPACING*(i+1))] });
          const sc   = itemAnims[i].interpolate({ inputRange:[0,1], outputRange:[0.3,1] });
          const op   = itemAnims[i];
          return (
            <Animated.View key={tool.id} style={[styles.toolRow, { transform:[{translateY:ty},{scale:sc}], opacity:op }]} pointerEvents={open?'auto':'none'}>
              <Text style={styles.toolLabel}>{tool.label}</Text>
              <TouchableOpacity style={[styles.toolBtn,{backgroundColor:tool.color}]} onPress={()=>openTool(tool.id)}>
                <Ionicons name={tool.icon} size={19} color="#fff"/>
              </TouchableOpacity>
            </Animated.View>
          );
        })}

        <TouchableOpacity style={styles.fab} onPress={()=>toggle()} activeOpacity={0.85}>
          <Animated.View style={{transform:[{rotate:spin}]}}>
            <Ionicons name="add" size={28} color="#fff"/>
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Tool modals */}
      <Modal visible={activeTool==='calc'}      animationType="slide" onRequestClose={()=>setActiveTool(null)}><Calculator     onClose={()=>setActiveTool(null)}/></Modal>
      <Modal visible={activeTool==='reminder'}  animationType="slide" onRequestClose={()=>setActiveTool(null)}><RemindersSheet onClose={()=>setActiveTool(null)}/></Modal>
      <Modal visible={activeTool==='alarm'}     animationType="slide" onRequestClose={()=>setActiveTool(null)}><AlarmSheet     onClose={()=>setActiveTool(null)}/></Modal>
      <Modal visible={activeTool==='formula'}   animationType="slide" onRequestClose={()=>setActiveTool(null)}><FormulaSheet   onClose={()=>setActiveTool(null)}/></Modal>
      <Modal visible={activeTool==='converter'} animationType="slide" onRequestClose={()=>setActiveTool(null)}><UnitConverter  onClose={()=>setActiveTool(null)}/></Modal>
      <Modal visible={activeTool==='water'}     animationType="slide" onRequestClose={()=>setActiveTool(null)}><WaterTracker   onClose={()=>setActiveTool(null)}/></Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop:  { position:'absolute', top:0, left:0, right:0, bottom:0, zIndex:997, backgroundColor:'rgba(0,0,0,0.45)' },
  container: { position:'absolute', bottom:90, left:16, alignItems:'center', zIndex:998 },
  fab:       { width:52, height:52, borderRadius:26, backgroundColor:COLORS.accent, alignItems:'center', justifyContent:'center', ...SHADOW.glow },
  toolRow:   { position:'absolute', bottom:0, flexDirection:'row', alignItems:'center', gap:10 },
  toolLabel: { backgroundColor:COLORS.surface, paddingHorizontal:10, paddingVertical:5, borderRadius:12, fontSize:FONTS.xs, color:COLORS.textPrimary, fontWeight:'600', borderWidth:1, borderColor:COLORS.border },
  toolBtn:   { width:44, height:44, borderRadius:22, alignItems:'center', justifyContent:'center', ...SHADOW.card },
});
