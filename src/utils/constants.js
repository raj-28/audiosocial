// src/utils/constants.js

export const C = {
  bg:          '#08080A',
  surface:     '#111114',
  surfaceHigh: '#18181C',
  border:      'rgba(255,255,255,0.07)',
  borderHigh:  'rgba(255,255,255,0.12)',
  text:        '#F4F4F5',
  sub:         '#A1A1AA',
  muted:       '#52525B',
  ghost:       '#3F3F46',
  brand:       '#FF3366',
  brandDim:    'rgba(255,51,102,0.15)',
  success:     '#A3E635',
  error:       '#FB7185',
};

// Moods — icon is now a text string name for Ionicons (bundled TTF)
export const MOODS = {
  HEALING:    { color: '#A3E635', icon: 'leaf',              label: 'HEALING'    },
  EXHAUSTION: { color: '#FB7185', icon: 'flower',            label: 'EXHAUSTION' },
  ANGER:      { color: '#FF3366', icon: 'flame',             label: 'ANGER'      },
  JOY:        { color: '#FACC15', icon: 'sunny',             label: 'JOY'        },
  LONELINESS: { color: '#60A5FA', icon: 'moon',              label: 'LONELINESS' },
  HOPE:       { color: '#F472B6', icon: 'heart',             label: 'HOPE'       },
  RAGE:       { color: '#FF4500', icon: 'thunderstorm',      label: 'RAGE'       },
  NUMB:       { color: '#71717A', icon: 'remove-circle',     label: 'NUMB'       },
  COCKROACH:  { color: '#D4AF37', icon: 'shield',            label: 'COCKROACH'  },
  DEMAND:     { color: '#C084FC', icon: 'megaphone',         label: 'DEMAND'     },
  WITNESS:    { color: '#38BDF8', icon: 'eye',               label: 'WITNESS'    },
};

export const BADGE_LEVELS = [
  { iconName: 'shield-outline',  name: 'Cockroach',      pts: 100,   desc: 'started speaking',     color: '#D4AF37' },
  { iconName: 'shield-half',     name: 'Colony',         pts: 500,   desc: 'others echoed you',    color: '#D4AF37' },
  { iconName: 'shield',          name: 'Swarm',          pts: 2000,  desc: 'spread across zones',  color: '#FF3366' },
  { iconName: 'diamond',         name: 'Indestructible', pts: 10000, desc: 'reached every state',  color: '#60A5FA' },
];

export const TOPICS = [
  { id: 'neet',  label: 'NEET 2026',          iconName: 'document-text', color: '#FF4500', voices: 48320, delta: '+12.4k/6h' },
  { id: 'cjp',   label: 'Cockroach Party',    iconName: 'shield',        color: '#D4AF37', voices: 31440, delta: '+8.1k/3h'  },
  { id: 'jobs',  label: 'Youth Unemployment', iconName: 'briefcase',     color: '#FB7185', voices: 28200, delta: '+3.2k/6h'  },
  { id: 'media', label: 'Godi Media',         iconName: 'tv',            color: '#FF3366', voices: 19800, delta: '+1.8k/6h'  },
  { id: 'vote',  label: 'Vote Deletion',      iconName: 'checkbox',      color: '#C084FC', voices: 14600, delta: '+2.1k/6h'  },
  { id: '3am',   label: '3am Thoughts',       iconName: 'moon',          color: '#60A5FA', voices: 11200, delta: 'steady'    },
  { id: 'love',  label: 'Relationships',      iconName: 'heart-broken',  color: '#F472B6', voices: 8700,  delta: 'steady'    },
];

export const TOPIC_MOODS = {
  neet:  { RAGE: 67, DEMAND: 21, WITNESS: 18, EXHAUSTION: 12 },
  cjp:   { COCKROACH: 89, DEMAND: 54, JOY: 31, RAGE: 22 },
  jobs:  { EXHAUSTION: 71, NUMB: 48, RAGE: 41, HOPE: 15 },
  media: { RAGE: 82, DEMAND: 47, WITNESS: 38, NUMB: 22 },
  vote:  { DEMAND: 76, RAGE: 64, WITNESS: 51, NUMB: 31 },
  '3am': { LONELINESS: 88, NUMB: 61, HEALING: 24, HOPE: 18 },
  love:  { LONELINESS: 72, HEALING: 34, HOPE: 28, NUMB: 20 },
};

export const SEED_POSTS = [
  { id:'p1', topic:'3am',  mood:'HEALING',    text:'Dheere dheere sab theek ho raha hai. Slowly.',                                      dur:26, echoes:397,  pulse:5.8, pts:240,  zone:'PULSE',  reach:'18km near Delhi',      ts:Date.now()-720000,   saved:false },
  { id:'p2', topic:'jobs', mood:'EXHAUSTION', text:'Hum sab bas survive kar rahe hain. Kisi ko kaise batayein.',                        dur:19, echoes:1240, pulse:8.2, pts:890,  zone:'ECHO',   reach:'94km across Mumbai',   ts:Date.now()-2700000,  saved:false },
  { id:'p3', topic:'jobs', mood:'RAGE',       text:"Stop telling me to be grateful. I'm allowed to be furious.",                        dur:14, echoes:822,  pulse:9.1, pts:620,  zone:'SIGNAL', reach:'national',             ts:Date.now()-5400000,  saved:false },
  { id:'p4', topic:'3am',  mood:'LONELINESS', text:'Phone full of contacts. No one to actually call at 3am.',                          dur:11, echoes:2103, pulse:9.4, pts:1440, zone:'ECHO',   reach:'412km from Bangalore', ts:Date.now()-7200000,  saved:false },
  { id:'p5', topic:'cjp',  mood:'COCKROACH',  text:'Agar cockroach hona protest hai — main proudly cockroach hoon.',                   dur:18, echoes:4821, pulse:9.8, pts:3200, zone:'SIGNAL', reach:'national',             ts:Date.now()-3600000,  saved:false },
  { id:'p6', topic:'neet', mood:'DEMAND',     text:'NEET paper sold for 30 lakh. Where is the accountability?',                        dur:22, echoes:6200, pulse:9.9, pts:4100, zone:'SIGNAL', reach:'national',             ts:Date.now()-1800000,  saved:false },
  { id:'p7', topic:'love', mood:'HOPE',       text:"Maybe the version of me I'm becoming is enough.",                                   dur:15, echoes:564,  pulse:6.7, pts:380,  zone:'PULSE',  reach:'3km near Pune',        ts:Date.now()-10800000, saved:false },
  { id:'p8', topic:'neet', mood:'WITNESS',    text:'I was in the exam hall. I saw the paper early. I am willing to testify.',          dur:29, echoes:3890, pulse:9.6, pts:2800, zone:'SIGNAL', reach:'national',             ts:Date.now()-900000,   saved:false },
];

export const VOICE_REPLIES = {
  p1:[
    { id:'r1', mood:'HEALING',    text:"Same yaar. Ek din ek baar. That's all.",            duration:8,  echoes:24,   ts:Date.now()-300000 },
    { id:'r2', mood:'HOPE',       text:'It does get better. I promise from the other side.', duration:11, echoes:41,   ts:Date.now()-600000 },
    { id:'r3', mood:'LONELINESS', text:'I needed to hear this tonight. Thank you stranger.', duration:9,  echoes:18,   ts:Date.now()-900000 },
  ],
  p5:[
    { id:'r13', mood:'COCKROACH', text:'Haan bhai. Cockroach hona ab badge of honour hai.',       duration:14, echoes:892,  ts:Date.now()-120000 },
    { id:'r14', mood:'RAGE',      text:'They called us parasites. We called ourselves invincible.',duration:11, echoes:741,  ts:Date.now()-240000 },
  ],
  p6:[
    { id:'r16', mood:'WITNESS', text:'I was there. Hall 4. I saw the paper early.',   duration:22, echoes:1204, ts:Date.now()-60000  },
    { id:'r17', mood:'DEMAND',  text:"File RTI. Don't just post. File. The. RTI.",    duration:8,  echoes:567,  ts:Date.now()-120000 },
  ],
};

export const CITIES = {
  delhi:     { name:'Delhi',     dom:'RAGE',       bars:{ RAGE:78, NUMB:42, EXHAUSTION:35, HEALING:12  }, now:847,  d24:18420 },
  mumbai:    { name:'Mumbai',    dom:'EXHAUSTION',  bars:{ EXHAUSTION:64, LONELINESS:51, HOPE:38, RAGE:29 }, now:612,  d24:14230 },
  kota:      { name:'Kota',      dom:'RAGE',        bars:{ RAGE:91, EXHAUSTION:73, NUMB:60, HOPE:8      }, now:1203, d24:9840  },
  bangalore: { name:'Bangalore', dom:'LONELINESS',  bars:{ LONELINESS:67, EXHAUSTION:52, HOPE:34, JOY:22 }, now:489,  d24:11200 },
  patna:     { name:'Patna',     dom:'COCKROACH',   bars:{ COCKROACH:82, RAGE:74, DEMAND:61, HOPE:22    }, now:934,  d24:7640  },
};

export const NEARBY = [
  { id:'n1', zone:'PULSE',  dist:'2km',   mood:'RAGE',       snip:"couldn't even finish the...", dur:12, echoes:3   },
  { id:'n2', zone:'PULSE',  dist:'4km',   mood:'LONELINESS', snip:'every night same thing yaar', dur:8,  echoes:7   },
  { id:'n3', zone:'ECHO',   dist:'23km',  mood:'COCKROACH',  snip:'main bhi indestructible hoon',dur:15, echoes:24  },
  { id:'n4', zone:'SIGNAL', dist:'340km', mood:'RAGE',       snip:'system ne betray kiya phir...',dur:24, echoes:284 },
];

// Swarm events
export const SWARM_EVENTS = [
  { id:'s1', topic:'NEET ko Jawab Do',  active:true,  voices:1240, duration:'2h left',  color:'#FF4500', mood:'DEMAND'    },
  { id:'s2', topic:'Main Bhi Cockroach',active:true,  voices:3820, duration:'45m left', color:'#D4AF37', mood:'COCKROACH' },
  { id:'s3', topic:'3am Club India',    active:false, voices:890,  duration:'ended',    color:'#60A5FA', mood:'LONELINESS'},
  { id:'s4', topic:'Kota Speaks',       active:true,  voices:2100, duration:'1h left',  color:'#FF4500', mood:'RAGE'      },
];

// Points history for resonance graph
export const PTS_HISTORY = [
  { day:'Mon', pts:20  },
  { day:'Tue', pts:45  },
  { day:'Wed', pts:30  },
  { day:'Thu', pts:80  },
  { day:'Fri', pts:120 },
  { day:'Sat', pts:95  },
  { day:'Sun', pts:240 },
];
