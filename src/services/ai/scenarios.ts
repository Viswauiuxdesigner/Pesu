import { PracticeScenario } from '../../types/conversation';

export const PRACTICE_SCENARIOS: PracticeScenario[] = [
  {
    id: 'free_talk',
    title: 'Free Speaking Practice',
    tamilTitle: 'சுதந்திர உரையாடல்',
    description: 'Speak freely in Tamil, Tanglish, or English. I will guide and support you without judgment.',
    tamilDescription: 'தமிழ், ஆங்கிலம் அல்லது Tanglish-ல் தாராளமாக பேசுங்கள். தயக்கமின்றி உரையாடலாம்.',
    icon: 'MessageSquare',
    initialMessage: 'Vanakkam! I am your PESU speaking partner. What would you like to talk about today? You can speak in Tamil, English, or mixed Tanglish—do not worry about making mistakes!',
    initialTamilExplanation: 'வணக்கம்! நான் உங்கள் PESU உரையாடல் நண்பர். இன்று எதைப் பற்றி பேச விரும்புகிறீர்கள்? தமிழில், ஆங்கிலத்தில் அல்லது கலந்து பேசலாம். பயப்படாமல் தொடங்குங்கள்!',
    starterPrompts: [
      {
        label: 'Speaking Fear',
        tanglish: 'Enakku English pesa romba bayama irukku, epdi start panrathu?',
        tamil: 'எனக்கு ஆங்கிலம் பேச ரொம்ப பயமா இருக்கு, எப்படி ஆரம்பிப்பது?',
        english: 'I feel very hesitant to speak in English. How should I start?'
      },
      {
        label: 'Tense Mistake',
        tanglish: 'I am go to office yesterday and met my boss.',
        tamil: 'நேற்று நான் அலுவலகம் சென்று மேலாளரை சந்தித்தேன்.',
        english: 'I am go to office yesterday and met my boss.'
      },
      {
        label: 'Tamil Translation Request',
        tanglish: 'Can you explain this in Tamil?',
        tamil: 'இதை தமிழில் விளக்க முடியுமா?',
        english: 'Can you explain this in Tamil?'
      }
    ]
  },
  {
    id: 'interview',
    title: 'Job Interview & Self Intro',
    tamilTitle: 'வேலை நேர்காணல் & சுய அறிமுகம்',
    description: 'Practice self-introductions, answering strengths and project questions with confidence.',
    tamilDescription: 'சுய அறிமுகம், பலங்கள் மற்றும் ப்ராஜெக்ட் விளக்கங்களை நம்பிக்கையுடன் பேச பழகுங்கள்.',
    icon: 'Briefcase',
    initialMessage: 'Welcome to your interview practice! Let’s start with the most common question: "Could you please tell me about yourself and your background?" Take a deep breath and give it a try.',
    initialTamilExplanation: 'நேர்காணல் பயிற்சிக்கு நல்வரவு! பொதுவாக கேட்கப்படும் முதல் கேள்வி: "உங்களைப் பற்றியும் உங்கள் பின்னணியைப் பற்றியும் சொல்லுங்கள்?" மெதுவாக உங்கள் அறிமுகத்தை ஆங்கிலத்தில் முயற்சியுங்கள்.',
    starterPrompts: [
      {
        label: 'Self-Intro Query',
        tanglish: 'Enakku interview-la self introduction English-la solla theriyala.',
        tamil: 'எனக்கு நேர்காணலில் ஆங்கிலத்தில் சுய அறிமுகம் சொல்ல தெரியவில்லை.',
        english: 'I don’t know how to give a self-introduction in an interview.'
      },
      {
        label: 'Sample Intro Attempt',
        tanglish: 'Myself Vignesh, I am having 3 years experience in software.',
        tamil: 'நான் விக்னேஷ், மென்பொருள் துறையில் 3 ஆண்டுகள் அனுபவம் உள்ளது.',
        english: 'Myself Vignesh, I am having 3 years experience in software.'
      },
      {
        label: 'Ask for Tips',
        tanglish: 'Interview-la confidence-oda answer panna tips solreengala?',
        tamil: 'நேர்காணலில் தன்னம்பிக்கையுடன் பதிலளிக்க குறிப்புகள் கூறுங்கள்.',
        english: 'Can you give me tips to answer with confidence in an interview?'
      }
    ]
  },
  {
    id: 'office_meeting',
    title: 'Office & Team Discussions',
    tamilTitle: 'அலுவலக உரையாடல் & மீட்டிங்',
    description: 'Learn how to give project updates, ask for leave, share ideas, and talk to your manager.',
    tamilDescription: 'ப்ராஜெக்ட் அப்டேட்ஸ், விடுமுறை கேட்டல், மற்றும் மீட்டிங்கில் கருத்துகளை இயல்பாக பகிருங்கள்.',
    icon: 'Users',
    initialMessage: 'Hi there! In office environments, clear and polite English helps you stand out. What workplace situation would you like to practice today? (e.g., daily standup, asking for leave, or client updates)',
    initialTamilExplanation: 'வணக்கம்! அலுவலகத்தில் எளிய ஆங்கிலம் பேசுவது உங்கள் தன்னம்பிக்கையை உயர்த்தும். இன்று எந்த சூழ்நிலையை பழக விரும்புகிறீர்கள்? (தினசரி ஸ்டாண்டப், விடுப்பு கேட்பது, அல்லது மேலாளரிடம் பேசுவது)',
    starterPrompts: [
      {
        label: 'Asking for Leave',
        tanglish: 'Manager kitta 2 days leave kekka English-la eppadi mail anuppurathu?',
        tamil: 'மேலாளரிடம் 2 நாட்கள் விடுமுறை கேட்க ஆங்கிலத்தில் எப்படி மின்னஞ்சல் அனுப்புவது?',
        english: 'How do I draft an email to my manager asking for 2 days of leave?'
      },
      {
        label: 'Project Update',
        tanglish: 'Yesterday I finished the login screen testing, today working on API.',
        tamil: 'நேற்று நான் லாகின் ஸ்கிரீன் டெஸ்டிங் முடித்தேன், இன்று API-ல் வேலை செய்கிறேன்.',
        english: 'Yesterday I finished the login screen testing, today working on API.'
      },
      {
        label: 'Clarification',
        tanglish: 'I am having doubt regarding the client requirement.',
        tamil: 'கிளையன்ட் தேவை குறித்து எனக்கு ஒரு சந்தேகம் உள்ளது.',
        english: 'I am having doubt regarding the client requirement.'
      }
    ]
  },
  {
    id: 'everyday_chat',
    title: 'Everyday Casual Conversation',
    tamilTitle: 'அன்றாட பேச்சு & நண்பர்கள்',
    description: 'Practice talking about your weekend, movies, hobbies, and simple day-to-day topics.',
    tamilDescription: 'வார இறுதி, திரைப்படங்கள், பொழுதுபோக்கு போன்ற அன்றாட விஷயங்களை எளிதாக பேசலாம்.',
    icon: 'Coffee',
    initialMessage: 'Hey! Let’s have a friendly casual chat. How was your day so far, and what did you have for breakfast or lunch?',
    initialTamilExplanation: 'ஹேய்! நண்பர்களோடு பேசுவது போல இயல்பாக பேசலாம். உங்கள் நாள் எப்படி போகிறது, இன்று என்ன சாப்பிட்டீர்கள்?',
    starterPrompts: [
      {
        label: 'Weekend Talk',
        tanglish: 'Last weekend naan friend kooda movie ponen, romba nalla irunthathu.',
        tamil: 'கடந்த வார இறுதியில் நான் நண்பருடன் திரைப்படம் பார்த்தேன், நன்றாக இருந்தது.',
        english: 'Last weekend I went to a movie with my friend, it was very nice.'
      },
      {
        label: 'Weather & Mood',
        tanglish: 'Today weather is very hot in Chennai, AC illama irukka mudila.',
        tamil: 'இன்று சென்னையில் வெயில் அதிகம், ஏசி இல்லாமல் இருக்க முடியவில்லை.',
        english: 'Today the weather is very hot in Chennai, cannot stay without AC.'
      },
      {
        label: 'Asking Hobby',
        tanglish: 'Free time-la ungalukku enna panna pidikkum?',
        tamil: 'ஓய்வு நேரத்தில் உங்களுக்கு என்ன செய்ய பிடிக்கும்?',
        english: 'What do you like to do in your free time?'
      }
    ]
  },
  {
    id: 'phone_call',
    title: 'Phone Calls & Enquiries',
    tamilTitle: 'தொலைபேசி அழைப்பு & விசாரிப்புகள்',
    description: 'Learn phone etiquette, booking appointments, and speaking clearly over the call.',
    tamilDescription: 'போன் பேசும்போது தடையின்றி பேசுதல், அப்பாயின்ட்மென்ட் முன்பதிவு செய்தல்.',
    icon: 'PhoneCall',
    initialMessage: 'Ring, ring! Hello, thanks for calling. How may I assist you today?',
    initialTamilExplanation: 'ரிங், ரிங்! வணக்கம், அழைத்ததற்கு நன்றி. இன்று உங்களுக்கு நான் எவ்வாறு உதவ முடியும்?',
    starterPrompts: [
      {
        label: 'Doctor Appointment',
        tanglish: 'Naan doctor kitta appointment book pannanum, timing kekkanum.',
        tamil: 'மருத்துவரிடம் அப்பாயின்ட்மென்ட் புக் செய்ய வேண்டும், நேரம் கேட்க வேண்டும்.',
        english: 'I want to book an appointment with the doctor and ask for available timings.'
      },
      {
        label: 'Connection Issue',
        tanglish: 'Sorry your voice is breaking, can you repeat once again?',
        tamil: 'மன்னிக்கவும், உங்கள் குரல் விட்டு விட்டு கேட்கிறது, மீண்டும் சொல்ல முடியுமா?',
        english: 'Sorry your voice is breaking, can you repeat once again?'
      }
    ]
  },
  {
    id: 'restaurant',
    title: 'Restaurant & Café Ordering',
    tamilTitle: 'ஹோட்டல் & உணவகம் ஆர்டர்',
    description: 'Order food, ask about menu recommendations, and pay bills politely in English.',
    tamilDescription: 'உணவு ஆர்டர் செய்தல், பரிந்துரைகள் கேட்டல் மற்றும் பில் செலுத்துதல்.',
    icon: 'Utensils',
    initialMessage: 'Good evening! Welcome to our restaurant. Here is the menu. Are you ready to order, or would you like a few more minutes?',
    initialTamilExplanation: 'வணக்கம்! எங்கள் உணவகத்திற்கு நல்வரவு. இதோ மெனு. நீங்கள் ஆர்டர் செய்ய தயாரா, அல்லது சில நிமிடங்கள் வேண்டுமா?',
    starterPrompts: [
      {
        label: 'Ask for Special',
        tanglish: 'Innaiku special dish enna irukku nu kekkanum.',
        tamil: 'இன்றைய ஸ்பெஷல் உணவு என்னவென்று கேட்க வேண்டும்.',
        english: 'What is today’s special dish?'
      },
      {
        label: 'Water & Bill',
        tanglish: 'Konjam hot water and bill kondu vara sollanum.',
        tamil: 'சூடான தண்ணீர் மற்றும் பில் கொண்டு வர சொல்ல வேண்டும்.',
        english: 'Could you please bring some warm water and the bill?'
      }
    ]
  }
];

export function getScenarioById(id: string): PracticeScenario {
  return PRACTICE_SCENARIOS.find(s => s.id === id) || PRACTICE_SCENARIOS[0];
}
