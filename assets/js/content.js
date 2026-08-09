/* =========================================================================
   HOUSE OF GUIDANCE — EDITABLE CONTENT
   -------------------------------------------------------------------------
   This is the ONLY file you should need to open to update the site.
   Change the text between the quotes " " and save. No coding needed.
   When you're done, commit + push to GitHub — Netlify updates automatically.
   ========================================================================= */

const SITE_CONTENT = {

  siteName: "House of Guidance",
  tagline: "Seeking Knowledge. Growing in Faith. Living with Guidance.",
  heroDescription: "House of Guidance offers structured Qur'an, Arabic, Tajweed, Hifzh, Yassarna, and Islamic education for our community.",

  // ---------------------------------------------------------------------
  // MEDIA — nothing here is invented. Every path below is a placeholder.
  // Upload your own file to the /assets/media folder with this exact
  // name (or change the name here to match your file). Until you upload
  // it, the site shows a clean text-only fallback instead of a broken
  // image or a stock photo.
  // ---------------------------------------------------------------------
  media: {
    logo: "assets/media/logo.png",              // square, transparent background recommended
    heroImage: "assets/media/hero.jpg",          // wide landscape photo for the top banner
    heroVideo: "",                               // optional — leave blank unless you have one, e.g. "assets/media/hero.mp4"
    ogImage: "assets/media/og-share.jpg"         // shown when the site is shared on WhatsApp/Facebook
  },

  // Gallery images — add one line per photo. Nothing shows until you add real files.
  // path: file you upload to assets/media/gallery/
  // caption: what it's a photo of
  gallery: [
    // { path: "assets/media/gallery/class-1.jpg", caption: "Yassarna class in session" },
    // Uncomment and edit lines like the one above once you have real photos.
  ],

  // Khutbahs — add one entry per recording. audio must point to a real file you upload,
  // e.g. assets/media/khutbahs/2026-01-10-patience.mp3
  khutbahs: [
    // { title: "On Patience", speaker: "Sheikh ...", date: "2026-01-10", audio: "assets/media/khutbahs/....mp3" }
  ],

  // Upcoming events — only add real, confirmed events. Leave the array empty
  // and the Events section will simply say "No events scheduled" rather than
  // showing a made-up one.
  events: [
    // { title: "Grand Islamic Seminar", date: "2026-09-12", description: "...", registerHref: "portal.html" }
  ],

  // The bright banner near the top of the homepage.
  announcement: {
    show: true,
    label: "Ongoing Free Lessons",
    title: "Free Yassarna Lessons Are Ongoing!",
    text: "We are actively running free introductory Arabic recitation classes. Tap Register above to join.",
    linkText: "Register now",
    linkHref: "portal.html"
  },

  // Used to calculate real, accurate prayer times automatically.
  // If a visitor allows location access, we use their exact position.
  // Otherwise we fall back to the city below.
  location: {
    city: "Kampala",
    country: "Uganda",
    lat: 0.3476,
    lng: 32.5825,
    // 3 = Muslim World League. Full list: aladhan.com/calculation-methods-api
    calculationMethod: 3
  },

  // Rotates automatically, one per day, based on today's date —
  // add as many as you like, no need to change any code.
  dailyMotivations: [
    {
      tag: "Niyyah",
      title: "Renew Your Intentions",
      text: "Every action is judged by its intention. Before studying or teaching, dedicate your efforts purely for the sake of Allah."
    },
    {
      tag: "Sabr",
      title: "Patience Opens Doors",
      text: "Allah is with those who are patient. Difficulty in learning is part of the reward, not a sign to stop."
    },
    {
      tag: "Ilm",
      title: "Seek Knowledge, Always",
      text: "The Prophet ﷺ taught that seeking knowledge is a duty upon every Muslim, man and woman, from the cradle to the grave."
    },
    {
      tag: "Ihsan",
      title: "Excellence in Worship",
      text: "Worship Allah as though you see Him, for if you do not see Him, He surely sees you."
    },
    {
      tag: "Shukr",
      title: "Gratitude Multiplies Blessing",
      text: "If you are grateful, I will surely increase you in favor. Begin and end each day by counting what you've been given."
    },
    {
      tag: "Tawakkul",
      title: "Trust the Plan",
      text: "Tie your camel, then trust in Allah. Effort and reliance on Allah walk together, never one without the other."
    }
  ],

  // Dhikr counter options — Arabic, transliteration, and meaning.
  // Add or edit freely; each becomes an option in the counter's dropdown.
  dhikrOptions: [
    { arabic: "سُبْحَانَ اللَّهِ", transliteration: "SubhanAllah", meaning: "Glory be to Allah" },
    { arabic: "الْحَمْدُ لِلَّهِ", transliteration: "Alhamdulillah", meaning: "All praise is due to Allah" },
    { arabic: "اللَّهُ أَكْبَرُ", transliteration: "Allahu Akbar", meaning: "Allah is the Greatest" },
    { arabic: "لَا إِلَٰهَ إِلَّا اللَّهُ", transliteration: "La ilaha illallah", meaning: "There is no god but Allah" },
    { arabic: "أَسْتَغْفِرُ اللَّهَ", transliteration: "Astaghfirullah", meaning: "I seek forgiveness from Allah" },
    { arabic: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ", transliteration: "La hawla wala quwwata illa billah", meaning: "There is no power nor strength except with Allah" }
  ],

  // Halal Quiz — plain, well-known basics. Add more in the same shape.
  // correctIndex is 0-based (0 = first option).
  quizQuestions: [
    { question: "How many pillars of Islam are there?", options: ["3", "4", "5", "6"], correctIndex: 2 },
    { question: "How many times a day do Muslims pray?", options: ["3", "4", "5", "7"], correctIndex: 2 },
    { question: "What is the holy book of Islam called?", options: ["The Torah", "The Qur'an", "The Gospel", "The Psalms"], correctIndex: 1 },
    { question: "In which month do Muslims fast?", options: ["Shawwal", "Rajab", "Ramadan", "Muharram"], correctIndex: 2 },
    { question: "What is the pilgrimage to Makkah called?", options: ["Umrah", "Hajj", "Ziyarah", "Safar"], correctIndex: 1 },
    { question: "What is the declaration of faith called?", options: ["Shahada", "Zakat", "Sawm", "Wudu"], correctIndex: 0 },
    { question: "Which direction do Muslims face in prayer?", options: ["East", "Towards Madinah", "Towards the Kaaba (Qibla)", "North"], correctIndex: 2 },
    { question: "What is obligatory charity in Islam called?", options: ["Sadaqah", "Zakat", "Waqf", "Nafaqah"], correctIndex: 1 },
    { question: "How many surahs (chapters) are in the Qur'an?", options: ["99", "100", "114", "120"], correctIndex: 2 },
    { question: "What is the first surah of the Qur'an called?", options: ["Al-Baqarah", "Al-Fatiha", "Al-Ikhlas", "Yasin"], correctIndex: 1 }
  ],

  // Sakinah (tranquility) breathing pattern — seconds per phase.
  breathingPattern: { inhale: 4, hold: 2, exhale: 4, cycles: 6 },

  // Verses of comfort — real Qur'an references (surah:ayah), fetched live
  // from api.alquran.cloud so the Arabic/translation are never invented.
  // "note" is just a short plain-language reason it's included here.
  comfortVerses: [
    { ref: "13:28", note: "On remembrance of Allah and inner rest" },
    { ref: "94:5", note: "On hardship being followed by ease" },
    { ref: "94:6", note: "On hardship being followed by ease" },
    { ref: "2:286", note: "On Allah not burdening a soul beyond its ability" },
    { ref: "65:3", note: "On placing reliance in Allah" },
    { ref: "3:139", note: "Against grief and weakness of heart" },
    { ref: "39:53", note: "Against despair of Allah's mercy" }
  ],


  fallbackAyah: {
    arabic: "وَقُل رَّبِّ زِدْنِي عِلْمًا",
    translation: "And say: My Lord, increase me in knowledge.",
    reference: "Surah Ta-Ha, 20:114"
  },

  // Programs offered — safe to edit freely, this is just descriptive text.
  programs: [
    { icon: "📖", title: "Qur'an Learning", text: "Structured Qur'an reading and improvement at every level." },
    { icon: "🌱", title: "Yassarna", text: "Beginner-friendly Qur'an and Arabic reading lessons." },
    { icon: "🎙️", title: "Tajweed", text: "Learn correct pronunciation and recitation rules." },
    { icon: "🕋", title: "Hifzh", text: "Structured, supported Qur'an memorization." },
    { icon: "🗣️", title: "Arabic", text: "Arabic language learning for Islamic studies." },
    { icon: "🕌", title: "Islamic Studies", text: "Foundational Islamic knowledge and Dawah education." }
  ],

  // ---------------------------------------------------------------------
  // DOCUMENTS — syllabus sheets, registration forms, etc. Point each to a
  // real PDF you upload to assets/media/documents/. Leave blank ("") to
  // hide the download link instead of linking to a file that doesn't exist.
  // ---------------------------------------------------------------------
  documents: {
    registrationFormPdf: "",   // e.g. "assets/media/documents/registration-form.pdf"
    programSyllabusPdf: ""     // e.g. "assets/media/documents/syllabus.pdf"
  },

  // Real account links only. Until you fill these in with your actual
  // WhatsApp number / TikTok handle, the buttons are disabled rather than
  // pointing at the generic wa.me / tiktok.com homepages.
  social: {
    whatsapp: "https://wa.me/256751703270",
    tiktok: "https://tiktok.com/@houseofguidance.ug"
  },

  nav: [
    { label: "Home", href: "index.html" },
    { label: "Registration", href: "portal.html" },
    { label: "Gallery", href: "gallery.html" },
    { label: "Khutbahs", href: "khutbahs.html" }
  ],

  // Where the Noor chat widget sends messages — your existing Netlify function.
  chatEndpoint: "/.netlify/functions/noor-gemini"
};
