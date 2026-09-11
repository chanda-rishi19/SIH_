/**
 * Bureau of Indian Standards (BIS) Assistant - Chatbot Application Controller
 * Optimized for high responsiveness, official portal theme, and simple clear language.
 * Features: Dark/Light Mode, Multilingual (8 Indian Languages), Voice Dictation, Camera & Document RAG
 */

const ASSISTANT_AVATAR_HTML = `
  <div class="avatar avatar-assistant" title="Bureau of Indian Standards">
    <svg class="avatar-emblem-svg" width="28" height="28" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" fill="#0b3b60" stroke="#c59b27" stroke-width="2.5"/>
      <circle cx="50" cy="50" r="32" fill="#ffffff"/>
      <g transform="translate(50, 48) scale(0.68)">
        <path d="M-22,12 L0,-24 L22,12 Z" fill="#0b3b60"/>
        <circle cx="0" cy="-6" r="5" fill="#f37023"/>
        <rect x="-18" y="10" width="36" height="4" rx="2" fill="#c59b27"/>
      </g>
      <text x="50" y="24" font-size="9" font-weight="bold" fill="#ffffff" text-anchor="middle">BIS</text>
      <text x="50" y="90" font-size="7.5" font-weight="bold" fill="#ffffff" text-anchor="middle">मानक</text>
    </svg>
  </div>
`;




const TRANSLATIONS = {
  en: {
    brandTitle: "Bureau of Indian Standards",
    brandSubtitle: "Official Standards & Quality Assistant",
    accountGuest: "Account: Guest",
    clearChat: "Clear",
    tagOfficial: "Official BIS Assistant",
    greetingHello: "Hello! I am your Bureau of Indian Standards (BIS) Assistant.",
    greetingDesc: "Ask any question about Indian Standards (IS), product certification, ISI mark, or gold hallmarking:",
    chatPlaceholder: "Ask a question (e.g. IS 1417 gold, IS 269 cement, ISI mark)...",
    voiceListening: "Listening... Speak clearly into your microphone",
    voiceDone: "Done",
    inputHint: "Press Enter to send • Shift+Enter for new line",
    systemReady: "System Ready",
    cameraTitle: "Camera Scanner",
    cameraDesc: "Point camera at a product, ISI logo, or Gold Hallmarking HUID to attach with your query.",
    cameraReticle: "BIS Product / Label Scanner",
    selectPhoto: "📁 Select Photo",
    capturePhoto: "📸 Capture Photo",
    standardsFound: "Official Indian Standards Found",
    previewBtn: "Preview",
    downloadBtn: "Download PDF",
    scopeClausePreview: "Standard Scope & Clause 1 Preview",
    expand: "Expand",
    collapse: "Collapse",
    sourceLabel: "Source:",
    copyBtn: "Copy",
    copiedBtn: "Copied!",
    speakBtn: "Listen",
    stopSpeakBtn: "Stop",
    you: "You",
    searching: "Searching Indian Standards & preparing guidance...",
    translating: "Translating response...",
    active: "ACTIVE",
    withdrawn: "WITHDRAWN",
    tcLabel: "TC",
    amendmentsLabel: "Amendments",
    downloading: "Downloading...",
    openPdf: "Open PDF",
    chips: [
      { id: "gold", text: "Gold Hallmarking (IS 1417)", query: "What are the purity grades and hallmarking rules under IS 1417?" },
      { id: "cement", text: "Portland Cement (IS 269)", query: "What is the specification for Ordinary Portland Cement under IS 269?" },
      { id: "water", text: "Packaged Water (IS 14543)", query: "What are the test parameters for Packaged Drinking Water under IS 14543?" },
      { id: "isi", text: "ISI Mark Procedure", query: "What is the procedure to obtain an ISI mark license under Scheme-I?" },
      { id: "crs", text: "CRS Electronics", query: "What electronic products are covered under Compulsory Registration Scheme (CRS)?" }
    ]
  },
  hi: {
    brandTitle: "भारतीय मानक ब्यूरो (BIS)",
    brandSubtitle: "आधिकारिक मानक एवं गुणवत्ता सहायक",
    accountGuest: "खाता: अतिथि",
    clearChat: "साफ़ करें",
    tagOfficial: "आधिकारिक बीआईएस सहायक",
    greetingHello: "नमस्ते! मैं आपका भारतीय मानक ब्यूरो (BIS) सहायक हूँ।",
    greetingDesc: "भारतीय मानक (IS), उत्पाद प्रमाणीकरण, आईएसआई मार्क या हॉलमार्किंग के बारे में कोई भी प्रश्न पूछें:",
    chatPlaceholder: "प्रश्न पूछें (उदा. सोना हॉलमार्किंग IS 1417, सीमेंट IS 269, ISI मार्क)...",
    voiceListening: "सुन रहा हूँ... कृपया स्पष्ट बोलें",
    voiceDone: "पूर्ण",
    inputHint: "भेजने के लिए Enter • नई लाइन के लिए Shift+Enter",
    systemReady: "प्रणाली तैयार है",
    cameraTitle: "कैमरा स्कैनर",
    cameraDesc: "उत्पाद, आईएसआई मार्क या हॉलमार्किंग HUID पर कैमरा केंद्रित करें।",
    cameraReticle: "उत्पाद एवं लेबल स्कैनर",
    selectPhoto: "📁 फ़ोटो चुनें",
    capturePhoto: "📸 फ़ोटो लें",
    standardsFound: "आधिकारिक भारतीय मानक मिले",
    previewBtn: "पूर्वावलोकन",
    downloadBtn: "पीडीएफ डाउनलोड करें",
    scopeClausePreview: "मानक दायरा एवं खंड 1 पूर्वावलोकन",
    expand: "विस्तार करें",
    collapse: "संक्षिप्त करें",
    sourceLabel: "स्रोत:",
    copyBtn: "कॉपी करें",
    copiedBtn: "कॉपी हो गया!",
    speakBtn: "सुनें",
    stopSpeakBtn: "रोकें",
    you: "आप",
    searching: "भारतीय मानकों में खोज और मार्गदर्शन तैयार किया जा रहा है...",
    translating: "उत्तर का अनुवाद हो रहा है...",
    active: "सक्रिय (ACTIVE)",
    withdrawn: "वापस लिया गया (WITHDRAWN)",
    tcLabel: "तकनीकी समिति (TC)",
    amendmentsLabel: "संशोधन",
    downloading: "डाउनलोड हो रहा है...",
    openPdf: "पीडीएफ खोलें",
    chips: [
      { id: "gold", text: "सोना हॉलमार्किंग (IS 1417)", query: "IS 1417 के तहत सोने की शुद्धता ग्रेड और हॉलमार्किंग नियम क्या हैं?" },
      { id: "cement", text: "पोर्टलैंड सीमेंट (IS 269)", query: "IS 269 के तहत साधारण पोर्टलैंड सीमेंट के मानक विनिर्देश क्या हैं?" },
      { id: "water", text: "पैकेज्ड पेयजल (IS 14543)", query: "IS 14543 के अनुसार पैकेज्ड पेयजल के परीक्षण पैरामीटर क्या हैं?" },
      { id: "isi", text: "आईएसआई मार्क प्रक्रिया", query: "स्कीम-1 के तहत आईएसआई मार्क लाइसेंस प्राप्त करने की प्रक्रिया क्या है?" },
      { id: "crs", text: "सीआरएस इलेक्ट्रॉनिक्स", query: "अनिवार्य पंजीकरण योजना (CRS) के तहत कौन से इलेक्ट्रॉनिक उत्पाद शामिल हैं?" }
    ]
  },
  ta: {
    brandTitle: "பிஐஎஸ் உதவியாளர் (BIS Assistant)",
    brandSubtitle: "இந்திய தரநிலைகள் மற்றும் ஒழுங்குமுறை வழிகாட்டுதல்",
    accountGuest: "கணக்கு: விருந்தினர்",
    clearChat: "அழி",
    tagOfficial: "அதிகாரப்பூர்வ உதவியாளர்",
    greetingHello: "வணக்கம்! நான் உங்கள் பிஐஎஸ் உதவியாளர்.",
    greetingDesc: "இந்திய தரநிலைகள் பணியகத்திலிருந்து (BIS) சரிபார்க்கப்பட்ட அதிகாரப்பூர்வ பதில்களை நான் வழங்குகிறேன்:",
    chatPlaceholder: "இந்திய தரநிலைகள் குறித்து கேளுங்கள் (எ.கா. IS 1417, IS 269)...",
    voiceListening: "கேட்கிறது... தெளிவாகப் பேசுங்கள்",
    voiceDone: "முடிந்தது",
    inputHint: "அனுப்ப Enter அழுத்தவும் • புதிய வரிக்கு Shift+Enter",
    systemReady: "அமைப்பு தயார்",
    cameraTitle: "நேரலை கேமரா பிடிப்பு",
    cameraDesc: "தயாரிப்பு, ISI முத்திரை அல்லது தங்க ஹால்மார்க் HUID-ஐ ஸ்கேன் செய்யவும்.",
    cameraReticle: "தயாரிப்பு / லேபிள்கள் ஸ்கேனர்",
    selectPhoto: "📁 புகைப்படத்தைத் தேர்ந்தெடு",
    capturePhoto: "📸 படம் எடு",
    standardsFound: "அதிகாரப்பூர்வ இந்திய தரநிலைகள் கண்டறியப்பட்டன",
    previewBtn: "முன்னோட்டம்",
    downloadBtn: "PDF பதிவிறக்கவும்",
    scopeClausePreview: "அதிகாரப்பூர்வ தரநிலை நோக்கம் & பிரிவு 1 முன்னோட்டம்",
    expand: "விரிக்கவும்",
    collapse: "சுருக்கவும்",
    sourceLabel: "மூலம்:",
    copyBtn: "நகலெடு",
    copiedBtn: "நகலெடுக்கப்பட்டது!",
    speakBtn: "கேளுங்கள்",
    stopSpeakBtn: "நிறுத்து",
    you: "நீங்கள்",
    searching: "பிஐஎஸ் களஞ்சியத்தில் தேடுகிறது மற்றும் வழிகாட்டுதலை உருவாக்குகிறது...",
    translating: "பதிலை மொழிபெயர்க்கிறது...",
    active: "செயலில் (ACTIVE)",
    withdrawn: "திரும்பப் பெறப்பட்டது (WITHDRAWN)",
    tcLabel: "தொழில்நுட்பக் குழு (TC)",
    amendmentsLabel: "திருத்தங்கள்",
    downloading: "பதிவிறக்குகிறது...",
    openPdf: "PDF திறக்கவும்",
    chips: [
      { id: "gold", text: "தங்க ஹால்மார்க்கிங் (IS 1417)", query: "IS 1417 கீழ் தங்க தூய்மை மற்றும் ஹால்மார்க்கிங் விதிகள் யாவை?" },
      { id: "cement", text: "போர்ட்லேண்ட் சிமெண்ட் (IS 269)", query: "IS 269 கீழ் சாதாரண போர்ட்லேண்ட் சிமெண்ட் விவரக்குறிப்பு என்ன?" },
      { id: "water", text: "பேக்கேஜ் குடிநீர் (IS 14543)", query: "IS 14543 கீழ் குடிநீர் சோதனை அளவுருக்கள் யாவை?" },
      { id: "isi", text: "ISI முத்திரை செயல்முறை", query: "திட்டம்-1 கீழ் ISI முத்திரை உரிமம் பெறுவது எப்படி?" },
      { id: "crs", text: "CRS எலக்ட்ரானிக்ஸ்", query: "கட்டாய பதிவுத் திட்டத்தின் (CRS) கீழ் வரும் மின்னணு பொருட்கள் யாவை?" }
    ]
  },
  te: {
    brandTitle: "బీఐఎస్ అసిస్టెంట్ (BIS Assistant)",
    brandSubtitle: "భారతీయ ప్రమాణాలు & నియంత్రణ మార్గదర్శకత్వం",
    accountGuest: "ఖాతా: అతిథి",
    clearChat: "క్లియర్ చేయండి",
    tagOfficial: "అధికారిక సహాయకుడు",
    greetingHello: "నమస్కారం! నేను మీ బీఐఎస్ సహాయకుడిని.",
    greetingDesc: "బ్యూరో ఆఫ్ ఇండియన్ స్టాండర్డ్స్ (BIS) నుండి ప్రామాణికమైన సమాచారాన్ని అందిస్తాను:",
    chatPlaceholder: "భారతీయ ప్రమాణాల గురించి అడగండి (ఉదా. IS 1417, IS 269)...",
    voiceListening: "వింటోంది... స్పష్టంగా మాట్లాడండి",
    voiceDone: "పూర్తయింది",
    inputHint: "పంపడానికి Enter నొక్కండి • కొత్త లైన్ కోసం Shift+Enter",
    systemReady: "సిస్టమ్ సిద్ధంగా ఉంది",
    cameraTitle: "లైవ్ కెమెరా క్యాప్చర్",
    cameraDesc: "ఉత్పత్తి, ISI మార్క్ లేదా గోల్డ్ హాల్‌మార్కింగ్ HUID స్కాన్ చేయండి.",
    cameraReticle: "ఉత్పత్తి & లేబుల్ స్కానర్",
    selectPhoto: "📁 ఫోటోను ఎంచుకోండి",
    capturePhoto: "📸 ఫోటో తీయండి",
    standardsFound: "అధికారిక భారతీయ ప్రమాణాలు కనుగొనబడ్డాయి",
    previewBtn: "ప్రివ్యూ",
    downloadBtn: "PDF డౌన్‌లోడ్ చేయండి",
    scopeClausePreview: "అధికారిక ప్రమాణ పరిధి & క్లాజ్ 1 ప్రివ్యూ",
    expand: "విస్తరించు",
    collapse: "కుదించు",
    sourceLabel: "మూలం:",
    copyBtn: "కాపీ చేయండి",
    copiedBtn: "కాపీ చేయబడింది!",
    speakBtn: "వినండి",
    stopSpeakBtn: "ఆపండి",
    you: "మీరు",
    searching: "బీఐఎస్ రిపోజిటరీలో శోధించడం మరియు మార్గదర్శకత్వాన్ని రూపొందించడం...",
    translating: "సమాధానాన్ని అనువదిస్తోంది...",
    active: "క్రియాశీల (ACTIVE)",
    withdrawn: "ఉపసంహరించబడింది (WITHDRAWN)",
    tcLabel: "సాంకేతిక కమిటీ (TC)",
    amendmentsLabel: "సవరణలు",
    downloading: "డౌన్‌లోడ్ అవుతోంది...",
    openPdf: "PDF తెరవండి",
    chips: [
      { id: "gold", text: "బంగారు హాల్‌మార్కింగ్ (IS 1417)", query: "IS 1417 కింద బంగారు స్వచ్ఛత గ్రేడ్‌లు మరియు హాల్‌మార్కింగ్ నిబంధనలు ఏమిటి?" },
      { id: "cement", text: "పోర్ట్‌ల్యాండ్ సిమెంట్ (IS 269)", query: "IS 269 కింద పోర్ట్‌ల్యాండ్ సిమెంట్ లక్షణాలు ఏమిటి?" },
      { id: "water", text: "ప్యాకేజ్డ్ వాటర్ (IS 14543)", query: "IS 14543 కింద తాగునీటి పరీక్ష పారామితులు ఏమిటి?" },
      { id: "isi", text: "ISI మార్క్ విధానం", query: "స్కీమ్-1 కింద ISI మార్క్ లైసెన్స్ పొందే విధానం ఏమిటి?" },
      { id: "crs", text: "CRS ఎలక్ట్రానిక్స్", query: "తప్పనిసరి రిజిస్ట్రేషన్ స్కీమ్ (CRS) కింద ఏ ఎలక్ట్రానిక్ ఉత్పత్తులు వస్తాయి?" }
    ]
  },
  bn: {
    brandTitle: "বিআইএস সহকারী (BIS Assistant)",
    brandSubtitle: "ভারতীয় মান ও নিয়ন্ত্রক নির্দেশিকা",
    accountGuest: "অ্যাকাউন্ট: অতিথি",
    clearChat: "পরিষ্কার করুন",
    tagOfficial: "অফিসিয়াল সহকারী",
    greetingHello: "নমস্কার! আমি আপনার বিআইএস সহকারী।",
    greetingDesc: "আমি ব্যুরো অফ ইন্ডিয়ান স্ট্যান্ডার্ডস (BIS) ক্যাটালগ থেকে যাচাইকৃত উত্তর প্রদান করি:",
    chatPlaceholder: "ভারতীয় মান সম্পর্কে জিজ্ঞাসা করুন (যেমন IS 1417, IS 269)...",
    voiceListening: "শুনছি... অনুগ্রহ করে স্পষ্টভাবে বলুন",
    voiceDone: "সম্পন্ন",
    inputHint: "পাঠাতে Enter চাপুন • নতুন লাইনের জন্য Shift+Enter",
    systemReady: "সিস্টেম প্রস্তুত",
    cameraTitle: "লাইভ ক্যামেরা ক্যাপচার",
    cameraDesc: "পণ্য, আইএসআই চিহ্ন বা সোনার হলমার্ক HUID স্ক্যান করুন।",
    cameraReticle: "পণ্য ও লেবেল স্ক্যানার",
    selectPhoto: "📁 ছবি নির্বাচন করুন",
    capturePhoto: "📸 ছবি তুলুন",
    standardsFound: "অফিসিয়াল ভারতীয় মান পাওয়া গেছে",
    previewBtn: "প্রিভিউ",
    downloadBtn: "পিডিএফ ডাউনলোড করুন",
    scopeClausePreview: "অফিসিয়াল স্ট্যান্ডার্ড স্কোপ এবং ক্লজ ১ প্রিভিউ",
    expand: "প্রসারিত করুন",
    collapse: "সংক্ষিপ্ত করুন",
    sourceLabel: "উৎস:",
    copyBtn: "কপি করুন",
    copiedBtn: "কপি করা হয়েছে!",
    speakBtn: "শুনুন",
    stopSpeakBtn: "থামুন",
    you: "আপনি",
    searching: "বিআইএস সংগ্রহস্থলে অনুসন্ধান এবং নির্দেশিকা তৈরি করা হচ্ছে...",
    translating: "উত্তরের অনুবাদ হচ্ছে...",
    active: "সক্রিয় (ACTIVE)",
    withdrawn: "প্রত্যাহার করা হয়েছে (WITHDRAWN)",
    tcLabel: "প্রযুক্তিগত কমিটি (TC)",
    amendmentsLabel: "সংশোধনী",
    downloading: "ডাউনলোড হচ্ছে...",
    openPdf: "পিডিএফ খুলুন",
    chips: [
      { id: "gold", text: "সোনার হলমার্কিং (IS 1417)", query: "IS 1417-এর অধীনে সোনার বিশুদ্ধতা ও হলমার্কিং নিয়ম কী?" },
      { id: "cement", text: "পোর্টল্যান্ড সিমেন্ট (IS 269)", query: "IS 269-এর অধীনে পোর্টল্যান্ড সিমেন্টের স্পেসিফিকেশন কী?" },
      { id: "water", text: "প্যাকেজড পানীয় জল (IS 14543)", query: "IS 14543 অনুযায়ী প্যাকেজড জলের পরীক্ষার পরামিতিগুলি কী?" },
      { id: "isi", text: "আইএসআই মার্ক পদ্ধতি", query: "স্কিম-১ এর অধীনে আইএসআই লাইসেন্স পাওয়ার পদ্ধতি কী?" },
      { id: "crs", text: "সিআরএস ইলেকট্রনিক্স", query: "বাধ্যতামূলক নিবন্ধন প্রকল্পের (CRS) অধীনে কোন পণ্যগুলি অন্তর্ভুক্ত?" }
    ]
  },
  mr: {
    brandTitle: "बीआयएस सहाय्यक (BIS Assistant)",
    brandSubtitle: "भारतीय मानके आणि नियामक मार्गदर्शन",
    accountGuest: "खाते: अतिथी",
    clearChat: "साफ करा",
    tagOfficial: "अधिकृत सहाय्यक",
    greetingHello: "नमस्कार! मी आपला बीआयएस सहाय्यक आहे.",
    greetingDesc: "मी भारतीय मानक ब्युरो (BIS) कडून अधिकृत आणि सत्यापित माहिती देतो:",
    chatPlaceholder: "भारतीय मानकांविषयी विचारा (उदा. IS 1417, IS 269)...",
    voiceListening: "ऐकत आहे... कृपया स्पष्ट बोला",
    voiceDone: "पूर्ण",
    inputHint: "पाठवण्यासाठी Enter दाबा • नवीन ओळीसाठी Shift+Enter",
    systemReady: "प्रणाली सज्ज",
    cameraTitle: "थेट कॅमेरा कॅप्चर",
    cameraDesc: "उत्पादन, आयएसआय चिन्ह किंवा सोन्याचे हॉलमार्क HUID स्कॅन करा.",
    cameraReticle: "उत्पादन व लेबल स्कॅनर",
    selectPhoto: "📁 फोटो निवडा",
    capturePhoto: "📸 फोटो काढा",
    standardsFound: "अधिकृत भारतीय मानके आढळली",
    previewBtn: "पूर्वावलोकन",
    downloadBtn: "पीडीएफ डाउनलोड करा",
    scopeClausePreview: "अधिकृत मानक व्याप्ती आणि खंड १ पूर्वावलोकन",
    expand: "विस्तार करा",
    collapse: "संक्षेपित करा",
    sourceLabel: "स्रोत:",
    copyBtn: "कॉपी करा",
    copiedBtn: "कॉपी केले!",
    speakBtn: "ऐका",
    stopSpeakBtn: "थांबवा",
    you: "तुम्ही",
    searching: "बीआयएस भांडारात शोधणे आणि मार्गदर्शन तयार करणे...",
    translating: "उत्तराचे भाषांतर होत आहे...",
    active: "सक्रिय (ACTIVE)",
    withdrawn: "मागे घेतलेले (WITHDRAWN)",
    tcLabel: "तांत्रिक समिती (TC)",
    amendmentsLabel: "सुधारणा",
    downloading: "डाउनलोड होत आहे...",
    openPdf: "पीडीएफ उघडा",
    chips: [
      { id: "gold", text: "सोने हॉलमार्किंग (IS 1417)", query: "IS 1417 अंतर्गत सोन्याची शुद्धता आणि हॉलमार्किंग नियम काय आहेत?" },
      { id: "cement", text: "पोर्टलँड सिमेंट (IS 269)", query: "IS 269 अंतर्गत ऑर्डिनरी पोर्टलँड सिमेंटचे निकष काय आहेत?" },
      { id: "water", text: "पॅकेज केलेले पाणी (IS 14543)", query: "IS 14543 अंतर्गत पिण्याच्या पाण्याचे चाचणी निकष काय आहेत?" },
      { id: "isi", text: "आयएसआय मार्क प्रक्रिया", query: "स्कीम-१ अंतर्गत आयएसआय मार्क मिळवण्याची प्रक्रिया काय आहे?" },
      { id: "crs", text: "सीआरएस इलेक्ट्रॉनिक्स", query: "अनिवार्य नोंदणी योजना (CRS) अंतर्गत कोणते इलेक्ट्रॉनिक्स येतात?" }
    ]
  },
  gu: {
    brandTitle: "બીઆઈએસ સહાયક (BIS Assistant)",
    brandSubtitle: "ભારતીય ધોરણો અને નિયમનકારી માર્ગદર્શન",
    accountGuest: "ખાતું: અતિથિ",
    clearChat: "સાફ કરો",
    tagOfficial: "સત્તાવાર સહાયક",
    greetingHello: "નમસ્તે! હું તમારો બીઆઈએસ સહાયક છું.",
    greetingDesc: "હું બ્યુરો ઓફ ઇન્ડિયન સ્ટાન્ડર્ડ્સ (BIS) ના સત્તાવાર ધોરણો વિશે માહિતી આપું છું:",
    chatPlaceholder: "ભારતીય ધોરણો વિશે પૂછો (દા.ત. IS 1417, IS 269)...",
    voiceListening: "સાંભળી રહ્યું છે... કૃપા કરીને સ્પષ્ટ બોલો",
    voiceDone: "પૂર્ણ",
    inputHint: "મોકલવા માટે Enter દબાવો • નવી લાઇન માટે Shift+Enter",
    systemReady: "સિસ્ટમ તૈયાર છે",
    cameraTitle: "લાઇવ કેમેરા કેપ્ચર",
    cameraDesc: "પ્રોડક્ટ, આઈએસઆઈ માર્ક અથવા ગોલ્ડ હોલમાર્કિંગ HUID સ્કેન કરો.",
    cameraReticle: "પ્રોડક્ટ અને લેબલ સ્કેનર",
    selectPhoto: "📁 ફોટો પસંદ કરો",
    capturePhoto: "📸 ફોટો લો",
    standardsFound: "સત્તાવાર ભારતીય ધોરણો મળ્યા",
    previewBtn: "પૂર્વાવલોકન",
    downloadBtn: "પીડીએફ ડાઉનલોડ કરો",
    scopeClausePreview: "સત્તાવાર ધોરણ કાર્યક્ષેત્ર અને કલમ 1 પૂર્વાવલોકન",
    expand: "વિસ્તૃત કરો",
    collapse: "સંક્ષિપ્ત કરો",
    sourceLabel: "સ્ત્રોત:",
    copyBtn: "કૉપિ કરો",
    copiedBtn: "કૉપિ થઈ ગયું!",
    speakBtn: "સાંભળો",
    stopSpeakBtn: "બંધ કરો",
    you: "તમે",
    searching: "બીઆઈએસ ભંડારમાં શોધ અને માર્ગદર્શન તૈયાર કરી રહ્યું છે...",
    translating: "જવાબનું ભાષાંતર થઈ રહ્યું છે...",
    active: "સક્રિય (ACTIVE)",
    withdrawn: "પાછું ખેંચાયેલ (WITHDRAWN)",
    tcLabel: "તકનીકી સમિતિ (TC)",
    amendmentsLabel: "સુધારાઓ",
    downloading: "ડાઉનલોડ થઈ રહ્યું છે...",
    openPdf: "પીડીએફ ખોલો",
    chips: [
      { id: "gold", text: "સોનાનું હોલમાર્કિંગ (IS 1417)", query: "IS 1417 હેઠળ સોનાની શુદ્ધતા અને હોલમાર્કિંગના નિયમો શું છે?" },
      { id: "cement", text: "પોર્ટલેન્ડ સિમેન્ટ (IS 269)", query: "IS 269 હેઠળ પોર્ટલેન્ડ સિમેન્ટની વિગતો શું છે?" },
      { id: "water", text: "પેકેજ્ડ પીવાનું પાણી (IS 14543)", query: "IS 14543 હેઠળ પેકેજ્ડ પાણીના પરીક્ષણ પરિમાણો શું છે?" },
      { id: "isi", text: "આઈએસઆઈ માર્ક પ્રક્રિયા", query: "સ્કીમ-1 હેઠળ આઈએસઆઈ માર્ક મેળવવાની પ્રક્રિયા શું છે?" },
      { id: "crs", text: "સીઆરએસ ઈલેક્ટ્રોનિક્સ", query: "ફરજિયાત નોંધણી યોજના (CRS) હેઠળ કઈ ઈલેક્ટ્રોનિક વસ્તુઓ આવે છે?" }
    ]
  },
  kn: {
    brandTitle: "ಬಿಐಎಸ್ ಸಹಾಯಕ (BIS Assistant)",
    brandSubtitle: "ಭಾರತೀಯ ಗುಣಮಟ್ಟ ಮತ್ತು ನಿಯಂತ್ರಕ ಮಾರ್ಗದರ್ಶನ",
    accountGuest: "ಖಾತೆ: ಅತಿಥಿ",
    clearChat: "ತೆರವುಗೊಳಿಸಿ",
    tagOfficial: "ಅಧಿಕೃತ ಸಹಾಯಕ",
    greetingHello: "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಬಿಐಎಸ್ ಸಹಾಯಕ.",
    greetingDesc: "ಭಾರತೀಯ ಗುಣಮಟ್ಟ ಬ್ಯೂರೋ (BIS) ನಿಂದ ದೃಢೀಕರಿಸಲ್ಪಟ್ಟ ಮಾಹಿತಿಯನ್ನು ನಾನು ಒದಗಿಸುತ್ತೇನೆ:",
    chatPlaceholder: "ಭಾರತೀಯ ಗುಣಮಟ್ಟಗಳ ಬಗ್ಗೆ ಕೇಳಿ (ಉದಾ. IS 1417, IS 269)...",
    voiceListening: "ಆಲಿಸುತ್ತಿದೆ... ಸ್ಪಷ್ಟವಾಗಿ ಮಾತನಾಡಿ",
    voiceDone: "ಮುಗಿದಿದೆ",
    inputHint: "ಕಳುಹಿಸಲು Enter ಒತ್ತಿರಿ • ಹೊಸ ಸಾಲಿಗೆ Shift+Enter",
    systemReady: "ವ್ಯವಸ್ಥೆ ಸಿದ್ಧವಾಗಿದೆ",
    cameraTitle: "ಲೈವ್ ಕ್ಯಾಮೆರಾ ಕ್ಯಾಪ್ಚರ್",
    cameraDesc: "ಉತ್ಪನ್ನ, ISI ಮಾರ್ಕ್ ಅಥವಾ ಗೋಲ್ಡ್ ಹಾಲ್‌ಮಾರ್ಕ್ HUID ಸ್ಕ್ಯಾನ್ ಮಾಡಿ.",
    cameraReticle: "ಉತ್ಪನ್ನ ಮತ್ತು ಲೇಬಲ್ ಸ್ಕ್ಯಾನರ್",
    selectPhoto: "📁 ಫೋಟೋ ಆಯ್ಕೆಮಾಡಿ",
    capturePhoto: "📸 ಫೋಟೋ ತೆಗೆಯಿರಿ",
    standardsFound: "ಅಧಿಕೃತ ಭಾರತೀಯ ಗುಣಮಟ್ಟಗಳು ಕಂಡುಬಂದಿವೆ",
    previewBtn: "ಮುನ್ನೋಟ",
    downloadBtn: "PDF ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ",
    scopeClausePreview: "ಅಧಿಕೃತ ಗುಣಮಟ್ಟ ವ್ಯಾಪ್ತಿ ಮತ್ತು ಷರತ್ತು 1 ಮುನ್ನೋಟ",
    expand: "ವಿಸ್ತರಿಸಿ",
    collapse: "ಕುಗ್ಗಿಸಿ",
    sourceLabel: "ಮೂಲ:",
    copyBtn: "ನಕಲಿಸಿ",
    copiedBtn: "ನಕಲಿಸಲಾಗಿದೆ!",
    speakBtn: "ಆಲಿಸಿ",
    stopSpeakBtn: "ನಿಲ್ಲಿಸಿ",
    you: "ನೀವು",
    searching: "ಬಿಐಎಸ್ ರೆಪೊಸಿಟರಿಯಲ್ಲಿ ಹುಡುಕಲಾಗುತ್ತಿದೆ ಮತ್ತು ಮಾರ್ಗದರ್ಶನವನ್ನು ಸಂಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ...",
    translating: "ಪ್ರತಿಕ್ರಿಯೆಯನ್ನು ಅನುವಾದಿಸಲಾಗುತ್ತಿದೆ...",
    active: "ಸಕ್ರಿಯ (ACTIVE)",
    withdrawn: "ಹಿಂತೆಗೆದುಕೊಳ್ಳಲಾಗಿದೆ (WITHDRAWN)",
    tcLabel: "ತಾಂತ್ರಿಕ ಸಮಿತಿ (TC)",
    amendmentsLabel: "ತಿದ್ದುಪಡಿಗಳು",
    downloading: "ಡೌನ್‌ಲೋಡ್ ಆಗುತ್ತಿದೆ...",
    openPdf: "PDF ತೆರೆಯಿರಿ",
    chips: [
      { id: "gold", text: "ಚಿನ್ನದ ಹಾಲ್‌ಮಾರ್ಕಿಂಗ್ (IS 1417)", query: "IS 1417 ಅಡಿಯಲ್ಲಿ ಚಿನ್ನದ ಶುದ್ಧತೆ ಮತ್ತು ಹಾಲ್‌ಮಾರ್ಕಿಂಗ್ ನಿಯಮಗಳು ಯಾವುವು?" },
      { id: "cement", text: "ಪೋರ್ಟ್‌ಲ್ಯಾಂಡ್ ಸಿಮೆಂಟ್ (IS 269)", query: "IS 269 ಅಡಿಯಲ್ಲಿ ಪೋರ್ಟ್‌ಲ್ಯಾಂಡ್ ಸಿಮೆಂಟ್ ಗುಣಮಟ್ಟ ಯಾವುದು?" },
      { id: "water", text: "ಪ್ಯಾಕ್ ಮಾಡಿದ ಕುಡಿಯುವ ನೀರು (IS 14543)", query: "IS 14543 ಅಡಿಯಲ್ಲಿ ಕುಡಿಯುವ ನೀರಿನ ಪರೀಕ್ಷಾ ನಿಯತಾಂಕಗಳು ಯಾವುವು?" },
      { id: "isi", text: "ISI ಮಾರ್ಕ್ ಪ್ರಕ್ರಿಯೆ", query: "ಸ್ಕೀಮ್-1 ಅಡಿಯಲ್ಲಿ ISI ಮಾರ್ಕ್ ಪರವಾನಗಿ ಪಡೆಯುವ ವಿಧಾನ ಯಾವುದು?" },
      { id: "crs", text: "CRS ಎಲೆಕ್ಟ್ರಾನಿಕ್ಸ್", query: "ಕಡ್ಡಾಯ ನೋಂದಣಿ ಯೋಜನೆ (CRS) ಅಡಿಯಲ್ಲಿ ಯಾವ ಎಲೆಕ್ಟ್ರಾನಿಕ್ ಉತ್ಪನ್ನಗಳು ಬರುತ್ತವೆ?" }
    ]
  }
};

const VOICE_LOCALES = {
  en: "en-IN",
  hi: "hi-IN",
  ta: "ta-IN",
  te: "te-IN",
  bn: "bn-IN",
  mr: "mr-IN",
  gu: "gu-IN",
  kn: "kn-IN"
};

// Compatibility aliases
const translations = TRANSLATIONS;
const voice_local = VOICE_LOCALES;
const voice_locales = VOICE_LOCALES;


document.addEventListener("DOMContentLoaded", () => {
  const chatFeed = document.getElementById("chat-feed");
  const chatForm = document.getElementById("chat-form");
  const chatInput = document.getElementById("chat-input");
  const sendBtn = document.getElementById("send-btn");
  const clearChatBtn = document.getElementById("clear-chat-btn");
  const systemStatus = document.getElementById("system-status");

  // Theme & Language Elements
  const themeToggleBtn = document.getElementById("theme-toggle-btn");
  const themeIconSun = document.getElementById("theme-icon-sun");
  const themeIconMoon = document.getElementById("theme-icon-moon");
  const langSelect = document.getElementById("lang-select");

  // BIS Account Elements
  const bisAccountBtn = document.getElementById("bis-account-btn");
  const bisAuthIndicator = document.getElementById("bis-auth-indicator");
  const bisAccountText = document.getElementById("bis-account-text");
  const bisModal = document.getElementById("bis-modal");
  const closeModalBtn = document.getElementById("close-modal-btn");
  const cancelLoginBtn = document.getElementById("cancel-login-btn");
  const bisLoginForm = document.getElementById("bis-login-form");
  const bisUsernameInput = document.getElementById("bis-username-input");
  const bisPasswordInput = document.getElementById("bis-password-input");
  const captchaContainer = document.getElementById("captcha-container");
  const captchaImg = document.getElementById("captcha-img");
  const bisCaptchaInput = document.getElementById("bis-captcha-input");
  const modalStatusMsg = document.getElementById("modal-status-msg");
  const saveLoginBtn = document.getElementById("save-login-btn");
  const loginBtnText = document.getElementById("login-btn-text");

  // Camera, Voice & Document Action Elements
  const cameraBtn = document.getElementById("camera-btn");
  const voiceBtn = document.getElementById("voice-btn");
  const docBtn = document.getElementById("doc-btn");
  const cameraFileInput = document.getElementById("camera-file-input");
  const docFileInput = document.getElementById("doc-file-input");
  const attachmentPreviewBar = document.getElementById("attachment-preview-bar");
  const attThumbContainer = document.getElementById("att-thumb-container");
  const attName = document.getElementById("att-name");
  const attSize = document.getElementById("att-size");
  const removeAttBtn = document.getElementById("remove-att-btn");
  const voiceListeningBar = document.getElementById("voice-listening-bar");
  const stopVoiceBtn = document.getElementById("stop-voice-btn");
  const cameraModal = document.getElementById("camera-modal");
  const closeCameraBtn = document.getElementById("close-camera-btn");
  const cameraVideo = document.getElementById("camera-video");
  const cameraCanvas = document.getElementById("camera-canvas");
  const snapPhotoBtn = document.getElementById("snap-photo-btn");
  const uploadPhotoBtn = document.getElementById("upload-photo-btn");

  let isSubmitting = false;
  let currentAttachment = null;
  let cameraStream = null;
  let speechRecognition = null;
  let isListening = false;
  let recognitionBaseText = "";
  let finalTranscript = "";
  let currentUtterance = null;
  let currentSpeakingBtn = null;
  let currentLanguage = localStorage.getItem("bis_lang") || "en";
  let _langDebounceTimer = null;
  const chatMessages = [];

  // Initialize Theme and Language
  initTheme();
  initLanguage();

  // Initialize health and auth status
  checkHealth();
  checkBisAuth();

  // Attach greeting chips & query options
  setupGreetingChips();
  setupAttachments();
  setupVoiceRecognition();
  setupCamera();

  async function checkHealth() {
    try {
      const res = await fetch("/api/health");
      if (res.ok) {
        const data = await res.json();
        if (systemStatus) {
          systemStatus.textContent = "Online";
        }
        if (data.bis_authenticated) {
          updateBisAuthUI({ authenticated: true, username: data.bis_user });
        }
      }
    } catch (e) {
      if (systemStatus) {
        systemStatus.textContent = "Connecting...";
      }
    }
  }

  async function checkBisAuth() {
    try {
      const res = await fetch("/api/bis/status");
      if (res.ok) {
        const data = await res.json();
        updateBisAuthUI(data);
      }
    } catch (e) {
      console.warn("Could not check BIS auth status", e);
    }
  }

  function updateBisAuthUI(data) {
    if (!bisAuthIndicator || !bisAccountText) return;
    if (data.authenticated) {
      bisAuthIndicator.className = "status-dot";
      bisAccountText.textContent = `Account: ${data.username || "Active"}`;
    } else {
      bisAuthIndicator.className = "status-dot guest";
      bisAccountText.textContent = "Account: Guest";
    }
    if (data.username && !bisUsernameInput.value) {
      bisUsernameInput.value = data.username;
    }
  }

  // Modal Handlers
  function openModal(msg = "") {
    bisModal.classList.remove("hidden");
    if (msg) {
      showModalStatus(msg, "info");
    } else {
      modalStatusMsg.style.display = "none";
    }
    bisUsernameInput.focus();
  }

  function closeModal() {
    bisModal.classList.add("hidden");
    modalStatusMsg.style.display = "none";
    captchaContainer.style.display = "none";
    loginBtnText.textContent = "Authenticate & Save";
    saveLoginBtn.disabled = false;
  }

  function showModalStatus(text, type = "info") {
    modalStatusMsg.textContent = text;
    modalStatusMsg.className = `modal-status ${type}`;
    modalStatusMsg.style.display = "block";
  }

  bisAccountBtn.addEventListener("click", () => openModal());
  closeModalBtn.addEventListener("click", closeModal);
  cancelLoginBtn.addEventListener("click", closeModal);
  bisModal.addEventListener("click", (e) => {
    if (e.target === bisModal) closeModal();
  });

  // BIS Login Submission
  bisLoginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = bisUsernameInput.value.trim();
    const password = bisPasswordInput.value.trim();
    const captcha_code = bisCaptchaInput.value.trim();

    if (!username || !password) {
      showModalStatus("Username and password are required.", "error");
      return;
    }

    loginBtnText.textContent = "Authenticating...";
    saveLoginBtn.disabled = true;
    modalStatusMsg.style.display = "none";

    try {
      const res = await fetch("/api/bis/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, captcha_code }),
      });

      const result = await res.json();
      if (result.status === "success") {
        showModalStatus(result.message || "Successfully authenticated with BIS portal!", "success");
        updateBisAuthUI({ authenticated: true, username });
        setTimeout(() => closeModal(), 1400);
      } else if (result.status === "captcha_needed") {
        showModalStatus(result.message || "Please enter the captcha characters shown.", "info");
        if (result.captcha_image) {
          captchaImg.src = result.captcha_image;
          captchaContainer.style.display = "block";
          bisCaptchaInput.focus();
        }
      } else {
        showModalStatus(result.message || "Login failed. Please verify credentials.", "error");
        if (result.captcha_image) {
          captchaImg.src = result.captcha_image;
          captchaContainer.style.display = "block";
        }
      }
    } catch (err) {
      showModalStatus("Failed to contact BIS login service: " + err.message, "error");
    } finally {
      loginBtnText.textContent = "Authenticate & Save";
      saveLoginBtn.disabled = false;
    }
  });

  // Auto-resize chat textarea
  chatInput.addEventListener("input", () => {
    chatInput.style.height = "auto";
    chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + "px";
  });

  // Handle Enter key for submission (Shift+Enter for newline, IME composition guard)
  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      // Guard against IME composition for Indian languages (Hindi, Tamil, etc.)
      if (e.isComposing || e.keyCode === 229) return;
      e.preventDefault();
      if (!isSubmitting && (chatInput.value.trim() || currentAttachment)) {
        if (typeof chatForm.requestSubmit === "function") {
          chatForm.requestSubmit();
        } else {
          chatForm.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
        }
      }
    }
  });

  // --- Theme Controller (Light / Dark Mode) ---
  function initTheme() {
    if (!themeToggleBtn) return;
    const savedTheme = localStorage.getItem("bis_theme");
    const isDark = savedTheme === "dark" || (!savedTheme && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
    applyTheme(isDark ? "dark" : "light");

    themeToggleBtn.addEventListener("click", toggleTheme);

    // Listen to OS theme changes if user hasn't explicitly set one
    if (window.matchMedia) {
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
        if (!localStorage.getItem("bis_theme")) {
          applyTheme(e.matches ? "dark" : "light");
        }
      });
    }
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    if (themeIconSun && themeIconMoon) {
      if (theme === "dark") {
        themeIconSun.style.display = "inline-block";
        themeIconMoon.style.display = "none";
        themeToggleBtn.setAttribute("title", "Switch to Light mode");
        themeToggleBtn.setAttribute("aria-label", "Switch to Light mode");
      } else {
        themeIconSun.style.display = "none";
        themeIconMoon.style.display = "inline-block";
        themeToggleBtn.setAttribute("title", "Switch to Dark mode");
        themeToggleBtn.setAttribute("aria-label", "Switch to Dark mode");
      }
    }
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme") || "light";
    const next = current === "dark" ? "light" : "dark";
    localStorage.setItem("bis_theme", next);
    applyTheme(next);
  }

  // --- Multilingual Controller ---
  function initLanguage() {
    if (langSelect) {
      langSelect.value = currentLanguage;
      langSelect.addEventListener("change", (e) => {
        setLanguage(e.target.value);
      });
    }
    setLanguage(currentLanguage, false);
  }

  function setLanguage(langCode, updateStorage = true) {
    currentLanguage = langCode || "en";
    if (updateStorage) {
      localStorage.setItem("bis_lang", currentLanguage);
    }
    if (langSelect && langSelect.value !== currentLanguage) {
      langSelect.value = currentLanguage;
    }

    const dict = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;

    // 1. Localize static UI text (instant — no network)
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      if (dict[key]) {
        el.textContent = dict[key];
      }
    });

    // 2. Localize placeholders
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (dict[key]) {
        el.placeholder = dict[key];
      }
    });

    // 3. Update starter chips
    const chipsContainer = document.getElementById("greeting-chips");
    if (chipsContainer && dict.chips) {
      chipsContainer.innerHTML = "";
      dict.chips.forEach(c => {
        const btn = document.createElement("button");
        btn.className = "chat-chip";
        btn.setAttribute("data-chip", c.id);
        btn.setAttribute("data-query", c.query);
        btn.textContent = c.text;
        chipsContainer.appendChild(btn);
      });
      setupGreetingChips();
    }

    // 4. Update Speech Recognition language locale
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      if (currentSpeakingBtn) resetSpeakButton(currentSpeakingBtn);
    }
    if (speechRecognition) {
      speechRecognition.lang = VOICE_LOCALES[currentLanguage] || "en-IN";
      if (isListening) {
        try { speechRecognition.stop(); } catch (e) {}
        setTimeout(() => { if (isListening) startListening(); }, 200);
      }
    }

    // 5. Debounced message translation — avoids hammering the API on rapid language switches
    if (_langDebounceTimer) clearTimeout(_langDebounceTimer);
    _langDebounceTimer = setTimeout(() => {
      const targetLang = currentLanguage;
      chatMessages.forEach((msg) => {
        if (msg && typeof msg.updateLanguage === "function") {
          msg.updateLanguage(targetLang);
        }
      });
    }, 150);
  }

  function renderWelcomeMessage(isCleared = false) {
    const dict = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;
    const chipsHtml = (dict.chips || []).map(c => 
      `<button class="chat-chip" data-chip="${c.id}" data-query="${escapeHtml(c.query)}">${escapeHtml(c.text)}</button>`
    ).join("\n");

    const helloText = isCleared
      ? (currentLanguage === "hi" ? "चैट साफ़ की गई। मैं आपका बीआईएस सहायक हूँ।" : "Chat cleared. I am your BIS assistant.")
      : dict.greetingHello;

    chatFeed.innerHTML = `
      <div class="message-row assistant-row">
        ${ASSISTANT_AVATAR_HTML}
        <div class="message-bubble">
          <div class="bubble-meta">
            <div class="meta-tags">
              <span class="meta-tag tag-official-portal" data-i18n="tagOfficial">${escapeHtml(dict.tagOfficial || "Official BIS Assistant")}</span>
              <span class="meta-tag">standardsbis.bsbedge.com</span>
            </div>
          </div>
          <div class="bubble-markdown">
            <p><strong data-i18n="greetingHello">${escapeHtml(helloText)}</strong></p>
            <p data-i18n="greetingDesc">${escapeHtml(dict.greetingDesc)}</p>
            <div class="chips-container" id="greeting-chips">
              ${chipsHtml}
            </div>
          </div>
        </div>
      </div>
    `;
    setupGreetingChips();
  }

  // Setup Chips Click Listener
  function setupGreetingChips() {
    const chips = document.querySelectorAll(".chat-chip");
    chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        const query = chip.getAttribute("data-query");
        if (query) {
          submitUserQuery(query);
        }
      });
    });
  }

  // Clear Chat History
  clearChatBtn.addEventListener("click", () => {
    chatMessages.length = 0;
    renderWelcomeMessage(true);
    chatInput.focus();
  });

  // --- Attachments Setup (Camera & Document) ---
  function setupAttachments() {
    if (removeAttBtn) {
      removeAttBtn.addEventListener("click", clearAttachment);
    }

    if (docBtn && docFileInput) {
      docBtn.addEventListener("click", () => {
        docFileInput.click();
      });

      docFileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          setAttachment({
            name: file.name,
            type: "document",
            data: reader.result,
            size: file.size,
          });
        };
        reader.readAsDataURL(file);
        e.target.value = "";
      });
    }

    if (cameraFileInput) {
      cameraFileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          setAttachment({
            name: file.name,
            type: "image",
            data: reader.result,
            size: file.size,
          });
        };
        reader.readAsDataURL(file);
        e.target.value = "";
      });
    }
  }

  function setAttachment(att) {
    currentAttachment = att;
    if (attachmentPreviewBar) {
      attachmentPreviewBar.style.display = "flex";
      attName.textContent = att.name;
      attSize.textContent = formatBytes(att.size);
      attThumbContainer.innerHTML = "";

      if (att.type === "image") {
        const img = document.createElement("img");
        img.src = att.data;
        img.className = "att-thumb-img";
        img.alt = "Attached photo";
        attThumbContainer.appendChild(img);
      } else {
        const span = document.createElement("span");
        span.className = "att-doc-icon";
        span.textContent = "📄";
        attThumbContainer.appendChild(span);
      }
    }
    chatInput.focus();
  }

  function clearAttachment() {
    currentAttachment = null;
    if (attachmentPreviewBar) {
      attachmentPreviewBar.style.display = "none";
      attThumbContainer.innerHTML = "";
    }
  }

  function formatBytes(bytes) {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

  // --- Voice / Speech-to-Text Setup ---
  function setupVoiceRecognition() {
    if (!voiceBtn) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      voiceBtn.title = "Voice recognition is not supported in this browser";
      voiceBtn.addEventListener("click", () => {
        alert("Voice recognition is not supported in this browser. Please try Google Chrome or Microsoft Edge.");
      });
      return;
    }

    try {
      speechRecognition = new SpeechRecognition();
      speechRecognition.continuous = true;
      speechRecognition.interimResults = true;
      speechRecognition.maxAlternatives = 1;
      speechRecognition.lang = VOICE_LOCALES[currentLanguage] || "en-IN";

      speechRecognition.onstart = () => {
        isListening = true;
        voiceBtn.classList.add("voice-active");
        if (voiceListeningBar) {
          voiceListeningBar.style.display = "flex";
          const vText = voiceListeningBar.querySelector(".voice-text");
          const d = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;
          if (vText) vText.textContent = d.voiceListening || "Listening... Speak clearly into your microphone";
        }
      };

      speechRecognition.onresult = (event) => {
        let interimTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          const transcript = item[0].transcript;
          if (item.isFinal) {
            finalTranscript += transcript + " ";
          } else {
            interimTranscript += transcript;
          }
        }

        const speechCombined = (finalTranscript + interimTranscript).trim();
        if (speechCombined) {
          const fullValue = recognitionBaseText ? `${recognitionBaseText} ${speechCombined}` : speechCombined;
          chatInput.value = fullValue;
          chatInput.style.height = "auto";
          chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + "px";

          // Live visual feedback inside listening bar
          if (voiceListeningBar) {
            const vText = voiceListeningBar.querySelector(".voice-text");
            if (vText) {
              vText.textContent = `"${speechCombined}"`;
            }
          }
        }
      };

      speechRecognition.onerror = (e) => {
        console.warn("Speech recognition notice:", e.error);
        if (e.error === "no-speech") {
          // Do not abruptly terminate on short pauses between words
          return;
        }
        if (e.error === "not-allowed" || e.error === "service-not-allowed") {
          alert("Microphone access was denied. Please allow microphone permissions in your browser to use voice query.");
          stopListening();
        } else if (e.error === "network") {
          console.warn("Speech recognition network error.");
        }
      };

      speechRecognition.onend = () => {
        // If user is still in listening mode, restart to maintain continuous dictation
        if (isListening) {
          try {
            speechRecognition.start();
          } catch (err) {
            stopListening();
          }
        } else {
          stopListening();
        }
      };

      voiceBtn.addEventListener("click", () => {
        if (isListening) {
          stopListening();
        } else {
          startListening();
        }
      });

      if (stopVoiceBtn) {
        stopVoiceBtn.addEventListener("click", stopListening);
      }
    } catch (e) {
      console.warn("SpeechRecognition init error:", e);
    }
  }

  function startListening() {
    if (!speechRecognition) return;

    // Silence any active speech synthesis so microphone doesn't capture speaker sound
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      if (currentSpeakingBtn) resetSpeakButton(currentSpeakingBtn);
    }

    recognitionBaseText = chatInput.value.trim();
    finalTranscript = "";
    isListening = true;
    speechRecognition.lang = VOICE_LOCALES[currentLanguage] || "en-IN";

    try {
      speechRecognition.start();
    } catch (e) {
      if (e.name !== "InvalidStateError") {
        console.warn("Could not start speech recognition:", e);
      }
    }
  }

  function stopListening() {
    isListening = false;
    if (speechRecognition) {
      try { speechRecognition.stop(); } catch (e) {}
    }
    if (voiceBtn) voiceBtn.classList.remove("voice-active");
    if (voiceListeningBar) voiceListeningBar.style.display = "none";
    chatInput.focus();
  }

  // --- Live Camera Viewfinder Setup ---
  function setupCamera() {
    if (!cameraBtn) return;

    cameraBtn.addEventListener("click", openCameraModal);
    if (closeCameraBtn) closeCameraBtn.addEventListener("click", closeCameraModal);

    if (uploadPhotoBtn && cameraFileInput) {
      uploadPhotoBtn.addEventListener("click", () => {
        closeCameraModal();
        cameraFileInput.click();
      });
    }

    if (snapPhotoBtn) {
      snapPhotoBtn.addEventListener("click", () => {
        if (!cameraVideo || !cameraVideo.videoWidth) {
          alert("Camera stream is not ready yet. Please allow camera permissions or select a photo.");
          return;
        }
        const canvas = cameraCanvas;
        canvas.width = cameraVideo.videoWidth;
        canvas.height = cameraVideo.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(cameraVideo, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.88);

        setAttachment({
          name: `camera_snapshot_${Date.now()}.jpg`,
          type: "image",
          data: dataUrl,
          size: Math.round(dataUrl.length * 0.75),
        });

        closeCameraModal();
      });
    }
  }

  async function openCameraModal() {
    if (!cameraModal) return;
    cameraModal.classList.remove("hidden");
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        cameraStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        if (cameraVideo) {
          cameraVideo.srcObject = cameraStream;
        }
      } else {
        throw new Error("getUserMedia not supported");
      }
    } catch (err) {
      console.warn("Webcam access error:", err);
      closeCameraModal();
      if (cameraFileInput) cameraFileInput.click();
    }
  }

  function closeCameraModal() {
    if (!cameraModal) return;
    cameraModal.classList.add("hidden");
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      cameraStream = null;
    }
  }

  // Form Submit Handler
  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (isListening) stopListening();

    let query = chatInput.value.trim();
    if (!query && !currentAttachment) return;

    if (!query && currentAttachment) {
      query = currentAttachment.type === "image"
        ? "Please inspect and analyze this attached product/label image under Indian Standards."
        : "Please analyze this attached document under BIS requirements.";
    }

    submitUserQuery(query, currentAttachment);
  });

  async function submitUserQuery(query, attachment = null) {
    if (isSubmitting) return;
    isSubmitting = true;
    sendBtn.disabled = true;

    // Snapshot attachment and clear entry bar
    const attToSend = attachment || currentAttachment;
    clearAttachment();

    // Reset textarea
    chatInput.value = "";
    chatInput.style.height = "auto";

    // 1. Append User Message Bubble (with attachment thumbnail if present)
    appendUserMessage(query, attToSend);

    // 2. Append Typing Indicator Bubble
    const typingId = "typing-" + Date.now();
    appendTypingIndicator(typingId);
    scrollToBottom();

    try {
      const payload = { query, language: currentLanguage };
      if (attToSend) {
        payload.attachment_name = attToSend.name;
        payload.attachment_type = attToSend.type;
        payload.attachment_data = attToSend.data;
      }

      const response = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error: ${response.status}`);
      }

      const data = await response.json();

      // Remove typing bubble and append full Assistant response
      removeElement(typingId);
      appendAssistantMessage(data);
      scrollToBottom();

    } catch (err) {
      removeElement(typingId);
      appendErrorMessage(err.message || "Failed to communicate with BIS assistant.");
      scrollToBottom();
    } finally {
      isSubmitting = false;
      sendBtn.disabled = false;
      chatInput.focus();
    }
  }

  function appendUserMessage(text, attachment = null) {
    const dict = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;
    const row = document.createElement("div");
    row.className = "message-row user-row";

    let attHtml = "";
    if (attachment) {
      if (attachment.type === "image") {
        attHtml = `
          <div class="user-msg-attachment">
            <img src="${attachment.data}" class="user-msg-attachment-img" alt="Attached photo">
            <div>
              <div style="font-weight: 600;">${escapeHtml(attachment.name)}</div>
              <div style="font-size: 10.5px; color: var(--text-muted);">${formatBytes(attachment.size)}</div>
            </div>
          </div>
        `;
      } else {
        attHtml = `
          <div class="user-msg-attachment">
            <span style="font-size: 22px;">📄</span>
            <div>
              <div style="font-weight: 600;">${escapeHtml(attachment.name)}</div>
              <div style="font-size: 10.5px; color: var(--text-muted);">${formatBytes(attachment.size)}</div>
            </div>
          </div>
        `;
      }
    }

    row.innerHTML = `
      <div class="message-bubble">
        <p>${escapeHtml(text).replace(/\n/g, "<br>")}</p>
        ${attHtml}
      </div>
      <div class="avatar avatar-user">${escapeHtml(dict.you || "You")}</div>
    `;
    chatFeed.appendChild(row);

    chatMessages.push({
      role: "user",
      text,
      domElement: row,
      updateLanguage(lang) {
        const d = TRANSLATIONS[lang] || TRANSLATIONS.en;
        const av = row.querySelector(".avatar-user");
        if (av) av.textContent = d.you || "You";
      }
    });
  }

  function appendTypingIndicator(id) {
    const dict = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;
    const row = document.createElement("div");
    row.className = "message-row assistant-row";
    row.id = id;
    row.innerHTML = `
      ${ASSISTANT_AVATAR_HTML}
      <div class="message-bubble" style="padding: 10px 14px;">
        <div class="typing-indicator">
          <div class="dots-loader">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </div>
          <span>${escapeHtml(dict.searching || "Searching Indian Standards & preparing guidance...")}</span>
        </div>
      </div>
    `;
    chatFeed.appendChild(row);
  }

  function appendErrorMessage(errorText) {
    const row = document.createElement("div");
    row.className = "message-row assistant-row";
    row.innerHTML = `
      ${ASSISTANT_AVATAR_HTML}
      <div class="message-bubble" style="border-color: #fecaca; background-color: #fef2f2; color: #991b1b;">
        <p><strong>Error</strong>: ${escapeHtml(errorText)}</p>
      </div>
    `;
    chatFeed.appendChild(row);
  }

  function appendAssistantMessage(data) {
    const dict = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;
    const row = document.createElement("div");
    row.className = "message-row assistant-row";

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";

    // 1. Meta Tags & Copy Action
    const metaBar = document.createElement("div");
    metaBar.className = "bubble-meta";

    const tagsDiv = document.createElement("div");
    tagsDiv.className = "meta-tags";

    // Engine Tag
    const engineTag = document.createElement("span");
    engineTag.className = "meta-tag engine-tag";
    engineTag.textContent = data.engine || "BIS AI";
    tagsDiv.appendChild(engineTag);

    // Category Tag
    if (data.category) {
      const catTag = document.createElement("span");
      catTag.className = "meta-tag";
      catTag.textContent = formatCategory(data.category);
      tagsDiv.appendChild(catTag);
    }

    // Keywords Tags
    (data.extracted_keywords || []).slice(0, 3).forEach((kw) => {
      const kwTag = document.createElement("span");
      kwTag.className = "meta-tag";
      kwTag.textContent = `#${kw}`;
      tagsDiv.appendChild(kwTag);
    });

    // Meta Actions Container (In-Bubble Language Picker + Copy Button)
    const metaActions = document.createElement("div");
    metaActions.className = "meta-actions";

    const langPicker = document.createElement("div");
    langPicker.className = "msg-lang-picker";
    langPicker.title = "Translate this answer dynamically";
    langPicker.innerHTML = `
      <svg class="msg-lang-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="2" y1="12" x2="22" y2="12"></line>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
      </svg>
      <select class="msg-lang-select" aria-label="Translate answer">
        <option value="en">English</option>
        <option value="hi">हिन्दी (Hindi)</option>
        <option value="mr">मराठी (Marathi)</option>
        <option value="ta">தமிழ் (Tamil)</option>
        <option value="te">తెలుగు (Telugu)</option>
        <option value="bn">বাংলা (Bengali)</option>
        <option value="gu">ગુજરાતી (Gujarati)</option>
        <option value="kn">ಕನ್ನಡ (Kannada)</option>
      </select>
    `;
    const msgLangSelect = langPicker.querySelector(".msg-lang-select");
    msgLangSelect.value = currentLanguage;
    msgLangSelect.addEventListener("change", (e) => {
      setLanguage(e.target.value);
    });

    // Speak / Listen Button
    const speakBtn = document.createElement("button");
    speakBtn.type = "button";
    speakBtn.className = "speak-button";
    speakBtn.title = "Read answer aloud (Speech)";
    speakBtn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
      </svg>
      <span>${escapeHtml(dict.speakBtn || "Listen")}</span>
    `;
    speakBtn.addEventListener("click", () => {
      const currentAns = msgRecord.translations[currentLanguage] || msgRecord.canonicalText || data.answer || "";
      speakText(currentAns, currentLanguage, speakBtn);
    });

    // Copy Button
    const copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.className = "copy-button";
    copyBtn.title = "Copy answer text";
    copyBtn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
      <span>${escapeHtml(dict.copyBtn || "Copy")}</span>
    `;
    copyBtn.addEventListener("click", () => {
      const currentAns = msgRecord.translations[currentLanguage] || msgRecord.canonicalText || data.answer || "";
      copyToClipboard(currentAns, () => {
        const dNow = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;
        const cSpan = copyBtn.querySelector("span");
        if (cSpan) cSpan.textContent = dNow.copiedBtn || "Copied!";
        setTimeout(() => {
          const dReset = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;
          if (cSpan) cSpan.textContent = dReset.copyBtn || "Copy";
        }, 1800);
      });
    });

    metaActions.appendChild(langPicker);
    metaActions.appendChild(speakBtn);
    metaActions.appendChild(copyBtn);

    metaBar.appendChild(tagsDiv);
    metaBar.appendChild(metaActions);
    bubble.appendChild(metaBar);

    // 2. Matched Indian Standards Grid (if standards found)
    const standards = data.matched_standards || [];
    let stdHeader = null;
    const stdCardRefs = [];

    if (standards.length > 0) {
      stdHeader = document.createElement("div");
      stdHeader.style.cssText = "font-size: 11.5px; font-weight: 700; color: var(--text-primary); margin-top: 4px;";
      stdHeader.textContent = `${dict.standardsFound || "Official Indian Standards Found"} (${standards.length}):`;
      bubble.appendChild(stdHeader);

      const grid = document.createElement("div");
      grid.className = "standards-grid";

      standards.slice(0, 4).forEach((std) => {
        const card = document.createElement("div");
        card.className = "std-card";

        const isActive = (std.status || "").toLowerCase() === "active";
        const statusClass = isActive ? "active" : "withdrawn";
        const statusText = isActive ? (dict.active || "ACTIVE") : (dict.withdrawn || "WITHDRAWN");

        card.innerHTML = `
          <div>
            <div class="std-card-header">
              <span class="std-number">${escapeHtml(std.is_number)}</span>
              <span class="std-status ${statusClass}">${escapeHtml(statusText)}</span>
            </div>
            <p class="std-title">${escapeHtml(std.title || "Standard Specification")}</p>
            <div class="std-meta">
              <span class="std-tc">${std.technical_committee ? `${dict.tcLabel || "TC"}: ${escapeHtml(std.technical_committee)}` : ""}</span>
              <span class="std-amnd">${dict.amendmentsLabel || "Amendments"}: ${std.amendments}</span>
            </div>
          </div>
          <div class="std-actions">
            ${std.preview_url ? `
              <a href="${escapeHtml(std.preview_url)}" target="_blank" rel="noopener noreferrer" class="btn-std-preview" title="View official scope & clause preview">
                ${escapeHtml(dict.previewBtn || "Preview")}
              </a>
            ` : ""}
            <button type="button" class="btn-std-download" data-preview-id="${escapeHtml(std.preview_id || '')}" data-is-number="${escapeHtml(std.is_number)}" title="Download full PDF standard">
              ${escapeHtml(dict.downloadBtn || "Download PDF")}
            </button>
          </div>
        `;

        const dlBtn = card.querySelector(".btn-std-download");
        dlBtn.addEventListener("click", () => {
          downloadStandardPdf(std.preview_id, std.is_number, dlBtn);
        });

        stdCardRefs.push({
          cardEl: card,
          std,
          statusSpan: card.querySelector(".std-status"),
          previewLink: card.querySelector(".btn-std-preview"),
          downloadBtn: dlBtn,
          tcSpan: card.querySelector(".std-tc"),
          amndSpan: card.querySelector(".std-amnd"),
        });

        grid.appendChild(card);
      });

      bubble.appendChild(grid);
    }

    // 3. Primary Standard Clause & Scope Preview Accordion
    let previewBox = null;
    let previewToggleBtn = null;
    let previewContent = null;
    let previewArrow = null;

    if (data.primary_preview && data.primary_preview.trim().length > 40) {
      previewBox = document.createElement("div");
      previewBox.className = "preview-box";
      previewBox.innerHTML = `
        <button type="button" class="preview-toggle">
          <span class="toggle-title">${escapeHtml(dict.scopeClausePreview || "Official Standard Scope & Clause 1 Preview")}</span>
          <span class="arrow">&plus; ${escapeHtml(dict.expand || "Expand")}</span>
        </button>
        <div class="preview-content" style="display: none;">${escapeHtml(data.primary_preview.trim())}</div>
      `;

      previewToggleBtn = previewBox.querySelector(".preview-toggle");
      previewContent = previewBox.querySelector(".preview-content");
      previewArrow = previewBox.querySelector(".arrow");

      previewToggleBtn.addEventListener("click", () => {
        const isHidden = previewContent.style.display === "none";
        previewContent.style.display = isHidden ? "block" : "none";
        const curD = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;
        previewArrow.innerHTML = isHidden
          ? `&minus; ${escapeHtml(curD.collapse || "Collapse")}`
          : `&plus; ${escapeHtml(curD.expand || "Expand")}`;
      });

      bubble.appendChild(previewBox);
    }

    // 4. Formatted Answer Markdown
    const markdownDiv = document.createElement("div");
    markdownDiv.className = "bubble-markdown";
    markdownDiv.innerHTML = formatMarkdown(data.answer || "");
    bubble.appendChild(markdownDiv);

    // 5. Official Source Bar
    let sourceBar = null;
    let sourceLabelSpan = null;
    if (data.source_url) {
      sourceBar = document.createElement("div");
      sourceBar.className = "source-bar";
      sourceLabelSpan = document.createElement("span");
      sourceLabelSpan.style.color = "var(--text-muted)";
      sourceLabelSpan.textContent = (dict.sourceLabel || "Source:") + " ";
      sourceBar.appendChild(sourceLabelSpan);

      const sourceLink = document.createElement("a");
      sourceLink.href = data.source_url;
      sourceLink.target = "_blank";
      sourceLink.rel = "noopener noreferrer";
      sourceLink.textContent = data.source_url;
      sourceBar.appendChild(sourceLink);

      bubble.appendChild(sourceBar);
    }

    row.innerHTML = ASSISTANT_AVATAR_HTML;
    row.appendChild(bubble);
    chatFeed.appendChild(row);

    // Detect if the initial answer is primarily ASCII English or already in an Indian script
    const hasNonAscii = /[^\x00-\x7F]/.test(data.answer || "");
    const initialTranslations = {};
    if (!hasNonAscii || currentLanguage === "en") {
      initialTranslations["en"] = data.answer || "";
    } else {
      initialTranslations[currentLanguage] = data.answer || "";
    }

    const canonicalAnswer = data.answer || "";
    const msgRecord = {
      role: "assistant",
      data,
      canonicalText: canonicalAnswer,
      translations: initialTranslations,
      isTranslating: false,
      nextTargetLang: null,
      domElement: row,
      elements: {
        msgLangSelect,
        speakBtn,
        copyBtn,
        stdHeader,
        stdCardRefs,
        previewBox,
        previewToggleBtn,
        previewContent,
        previewArrow,
        sourceBar,
        sourceLabelSpan,
        markdownDiv,
      },
      updateLanguage: async function(targetLang) {
        const d = TRANSLATIONS[targetLang] || TRANSLATIONS.en;

        if (msgLangSelect && msgLangSelect.value !== targetLang) {
          msgLangSelect.value = targetLang;
        }

        if (speakBtn) {
          const sSpan = speakBtn.querySelector("span");
          if (sSpan) {
            sSpan.textContent = speakBtn.classList.contains("speaking")
              ? (d.stopSpeakBtn || "Stop")
              : (d.speakBtn || "Listen");
          }
        }

        if (copyBtn) {
          const cSpan = copyBtn.querySelector("span");
          if (cSpan) cSpan.textContent = d.copyBtn || "Copy";
        }

        if (stdHeader) {
          stdHeader.textContent = `${d.standardsFound || "Official Indian Standards Found"} (${standards.length}):`;
        }

        if (stdCardRefs && stdCardRefs.length > 0) {
          stdCardRefs.forEach(({ std, statusSpan, previewLink, downloadBtn, tcSpan, amndSpan }) => {
            const isAct = (std.status || "").toLowerCase() === "active";
            if (statusSpan) {
              statusSpan.textContent = isAct ? (d.active || "ACTIVE") : (d.withdrawn || "WITHDRAWN");
            }
            if (previewLink) {
              previewLink.textContent = d.previewBtn || "Preview";
            }
            if (downloadBtn) {
              if (downloadBtn.classList.contains("downloaded")) {
                downloadBtn.textContent = d.openPdf || "Open PDF";
              } else {
                downloadBtn.textContent = d.downloadBtn || "Download PDF";
              }
            }
            if (tcSpan && std.technical_committee) {
              tcSpan.textContent = `${d.tcLabel || "TC"}: ${std.technical_committee}`;
            }
            if (amndSpan) {
              amndSpan.textContent = `${d.amendmentsLabel || "Amendments"}: ${std.amendments}`;
            }
          });
        }

        if (previewToggleBtn && previewArrow) {
          const tTitle = previewToggleBtn.querySelector(".toggle-title");
          if (tTitle) tTitle.textContent = d.scopeClausePreview || "Official Standard Scope & Clause 1 Preview";
          const isHidden = previewContent && previewContent.style.display === "none";
          previewArrow.innerHTML = isHidden
            ? `&plus; ${escapeHtml(d.expand || "Expand")}`
            : `&minus; ${escapeHtml(d.collapse || "Collapse")}`;
        }

        if (sourceLabelSpan) {
          sourceLabelSpan.textContent = (d.sourceLabel || "Source:") + " ";
        }

        // Answer localization logic
        if (!markdownDiv || !data.answer) return;

        // 1. If target translation is already cached, update immediately!
        if (this.translations[targetLang]) {
          markdownDiv.innerHTML = formatMarkdown(this.translations[targetLang]);
          return;
        }

        // 2. If target is English and we have an English version
        if (targetLang === "en" && this.translations["en"]) {
          markdownDiv.innerHTML = formatMarkdown(this.translations["en"]);
          return;
        }

        // 3. If currently translating, queue this target language so it executes next
        if (this.isTranslating) {
          this.nextTargetLang = targetLang;
          return;
        }

        this.isTranslating = true;
        const currentAnswerHtml = markdownDiv.innerHTML;
        const badgeHtml = `
          <div class="translating-badge">
            <span class="translating-spinner"></span>
            <span>${escapeHtml(d.translating || "Translating response...")}</span>
          </div>
        `;
        markdownDiv.innerHTML = badgeHtml + `<div class="translating-dimmed">${currentAnswerHtml}</div>`;

        try {
          const sourceText = this.translations["en"] || this.canonicalText || data.answer;
          const res = await fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: sourceText,
              target_language: targetLang,
              source_language: "auto",
            }),
          });
          if (res.ok) {
            const transResult = await res.json();
            if (transResult.translated_text && transResult.translated_text.trim()) {
              this.translations[targetLang] = transResult.translated_text;
              if (currentLanguage === targetLang) {
                markdownDiv.innerHTML = formatMarkdown(transResult.translated_text);
              }
              return;
            }
          }
          if (currentLanguage === targetLang) {
            markdownDiv.innerHTML = currentAnswerHtml;
          }
        } catch (tErr) {
          console.warn("Translation request error:", tErr);
          if (currentLanguage === targetLang) {
            markdownDiv.innerHTML = currentAnswerHtml;
          }
        } finally {
          this.isTranslating = false;
          if (this.nextTargetLang && this.nextTargetLang !== targetLang) {
            const next = this.nextTargetLang;
            this.nextTargetLang = null;
            this.updateLanguage(next);
          }
        }
      }
    };

    chatMessages.push(msgRecord);

    // If current interface language is not English and answer has no translation yet, auto-translate immediately
    if (currentLanguage !== "en" && !msgRecord.translations[currentLanguage]) {
      msgRecord.updateLanguage(currentLanguage);
    }
  }

  // Handle PDF Download in Chat
  async function downloadStandardPdf(previewId, isNumber, btn) {
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Downloading...";

    try {
      const res = await fetch("/api/bis/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preview_id: previewId, is_number: isNumber }),
      });

      const data = await res.json();
      if (data.status === "login_required" || data.status === "session_expired") {
        btn.textContent = originalText;
        btn.disabled = false;
        openModal(data.message || "Please authenticate your BIS account to download full official PDFs.");
        return;
      }

      if (data.status === "success") {
        btn.textContent = "Open PDF";
        btn.className = "btn-std-download downloaded";
        btn.onclick = () => window.open(data.download_url, "_blank");
        btn.disabled = false;
        window.open(data.download_url, "_blank");
      } else {
        alert(data.message || "Could not download PDF from BIS portal.");
        btn.textContent = originalText;
        btn.disabled = false;
      }
    } catch (err) {
      alert("Error contacting download service: " + err.message);
      btn.textContent = originalText;
      btn.disabled = false;
    }
  }

  function scrollToBottom() {
    chatFeed.scrollTop = chatFeed.scrollHeight;
  }

  function removeElement(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  function formatCategory(cat) {
    return (cat || "")
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  // --- Clipboard Copy Helper ---
  function copyToClipboard(text, onSuccess) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => {
          if (typeof onSuccess === "function") onSuccess();
        })
        .catch(() => {
          fallbackCopy(text, onSuccess);
        });
    } else {
      fallbackCopy(text, onSuccess);
    }
  }

  function fallbackCopy(text, onSuccess) {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      textarea.style.pointerEvents = "none";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      if (typeof onSuccess === "function") onSuccess();
    } catch (err) {
      console.warn("Fallback clipboard copy failed:", err);
    }
  }

  // --- Text-to-Speech (Read Aloud) Helper ---
  function speakText(text, langCode, buttonEl) {
    if (!("speechSynthesis" in window)) {
      alert("Text-to-speech audio is not supported in this browser.");
      return;
    }

    // Toggle off if currently speaking from this button
    if (window.speechSynthesis.speaking && currentSpeakingBtn === buttonEl) {
      window.speechSynthesis.cancel();
      resetSpeakButton(buttonEl);
      currentSpeakingBtn = null;
      currentUtterance = null;
      return;
    }

    // Cancel any other speaking utterance
    window.speechSynthesis.cancel();
    if (currentSpeakingBtn) {
      resetSpeakButton(currentSpeakingBtn);
    }

    // Stop voice recognition so mic doesn't capture speaker output
    if (isListening) {
      stopListening();
    }

    // Strip markdown formatting, code blocks, links, and bullets for natural narration
    const cleanText = text
      .replace(/```[\s\S]*?```/g, "")
      .replace(/`.*?`/g, "")
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
      .replace(/[*#_>~|•]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const targetLocale = VOICE_LOCALES[langCode] || "en-IN";
    utterance.lang = targetLocale;
    utterance.rate = 0.95; // comfortable, natural pace
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      const matched = voices.find(v => v.lang === targetLocale) ||
        voices.find(v => v.lang.replace(/_/g, "-") === targetLocale) ||
        voices.find(v => v.lang.startsWith(langCode)) ||
        voices.find(v => v.lang.includes("IN"));
      if (matched) {
        utterance.voice = matched;
      }
    }

    setSpeakingButtonActive(buttonEl);
    currentSpeakingBtn = buttonEl;
    currentUtterance = utterance;

    utterance.onend = () => {
      resetSpeakButton(buttonEl);
      if (currentSpeakingBtn === buttonEl) {
        currentSpeakingBtn = null;
        currentUtterance = null;
      }
    };

    utterance.onerror = (e) => {
      console.warn("Speech synthesis notice:", e);
      resetSpeakButton(buttonEl);
      if (currentSpeakingBtn === buttonEl) {
        currentSpeakingBtn = null;
        currentUtterance = null;
      }
    };

    window.speechSynthesis.speak(utterance);
  }

  function setSpeakingButtonActive(btn) {
    if (!btn) return;
    btn.classList.add("speaking");
    const d = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;
    btn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="6" y="4" width="4" height="16"></rect>
        <rect x="14" y="4" width="4" height="16"></rect>
      </svg>
      <span>${escapeHtml(d.stopSpeakBtn || "Stop")}</span>
    `;
  }

  function resetSpeakButton(btn) {
    if (!btn) return;
    btn.classList.remove("speaking");
    const d = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;
    btn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
      </svg>
      <span>${escapeHtml(d.speakBtn || "Listen")}</span>
    `;
  }

  // Robust Markdown Formatter
  function formatMarkdown(text) {
    if (!text) return "";

    // 1. Isolate code blocks to protect them from regex formatting
    const codeBlocks = [];
    let processed = text.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
      const idx = codeBlocks.length;
      codeBlocks.push(`<pre class="code-block"><code>${escapeHtml(code.trim())}</code></pre>`);
      return `\n@@CODE_BLOCK_${idx}@@\n`;
    });

    // 2. Escape HTML characters in remaining text
    processed = escapeHtml(processed);

    // 3. Re-inject code blocks (un-escaped HTML tags preserved)
    processed = processed.replace(/@@CODE_BLOCK_(\d+)@@/g, (match, idx) => {
      return codeBlocks[parseInt(idx, 10)] || "";
    });

    // 4. Inline formatting
    // Inline code: `code`
    processed = processed.replace(/`([^`\n]+)`/g, '<code>$1</code>');
    // Bold & Italics
    processed = processed.replace(/\*\*\*([^*\n]+)\*\*\*/g, '<strong><em>$1</em></strong>');
    processed = processed.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
    processed = processed.replace(/(^|[^\*])\*([^*\n]+)\*([^\*]|$)/g, '$1<em>$2</em>$3');
    // Markdown links: [text](url)
    processed = processed.replace(/\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // 5. Block splitting by blank lines
    const rawBlocks = processed.split(/\n\s*\n+/);
    const htmlBlocks = [];

    for (let block of rawBlocks) {
      block = block.trim();
      if (!block) continue;

      // Preserved code block
      if (block.startsWith('<pre class="code-block">')) {
        htmlBlocks.push(block);
        continue;
      }

      const lines = block.split('\n');
      let inUl = false;
      let inOl = false;
      let inTable = false;
      let blockParts = [];

      for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line) continue;

        // Table row check: | col1 | col2 |
        if (line.startsWith('|') && line.endsWith('|')) {
          if (/^\|[-:\s|]+\|$/.test(line)) {
            continue; // Divider row
          }
          if (inUl) { blockParts.push('</ul>'); inUl = false; }
          if (inOl) { blockParts.push('</ol>'); inOl = false; }
          if (!inTable) {
            inTable = true;
            blockParts.push('<table class="md-table"><tbody>');
          }
          const cells = line.split('|').slice(1, -1);
          blockParts.push(`<tr>${cells.map(c => `<td>${c.trim()}</td>`).join('')}</tr>`);
          continue;
        } else if (inTable) {
          blockParts.push('</tbody></table>');
          inTable = false;
        }

        // Headers
        if (/^####\s+(.*)$/.test(line)) {
          if (inUl) { blockParts.push('</ul>'); inUl = false; }
          if (inOl) { blockParts.push('</ol>'); inOl = false; }
          blockParts.push(`<h4>${line.replace(/^####\s+/, '')}</h4>`);
        } else if (/^###\s+(.*)$/.test(line)) {
          if (inUl) { blockParts.push('</ul>'); inUl = false; }
          if (inOl) { blockParts.push('</ol>'); inOl = false; }
          blockParts.push(`<h3>${line.replace(/^###\s+/, '')}</h3>`);
        } else if (/^##\s+(.*)$/.test(line)) {
          if (inUl) { blockParts.push('</ul>'); inUl = false; }
          if (inOl) { blockParts.push('</ol>'); inOl = false; }
          blockParts.push(`<h2>${line.replace(/^##\s+/, '')}</h2>`);
        } else if (/^#\s+(.*)$/.test(line)) {
          if (inUl) { blockParts.push('</ul>'); inUl = false; }
          if (inOl) { blockParts.push('</ol>'); inOl = false; }
          blockParts.push(`<h1>${line.replace(/^#\s+/, '')}</h1>`);
        }
        // Blockquote
        else if (/^(?:&gt;|>)\s*(.*)$/.test(line)) {
          if (inUl) { blockParts.push('</ul>'); inUl = false; }
          if (inOl) { blockParts.push('</ol>'); inOl = false; }
          const qText = line.replace(/^(?:&gt;|>)\s*/, '');
          blockParts.push(`<blockquote>${qText}</blockquote>`);
        }
        // Unordered list item (- or * or •)
        else if (/^[-*•]\s+(.*)$/.test(line)) {
          if (inOl) { blockParts.push('</ol>'); inOl = false; }
          if (!inUl) { blockParts.push('<ul>'); inUl = true; }
          blockParts.push(`<li>${line.replace(/^[-*•]\s+/, '')}</li>`);
        }
        // Ordered list item (1. or 1) )
        else if (/^\d+[\.\)]\s+(.*)$/.test(line)) {
          if (inUl) { blockParts.push('</ul>'); inUl = false; }
          if (!inOl) { blockParts.push('<ol>'); inOl = true; }
          blockParts.push(`<li>${line.replace(/^\d+[\.\)]\s+/, '')}</li>`);
        }
        // Regular paragraph line
        else {
          if (inUl) { blockParts.push('</ul>'); inUl = false; }
          if (inOl) { blockParts.push('</ol>'); inOl = false; }
          blockParts.push(`<p>${line}</p>`);
        }
      }

      if (inUl) blockParts.push('</ul>');
      if (inOl) blockParts.push('</ol>');
      if (inTable) blockParts.push('</tbody></table>');

      htmlBlocks.push(blockParts.join(''));
    }

    return htmlBlocks.join('\n');
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
});
