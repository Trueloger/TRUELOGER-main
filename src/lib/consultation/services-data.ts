// src/lib/consultation/services-data.ts
// The authoritative content/data registry for the "Talk to an Expert"
// paid consultation catalogue. See types.ts for the shape contract and
// pricing.ts for how a duration maps to a price — this file only holds
// the 13 services' data, nothing else may hardcode a service's price,
// icon, or copy.
//
// Pricing design (Indian market, whole-rupee, rounded to the nearest
// ₹10, every service's own 4 numbers strictly increasing with
// duration):
//
// Two tiers, matching how the site's own experts are actually staffed
// and how comparable Indian consultation-astrology platforms price:
//
// - STANDARD tier (₹399 / ₹699 / ₹999 / ₹1299 base for 15/30/45/60 min)
//   — Vedic Astrology, Tarot Reading, Numerology, Vastu, Spiritual
//   Healing, Palmistry. These are the highest-volume, broadly-staffed
//   services. Each service is offset ±10-15% off the base band rather
//   than repeating identical numbers: Vastu and Vedic Astrology (the
//   two most in-demand, longest-session services) sit a little above
//   the base; Numerology and Palmistry (typically shorter, more
//   templated readings) sit a little below; Tarot sits at the base
//   line; Spiritual Healing sits a touch above the base to reflect the
//   more personalized guided-session format.
//
// - SPECIALIST tier (₹499 / ₹899 / ₹1299 / ₹1699 base for 15/30/45/60
//   min) — Lal Kitab, KP Astrology, Nadi Astrology, Love & Relationship
//   Astrology, Career Astrology, Marriage Astrology, Prashna/Horary.
//   These require rarer expertise or denser preparation per session.
//   Nadi and KP Astrology (scarcest specialists, most preparation-heavy
//   sub-lord/palm-leaf lookup work) sit at the top of the band; Lal
//   Kitab (practical, remedy-first, meant to stay accessible) and
//   Prashna/Horary (deliberately fast, single-question format) sit
//   below the base; Career, Marriage and Love & Relationship Astrology
//   cluster close to the base line, with Marriage priced slightly above
//   Career/Love to reflect the deeper multi-chart (boy/girl) analysis
//   marriage consultations typically involve.
//
// All 24 numbers below were hand-checked to be strictly increasing
// per service and rounded to the nearest ₹10.
import type { ConsultationService } from "./types";

export const CONSULTATION_SERVICES: ConsultationService[] = [
  // ---------------------------------------------------------------
  // 1. Vedic Astrology
  // ---------------------------------------------------------------
  {
    id: "vedic-astrology",
    slug: "vedic-astrology",
    name: "Vedic Astrology",
    category: "astrology",
    subtitle: "A complete birth-chart reading for life's big questions",
    description:
      "A full Vedic (Jyotish) consultation built around your birth chart — planetary placements, houses, and running periods. Our astrologers walk through career, relationships, marriage, finances, and the major life periods ahead of you. It's the broadest, most foundational consultation on TRUELOGER and a good starting point if you're new to astrology consultations.",
    icon: "Moon",
    pricing: { 15: 429, 30: 749, 45: 1049, 60: 1349 },
    highlights: [
      "Full birth chart (Kundli) reading — planets, houses, and ascendant",
      "Career direction and professional strengths",
      "Relationship and marriage prospects",
      "Financial patterns and wealth indicators",
      "Current and upcoming dasha (planetary period) analysis",
      "General planetary influences shaping your year",
    ],
    suitableFor: [
      "Anyone getting their first proper astrology reading",
      "Those wanting a broad life overview rather than one narrow question",
      "People planning a major decision and wanting planetary context",
      "Existing clients due for a periodic chart check-in",
    ],
    topics: [
      "Career direction",
      "Marriage timing",
      "Financial outlook",
      "Health-supportive periods",
      "Dasha and transit timing",
      "General life guidance",
    ],
    faqs: [
      {
        question: "What details do I need to provide before the session?",
        answer:
          "Your exact date, time, and place of birth. Birth time accuracy matters most for house-based predictions, so use your birth certificate or hospital record if you have it.",
      },
      {
        question: "Is this the same as a Kundli report I can download?",
        answer:
          "No — this is a live, spoken consultation where an astrologer reads your chart with you and answers follow-up questions in real time, rather than a static PDF report.",
      },
      {
        question: "Can I ask about more than one topic in a single session?",
        answer:
          "Yes, this consultation is deliberately broad. A 30-45 minute session comfortably covers two or three topics such as career and marriage together.",
      },
      {
        question: "What if my birth time is unknown or approximate?",
        answer:
          "The astrologer can still work with an approximate time and rely more heavily on planetary positions and dashas, but house-specific predictions (like exact marriage timing) will be less precise.",
      },
    ],
    demoReport: {
      title: "Sample Vedic Astrology Reading",
      sampleSubject: "Sample chart for Rohan Mehta, born 14 November 1994, Jaipur",
      summary:
        "A sample walkthrough of a full birth-chart consultation, showing the kind of depth and structure a real session covers across career, relationships, and timing.",
      sections: [
        {
          heading: "Chart Overview",
          body: "Rohan's ascendant falls in Vrishabha (Taurus) with Jupiter placed in the 9th house, indicating strong support from mentors and a naturally steady, practical temperament. The Moon in the 4th house in Karka suggests deep emotional ties to home and family that influence major decisions.",
        },
        {
          heading: "Career",
          body: "The 10th lord is well-placed in conjunction with Mercury, favouring analytical or communication-heavy fields. The current Jupiter-Mercury period (running through early 2027) is a strong window for a role change or a visible promotion.",
        },
        {
          heading: "Relationships & Marriage",
          body: "Venus in the 7th house aspected by Jupiter points to a stable, well-matched partnership rather than a turbulent one. The chart suggests a favourable marriage window opening in the next major sub-period, roughly 18-30 months out.",
        },
        {
          heading: "Guidance",
          body: "This is a chart that rewards patience over impulsive moves — the next two years favour consolidating career gains before taking on new financial risk. A specific gemstone or remedy recommendation would follow only after a closer look at any afflicted planets.",
        },
      ],
    },
    seo: {
      title: "Vedic Astrology Consultation | TRUELOGER",
      description:
        "Book a live Vedic astrology consultation covering your birth chart, career, marriage, finances, and major planetary periods with an experienced astrologer.",
    },
  },

  // ---------------------------------------------------------------
  // 2. Tarot Reading
  // ---------------------------------------------------------------
  {
    id: "tarot-reading",
    slug: "tarot-reading",
    name: "Tarot Reading",
    category: "divination",
    subtitle: "Card-based guidance for love, career, and near-term decisions",
    description:
      "A focused tarot session for questions that need clarity right now — a relationship, a career fork, or a decision you're sitting on. Our readers draw and interpret a spread live with you, giving practical, near-term guidance rather than a rigid long-range prediction. Best suited to specific, current questions rather than a full life overview.",
    icon: "Sparkles",
    pricing: { 15: 399, 30: 699, 45: 999, 60: 1299 },
    highlights: [
      "Live card spread drawn and interpreted during your session",
      "Love and relationship guidance",
      "Career and decision-making clarity",
      "Short-term outlook (weeks to a few months ahead)",
      "Emotional clarity on a situation you're stuck on",
      "Follow-up questions answered with additional draws",
    ],
    suitableFor: [
      "Anyone facing a specific decision or crossroads",
      "Those wanting emotional clarity on a relationship situation",
      "People who prefer symbolic, intuitive guidance over technical charting",
      "Clients seeking quick, near-term direction rather than long-range prediction",
    ],
    topics: [
      "Love and relationships",
      "Career decisions",
      "Should I take this opportunity",
      "Emotional clarity",
      "Short-term outlook",
      "Yes/no style questions",
    ],
    faqs: [
      {
        question: "Do I need to prepare a specific question?",
        answer:
          "It helps a lot. Tarot works best on a focused question — \"should I take this job\" reads far more clearly than \"tell me about my life.\"",
      },
      {
        question: "Is tarot reading connected to my birth chart?",
        answer:
          "No, tarot is an independent card-based practice and doesn't require your birth details — only the question you want guidance on.",
      },
      {
        question: "How far into the future can a tarot reading see?",
        answer:
          "Tarot is strongest for near-term guidance, typically the next few weeks to a few months, rather than multi-year predictions.",
      },
      {
        question: "Can I get a reading for someone else, like a family member?",
        answer:
          "Yes, though the clearest readings are usually about your own situation or a decision that directly involves you.",
      },
    ],
    demoReport: {
      title: "Sample Tarot Reading",
      sampleSubject: "Sample reading for Ananya Kapoor, question: \"Should I switch jobs this year?\"",
      summary:
        "A sample three-card spread showing the tone and structure of a real tarot session — present energy, the path ahead, and closing guidance.",
      sections: [
        {
          heading: "Your Current Energy",
          body: "The Eight of Pentacles appears in the present position, reflecting steady effort and skill-building in your current role — but reversed, it hints at diminishing returns and a sense of being undervalued despite the work you're putting in.",
        },
        {
          heading: "The Path Ahead",
          body: "The Wheel of Fortune follows in the near-future position, a strong card for a genuine turning point arriving on its own timeline rather than one you need to force. Paired with the Three of Cups nearby, a new opportunity may come through a professional connection or referral.",
        },
        {
          heading: "Guidance",
          body: "The Queen of Swords closes the spread, encouraging clear-eyed, unemotional evaluation of any offer rather than deciding from frustration alone. The cards favour actively exploring options over the next two to three months rather than waiting passively.",
        },
      ],
    },
    seo: {
      title: "Tarot Reading Consultation | TRUELOGER",
      description:
        "Get a live tarot reading for love, career, or a decision you're facing, with practical near-term guidance from an experienced reader.",
    },
  },

  // ---------------------------------------------------------------
  // 3. Numerology
  // ---------------------------------------------------------------
  {
    id: "numerology",
    slug: "numerology",
    name: "Numerology",
    category: "numerology",
    subtitle: "What your name and birth-date numbers reveal about you",
    description:
      "A numerology consultation built around your date of birth and name, covering your Life Path number, name number, and the personal cycles they point to. Useful for understanding recurring life themes, career tendencies, and compatibility patterns, or for evaluating a name change (for yourself, a business, or a newborn).",
    icon: "Hash",
    pricing: { 15: 369, 30: 649, 45: 929, 60: 1199 },
    highlights: [
      "Life Path number and its core life themes",
      "Name number analysis and name-correction suggestions",
      "Personal year and cycle timing",
      "Career tendencies indicated by your numbers",
      "Relationship and compatibility themes",
      "Lucky numbers and favourable dates",
    ],
    suitableFor: [
      "Anyone curious about the numbers behind their name and birth date",
      "Those considering a name change or spelling correction",
      "New parents choosing a name for a newborn",
      "People wanting a lighter, quicker alternative to a full chart reading",
    ],
    topics: [
      "Life Path number",
      "Name number analysis",
      "Personal year cycles",
      "Career tendencies",
      "Relationship compatibility",
      "Name correction for luck",
    ],
    faqs: [
      {
        question: "What information do I need to give for a numerology reading?",
        answer:
          "Your full birth date and your full name as it appears on official documents (plus any name you commonly go by, if different).",
      },
      {
        question: "Can numerology tell me if my business name is favourable?",
        answer:
          "Yes, business and brand names can be analysed the same way as a personal name, looking at the number it reduces to and its typical associations.",
      },
      {
        question: "How is numerology different from astrology?",
        answer:
          "Numerology works purely from your name and birth date's numeric values, while astrology maps the actual positions of planets at your birth — the two are separate systems and can be used together or independently.",
      },
      {
        question: "Does changing the spelling of my name really change anything?",
        answer:
          "In numerology, a spelling change alters your name number and is a common, low-cost remedy some clients choose — the astrologer will explain the reasoning specific to your numbers before suggesting one.",
      },
    ],
    demoReport: {
      title: "Sample Numerology Reading",
      sampleSubject: "Sample reading for Priya Sharma, born 22 March 1997",
      summary:
        "A sample numerology breakdown showing the Life Path, name number, and current personal-year themes covered in a real session.",
      sections: [
        {
          heading: "Life Path Number",
          body: "Adding 22 March 1997 down to a single digit gives a Life Path Number 6 — associated with responsibility, caregiving, and a strong pull toward home and community. People with this number often find deep fulfilment in roles that let them support others directly.",
        },
        {
          heading: "Name Number",
          body: "\"Priya Sharma\" reduces to a Name Number 9, a number linked to idealism, creative expression, and working well in group or public-facing settings. This pairs constructively with a 6 Life Path, reinforcing a service-and-connection-oriented life theme.",
        },
        {
          heading: "Current Personal Year",
          body: "This year falls in a Personal Year 3 cycle — favourable for communication-heavy projects, creative pursuits, and expanding your social or professional circle. It's a better year for visibility and outreach than for quiet, behind-the-scenes work.",
        },
      ],
    },
    seo: {
      title: "Numerology Consultation | TRUELOGER",
      description:
        "Book a numerology consultation covering your Life Path number, name number, and personal cycles, with name-correction guidance where needed.",
    },
  },

  // ---------------------------------------------------------------
  // 4. Vastu
  // ---------------------------------------------------------------
  {
    id: "vastu",
    slug: "vastu",
    name: "Vastu",
    category: "vastu",
    subtitle: "Directional guidance for a more balanced home or workspace",
    description:
      "A Vastu Shastra consultation for your home or office, covering room directions, entrance placement, and space-energy considerations that traditional Vastu links to comfort, harmony, and flow. Bring a rough floor plan or photos and describe the layout — our consultant will walk through practical, non-structural adjustments where possible.",
    icon: "Compass",
    pricing: { 15: 449, 30: 769, 45: 1099, 60: 1399 },
    highlights: [
      "Room-by-room directional review (bedroom, kitchen, pooja room, study)",
      "Main entrance and doorway placement",
      "Office or workspace layout guidance",
      "Simple, mostly non-structural remedies and adjustments",
      "Colour and element balancing suggestions by direction",
      "Guidance for new construction or renovation planning",
    ],
    suitableFor: [
      "Homeowners or tenants noticing recurring discomfort in a space",
      "Anyone about to move into a new home or office",
      "Those planning renovation or new construction",
      "Business owners setting up a new office or shop",
    ],
    topics: [
      "Main entrance direction",
      "Kitchen and bedroom placement",
      "Pooja room positioning",
      "Office desk and cash-box direction",
      "Non-structural remedies",
      "New construction planning",
    ],
    faqs: [
      {
        question: "Do I need architectural drawings for this consultation?",
        answer:
          "Not necessarily — a rough hand-drawn or photo-based layout with approximate compass directions is usually enough for practical guidance.",
      },
      {
        question: "Will I be told to break walls or do major construction?",
        answer:
          "Most guidance focuses on non-structural adjustments — furniture placement, colours, and small fixes — with structural changes suggested only when there's no lighter alternative.",
      },
      {
        question: "Can Vastu be applied to a rented apartment?",
        answer:
          "Yes, most Vastu adjustments for a rented space are non-permanent — placement, colour, and décor changes rather than construction.",
      },
      {
        question: "How do I find my home's compass directions if I don't know them?",
        answer:
          "A basic smartphone compass app is usually accurate enough; the consultant can also help you orient your layout during the session if needed.",
      },
    ],
    demoReport: {
      title: "Sample Vastu Consultation",
      sampleSubject: "Sample review for the Verma family's 3BHK apartment, Pune",
      summary:
        "A sample walkthrough of the kind of room-by-room, direction-based guidance given during a real Vastu consultation.",
      sections: [
        {
          heading: "Entrance & Overall Flow",
          body: "The main entrance faces north-east, considered one of the more favourable directions in Vastu Shastra, associated with clarity and positive energy flow into the home. Keeping this entryway well-lit and clutter-free is likely to support the overall balance of the space.",
        },
        {
          heading: "Kitchen & Bedroom Placement",
          body: "The kitchen currently sits in the north-west corner rather than the traditionally preferred south-east; a simple adjustment such as repositioning the stove within the room, rather than relocating the kitchen entirely, is a practical first step. The master bedroom in the south-west is well-placed and needs no structural change.",
        },
        {
          heading: "Suggested Adjustments",
          body: "Placing a small indoor plant near the north-east corner and using lighter colour tones in the living area are recommended non-structural changes. A pooja corner, if added, would sit best in the north-east or east-facing part of the home.",
        },
      ],
    },
    seo: {
      title: "Vastu Consultation | TRUELOGER",
      description:
        "Get a practical Vastu Shastra consultation for your home or office, covering room directions, entrance placement, and simple non-structural remedies.",
    },
  },

  // ---------------------------------------------------------------
  // 5. Spiritual Healing
  // ---------------------------------------------------------------
  {
    id: "spiritual-healing",
    slug: "spiritual-healing",
    name: "Spiritual Healing",
    category: "healing",
    subtitle: "Guided sessions for emotional balance and inner clarity",
    description:
      "A gentle, guided session focused on emotional wellbeing, energy balance, and inner clarity — useful when you're feeling emotionally drained, stuck, or in need of a reset. Sessions may include guided reflection, breathwork-style relaxation techniques, and simple spiritual practices you can continue at home. This is a wellbeing and relaxation practice, not a medical or psychological treatment.",
    icon: "HeartHandshake",
    pricing: { 15: 419, 30: 729, 45: 1029, 60: 1329 },
    highlights: [
      "Guided reflection on emotional blocks or recurring stress",
      "Simple relaxation and breathing-based techniques",
      "Energy-balancing spiritual practices",
      "Guidance for building a personal daily practice",
      "Support around grief, transitions, or feeling emotionally stuck",
      "Space to process without judgment",
    ],
    suitableFor: [
      "Anyone feeling emotionally overwhelmed or drained",
      "Those going through a major life transition",
      "People wanting a calming, reflective space outside of daily routine",
      "Clients looking to build a simple ongoing spiritual practice",
    ],
    topics: [
      "Emotional overwhelm",
      "Stress and inner unrest",
      "Energy balance",
      "Building a daily practice",
      "Processing a difficult transition",
      "Relaxation techniques",
    ],
    faqs: [
      {
        question: "Is this a substitute for therapy or medical treatment?",
        answer:
          "No. This consultation offers spiritual and emotional guidance only, and is not a substitute for professional medical or psychological care — please consult a qualified professional for clinical concerns.",
      },
      {
        question: "What actually happens during a spiritual healing session?",
        answer:
          "Typically guided conversation, reflection, and simple relaxation or breathing techniques, tailored to what you're going through — there's no fixed script.",
      },
      {
        question: "Do I need any prior experience with meditation or spiritual practice?",
        answer:
          "No prior experience is needed — sessions are guided from the ground up and adapted to your comfort level.",
      },
      {
        question: "How many sessions will I need?",
        answer:
          "Many clients find a single session helpful for a specific moment of stress, while others prefer periodic sessions as part of an ongoing practice — it's entirely up to you.",
      },
    ],
    demoReport: {
      title: "Sample Spiritual Healing Session",
      sampleSubject: "Sample session summary for Neha Iyer, focus: work-related stress and burnout",
      summary:
        "A sample summary of the kind of guided, reflective content covered in a real spiritual healing session focused on emotional wellbeing.",
      sections: [
        {
          heading: "Where You Are Right Now",
          body: "Neha described persistent tension and difficulty switching off after work, with a sense of being pulled in too many directions. The session opened with a short grounding breathing exercise to settle the nervous system before moving into reflection.",
        },
        {
          heading: "What Came Up",
          body: "Through guided reflection, a recurring theme emerged around difficulty setting boundaries with work demands, tied to a deeper habit of over-committing to feel valued. Naming this pattern out loud was itself part of the release.",
        },
        {
          heading: "A Simple Practice To Continue",
          body: "A five-minute evening wind-down breathing practice was suggested, paired with a small daily boundary-setting reflection question to journal on. These are meant as gentle, sustainable additions rather than a strict regimen.",
        },
      ],
    },
    seo: {
      title: "Spiritual Healing Consultation | TRUELOGER",
      description:
        "Book a guided spiritual healing session for emotional balance, stress relief, and inner clarity, framed around wellbeing rather than medical treatment.",
    },
    extraDisclaimer:
      "This consultation offers spiritual and emotional guidance and is not a substitute for professional medical or psychological care.",
  },

  // ---------------------------------------------------------------
  // 6. Palmistry
  // ---------------------------------------------------------------
  {
    id: "palmistry",
    slug: "palmistry",
    name: "Palmistry",
    category: "divination",
    subtitle: "What the lines and mounts of your hand reveal about you",
    description:
      "A palm-reading consultation where our expert reads the major lines and mounts of your hand — life line, heart line, head line, and fate line — to discuss character traits, career tendencies, relationship patterns, and broader life themes. Works over a video call using a clear, well-lit view of your palm.",
    icon: "Hand",
    pricing: { 15: 379, 30: 669, 45: 949, 60: 1229 },
    highlights: [
      "Life line, heart line, head line, and fate line reading",
      "Character and temperament insights",
      "Career tendencies indicated by the hand",
      "Relationship and emotional patterns",
      "Mount analysis (Venus, Jupiter, Saturn, and others)",
      "Broad life-theme observations",
    ],
    suitableFor: [
      "Anyone curious what their palm reveals about their personality",
      "Those wanting a quick, visual alternative to a full chart reading",
      "People interested in career or relationship tendencies",
      "First-time consultation clients wanting something light and engaging",
    ],
    topics: [
      "Life line meaning",
      "Heart line and relationships",
      "Career indications",
      "Head line and thinking style",
      "Mount analysis",
      "General life themes",
    ],
    faqs: [
      {
        question: "How does a palm reading work over a video call?",
        answer:
          "You'll hold your palm up to the camera in good lighting while the reader guides you through a few angles — no in-person visit needed.",
      },
      {
        question: "Which hand should I show — left or right?",
        answer:
          "Most readers look at your dominant hand for present tendencies and the other hand for inherited traits, so having both available is useful though not required.",
      },
      {
        question: "Can palmistry predict exact dates for events?",
        answer:
          "Palmistry is generally better suited to character and thematic insight than precise date-based predictions — for exact timing questions, an astrology-based consultation is a better fit.",
      },
      {
        question: "Do the lines on my palm ever change?",
        answer:
          "Minor lines can shift subtly over time as life circumstances change, though the major lines (life, heart, head) tend to stay largely consistent.",
      },
    ],
    demoReport: {
      title: "Sample Palmistry Reading",
      sampleSubject: "Sample reading for Arjun Nair, right-hand dominant",
      summary:
        "A sample palm reading showing the kind of line-by-line and mount-based interpretation a real session covers.",
      sections: [
        {
          heading: "Life Line",
          body: "Arjun's life line runs deep and curves widely around the base of the thumb, generally associated with steady vitality and resilience through change. A faint break mid-line, without a gap, suggests a significant shift or transition rather than a health concern.",
        },
        {
          heading: "Heart Line & Head Line",
          body: "A long, gently curved heart line points to warmth and openness in relationships, while a straight, well-defined head line suggests a practical, logic-first decision-making style. Together they indicate someone who leads with the head but stays emotionally available.",
        },
        {
          heading: "Career Indications",
          body: "A well-marked Jupiter mount at the base of the index finger is often linked to leadership tendencies and ambition, supporting roles with visibility or people-management responsibility. A clear fate line rising from the palm's base suggests career direction that firms up with age rather than one fixed from the start.",
        },
      ],
    },
    seo: {
      title: "Palmistry Consultation | TRUELOGER",
      description:
        "Get a live palm reading covering your life, heart, and head lines plus mount analysis, for insight into character, career, and relationships.",
    },
  },

  // ---------------------------------------------------------------
  // 7. Lal Kitab
  // ---------------------------------------------------------------
  {
    id: "lal-kitab",
    slug: "lal-kitab",
    name: "Lal Kitab",
    category: "astrology",
    subtitle: "Practical, remedy-focused readings from the Lal Kitab system",
    description:
      "A consultation using the Lal Kitab system — a distinct, remedy-first branch of Vedic astrology known for its simple, low-cost remedies rather than elaborate rituals. The astrologer reviews your chart for karmic debts (rin) and planetary afflictions, then suggests practical day-to-day remedies you can start immediately.",
    icon: "BookOpenText",
    pricing: { 15: 469, 30: 849, 45: 1229, 60: 1599 },
    highlights: [
      "Lal Kitab-style chart reading distinct from standard Vedic charts",
      "Identification of karmic debts (rin) affecting your life",
      "Practical, low-cost remedies for planetary afflictions",
      "Guidance on relationships, career, and family patterns",
      "Simple daily-life adjustments rather than elaborate rituals",
      "Follow-up questions on any remedy suggested",
    ],
    suitableFor: [
      "Those wanting practical remedies rather than a purely predictive reading",
      "Clients who've tried standard astrology and want a different lens",
      "People dealing with a recurring family or financial pattern",
      "Anyone preferring simple, low-cost remedies over expensive rituals",
    ],
    topics: [
      "Karmic debts (rin)",
      "Practical remedies",
      "Recurring family patterns",
      "Career obstacles",
      "Planetary afflictions",
      "Simple daily remedies",
    ],
    faqs: [
      {
        question: "How is Lal Kitab different from standard Vedic astrology?",
        answer:
          "Lal Kitab uses its own distinct chart-reading method and is especially known for simple, practical remedies — often everyday actions or objects — rather than the more elaborate rituals sometimes prescribed in classical Vedic astrology.",
      },
      {
        question: "Are Lal Kitab remedies expensive?",
        answer:
          "No, one of the defining features of Lal Kitab is that its remedies are typically simple and low-cost — small daily actions rather than costly rituals or gemstones.",
      },
      {
        question: "What is a 'karmic debt' in Lal Kitab?",
        answer:
          "It refers to an unresolved planetary influence, often linked to family patterns, that Lal Kitab practitioners read as carrying forward and suggest specific remedies to ease.",
      },
      {
        question: "Do I need my birth chart already prepared for this?",
        answer:
          "No — just provide your accurate birth date, time, and place, and the astrologer will prepare the Lal Kitab chart during the consultation.",
      },
    ],
    demoReport: {
      title: "Sample Lal Kitab Reading",
      sampleSubject: "Sample chart for Sanjay Yadav, born 3 July 1988, Lucknow",
      summary:
        "A sample Lal Kitab consultation showing how karmic debts and practical remedies are typically discussed in a real session.",
      sections: [
        {
          heading: "Chart Reading",
          body: "Sanjay's Lal Kitab chart shows Saturn placed in a house associated with delayed but steady recognition at work — a common pattern read as long-term reward for sustained effort rather than quick wins.",
        },
        {
          heading: "Karmic Debt Indication",
          body: "A debt linked to paternal-side family relationships appears in the chart, often associated in Lal Kitab tradition with strained or distant ties to an elder that soften with conscious effort over time.",
        },
        {
          heading: "Suggested Remedies",
          body: "Simple remedies discussed include offering water to a peepal tree on Saturdays and keeping a small piece of iron in a specific direction at home — both low-cost, easy-to-sustain practices rather than elaborate rituals.",
        },
      ],
    },
    seo: {
      title: "Lal Kitab Consultation | TRUELOGER",
      description:
        "Book a Lal Kitab consultation for karmic-debt analysis and simple, practical remedies for planetary afflictions affecting your life.",
    },
  },

  // ---------------------------------------------------------------
  // 8. KP Astrology
  // ---------------------------------------------------------------
  {
    id: "kp-astrology",
    slug: "kp-astrology",
    name: "KP Astrology",
    category: "astrology",
    subtitle: "Krishnamurti Paddhati readings for precise event timing",
    description:
      "A consultation using Krishnamurti Paddhati (KP), a precision-focused branch of astrology built on sub-lord analysis. KP is especially well-suited to answering \"when\" questions — marriage timing, a career change, or an upcoming move — with more specific event-timing than broader chart readings typically offer.",
    icon: "Target",
    pricing: { 15: 549, 30: 969, 45: 1379, 60: 1799 },
    highlights: [
      "Sub-lord (KP) chart analysis for precise event timing",
      "Marriage timing questions",
      "Career-change and job-transition timing",
      "Travel and relocation timing",
      "Ruling planet analysis for the moment of consultation",
      "Confirmation or timing refinement of an existing prediction",
    ],
    suitableFor: [
      "Those with a specific \"when will this happen\" question",
      "Clients wanting more precise timing than a general reading gives",
      "People evaluating an upcoming career or relocation decision",
      "Anyone familiar with astrology wanting a more technical, sub-lord-based approach",
    ],
    topics: [
      "Marriage timing",
      "Career change timing",
      "Travel and relocation",
      "Sub-lord analysis",
      "Event confirmation",
      "Precise date windows",
    ],
    faqs: [
      {
        question: "What makes KP astrology different from standard Vedic astrology?",
        answer:
          "KP uses a distinct sub-lord system for finer-grained house and planet analysis, which is why it's particularly known for answering precise timing questions rather than only broad thematic ones.",
      },
      {
        question: "What kind of questions is KP astrology best suited for?",
        answer:
          "Specific \"when\" questions — such as when a marriage, job change, or relocation is likely to happen — are where KP's sub-lord method is most useful.",
      },
      {
        question: "Do I need any special data beyond my birth details?",
        answer:
          "Your accurate date, time, and place of birth are enough — for horary-style KP questions, the astrologer may also ask for a number you choose during the session.",
      },
      {
        question: "How precise is the timing KP astrology can give?",
        answer:
          "It typically narrows down to a specific period or window (such as a few months) rather than an exact single day, depending on the question and how clearly it's framed.",
      },
    ],
    demoReport: {
      title: "Sample KP Astrology Reading",
      sampleSubject: "Sample chart for Divya Rao, born 9 January 1993, Hyderabad — question: marriage timing",
      summary:
        "A sample KP consultation demonstrating the sub-lord-based reasoning used to narrow down an event-timing question.",
      sections: [
        {
          heading: "Sub-Lord Analysis",
          body: "The 7th house cusp sub-lord in Divya's chart connects favourably to significators of partnership and union, supporting marriage as a well-indicated event in this life period rather than a delayed or uncertain one.",
        },
        {
          heading: "Timing Window",
          body: "Cross-referencing the current planetary period with the 7th house sub-lord's connections points to a favourable window opening within the next 12-20 months, with the middle of that range showing the strongest alignment.",
        },
        {
          heading: "Guidance",
          body: "The chart supports actively engaging with proposals or introductions during the identified window rather than a passive wait-and-see approach, as the astrological support is time-bound rather than constant.",
        },
      ],
    },
    seo: {
      title: "KP Astrology Consultation | TRUELOGER",
      description:
        "Get a Krishnamurti Paddhati (KP) astrology consultation for precise event timing on marriage, career change, or relocation using sub-lord analysis.",
    },
  },

  // ---------------------------------------------------------------
  // 9. Nadi Astrology
  // ---------------------------------------------------------------
  {
    id: "nadi-astrology",
    slug: "nadi-astrology",
    name: "Nadi Astrology",
    category: "astrology",
    subtitle: "Palm-leaf-tradition readings for deeply individualized predictions",
    description:
      "A consultation drawing on the Nadi astrology tradition, historically associated with ancient palm-leaf manuscripts believed to contain individualized predictions. Our Nadi-trained astrologers use this method's distinctive, highly personalized approach to sequence major life events — a good fit for clients seeking depth over a broad general overview.",
    icon: "ScrollText",
    pricing: { 15: 569, 30: 999, 45: 1429, 60: 1849 },
    highlights: [
      "Palm-leaf-tradition predictive method",
      "Sequencing of major life events (education, career, marriage, family)",
      "Deeply individualized reading style",
      "Identification of a client's specific life-event pattern",
      "Guidance on upcoming significant life phases",
      "Remedies where the tradition indicates them",
    ],
    suitableFor: [
      "Clients seeking a highly individualized, less generic reading",
      "Those wanting a sequence of major life events rather than one topic",
      "People already familiar with astrology looking for a distinct tradition",
      "Anyone wanting a deeper, longer consultation over a quick answer",
    ],
    topics: [
      "Major life-event sequencing",
      "Education and early life",
      "Career milestones",
      "Marriage and family",
      "Individualized predictions",
      "Life-phase guidance",
    ],
    faqs: [
      {
        question: "What is Nadi astrology and how is it different?",
        answer:
          "Nadi astrology is a distinct predictive tradition historically linked to palm-leaf manuscripts, known for a highly individualized approach to sequencing a person's major life events rather than a generalized chart reading.",
      },
      {
        question: "What information will I need to provide?",
        answer:
          "Your accurate birth date, time, and place, similar to a standard astrology consultation — the Nadi method itself is what differs, not the input required.",
      },
      {
        question: "Is Nadi astrology suitable for a first-time consultation?",
        answer:
          "It works well for first-timers too, though it particularly suits those wanting deep, event-sequenced detail rather than a broad, lighter overview.",
      },
      {
        question: "Can this consultation cover multiple life areas in one session?",
        answer:
          "Yes, a core strength of this method is sequencing several major life events — education, career, marriage, family — together within a single session.",
      },
    ],
    demoReport: {
      title: "Sample Nadi Astrology Reading",
      sampleSubject: "Sample chart for Meera Pillai, born 27 August 1990, Chennai",
      summary:
        "A sample Nadi-style reading illustrating how major life events are sequenced and interpreted in a real consultation.",
      sections: [
        {
          heading: "Early Life & Education",
          body: "Meera's chart pattern points to a strong academic foundation with a notable shift or achievement around her early twenties, consistent with a period of focused, disciplined effort paying off in recognition or opportunity.",
        },
        {
          heading: "Career Sequence",
          body: "The reading indicates two distinct career phases — an initial settling-in period followed by a more defined, growth-oriented phase beginning in the mid-to-late twenties, often marked by a change of role or organisation.",
        },
        {
          heading: "Marriage & Family",
          body: "Family-related indications suggest a supportive domestic environment, with marriage timing aligning with the broader favourable period identified earlier in the reading rather than as an isolated event.",
        },
      ],
    },
    seo: {
      title: "Nadi Astrology Consultation | TRUELOGER",
      description:
        "Book a Nadi astrology consultation for a deeply individualized reading that sequences your major life events using this palm-leaf-tradition method.",
    },
  },

  // ---------------------------------------------------------------
  // 10. Love & Relationship Astrology
  // ---------------------------------------------------------------
  {
    id: "love-relationship-astrology",
    slug: "love-relationship-astrology",
    name: "Love & Relationship Astrology",
    category: "astrology",
    subtitle: "Chart-based guidance for compatibility and relationship timing",
    description:
      "A consultation focused specifically on love and relationships — compatibility between two charts, timing of when a relationship or proposal is likely, and astrological insight into recurring conflict or communication patterns with a partner. Suitable whether you're single and looking, in a new relationship, or working through friction with an existing partner.",
    icon: "Heart",
    pricing: { 15: 479, 30: 859, 45: 1249, 60: 1629 },
    highlights: [
      "Compatibility analysis between two birth charts",
      "Timing of relationship milestones and proposals",
      "Understanding a partner's temperament astrologically",
      "Insight into recurring relationship conflict patterns",
      "Guidance for single clients on favourable relationship windows",
      "Remedies for relationship-related planetary afflictions",
    ],
    suitableFor: [
      "Couples wanting compatibility insight",
      "Singles wondering about relationship timing",
      "Those navigating recurring conflict with a partner",
      "Anyone wanting to better understand a partner's temperament",
    ],
    topics: [
      "Compatibility between partners",
      "Relationship timing",
      "Understanding a partner",
      "Resolving recurring conflict",
      "Single and looking",
      "Long-distance relationship concerns",
    ],
    faqs: [
      {
        question: "Do both partners need to be present for a compatibility reading?",
        answer:
          "It isn't required, but having both partners' accurate birth details (and ideally both present) gives the most complete compatibility picture.",
      },
      {
        question: "Can this consultation help if we're going through a rough patch?",
        answer:
          "Yes, many clients book this specifically to understand the astrological patterns behind recurring friction and get practical guidance for navigating it.",
      },
      {
        question: "I'm single — can this consultation still help me?",
        answer:
          "Yes, a large part of this consultation covers relationship timing and temperament guidance for singles, not only existing-couple compatibility.",
      },
      {
        question: "Is this the same as a Kundli matching service?",
        answer:
          "It overlaps but goes further — this is a live, conversational consultation covering timing and relationship dynamics, not just a compatibility score.",
      },
    ],
    demoReport: {
      title: "Sample Love & Relationship Astrology Reading",
      sampleSubject: "Sample compatibility reading for Karan Malhotra and Ishita Bose",
      summary:
        "A sample reading showing the kind of compatibility and timing insight a real love and relationship consultation provides.",
      sections: [
        {
          heading: "Compatibility Overview",
          body: "Venus and Mars sit in mutually supportive positions across both charts, generally a favourable sign for physical and emotional chemistry. The Moon signs suggest slightly different emotional paces — one partner processing feelings more quickly than the other — which is workable with awareness rather than a mismatch.",
        },
        {
          heading: "Communication Patterns",
          body: "Mercury placements indicate that direct, scheduled conversations work better for this pairing than expecting issues to resolve organically in passing — a practical, actionable insight rather than a generic compatibility label.",
        },
        {
          heading: "Timing Guidance",
          body: "The current shared period favours deepening commitment over the next several months, with a particularly supportive window opening around the transit of Jupiter into a favourable house for both charts.",
        },
      ],
    },
    seo: {
      title: "Love & Relationship Astrology Consultation | TRUELOGER",
      description:
        "Book a love and relationship astrology consultation for compatibility analysis, relationship timing, and guidance on understanding your partner.",
    },
    extraDisclaimer:
      "This consultation offers astrological perspective on relationships and is not a substitute for professional counselling where relationship or emotional distress is significant.",
  },

  // ---------------------------------------------------------------
  // 11. Career Astrology
  // ---------------------------------------------------------------
  {
    id: "career-astrology",
    slug: "career-astrology",
    name: "Career Astrology",
    category: "astrology",
    subtitle: "Chart-based guidance for career direction and timing",
    description:
      "A consultation focused specifically on your professional life — career direction, evaluating a job change, business timing, and identifying periods favourable for growth. Especially useful if you're weighing a specific offer, considering starting a business, or feeling stuck and unsure of the right next move.",
    icon: "Briefcase",
    pricing: { 15: 499, 30: 899, 45: 1299, 60: 1699 },
    highlights: [
      "Career direction and suitable professional fields",
      "Evaluating a specific job offer or change",
      "Business and entrepreneurship timing",
      "Identifying periods favourable for growth or promotion",
      "Understanding recurring workplace obstacles",
      "Long-term career planning aligned to planetary periods",
    ],
    suitableFor: [
      "Those evaluating a job change or new offer",
      "Aspiring entrepreneurs considering business timing",
      "Professionals feeling stuck or unclear on direction",
      "Anyone wanting to time a career move to a favourable period",
    ],
    topics: [
      "Job change evaluation",
      "Business timing",
      "Career direction",
      "Promotion timing",
      "Workplace obstacles",
      "Long-term career planning",
    ],
    faqs: [
      {
        question: "Can this consultation help me decide between two job offers?",
        answer:
          "Yes, this is one of the most common reasons clients book this consultation — comparing timing and fit for two specific paths.",
      },
      {
        question: "I'm thinking of starting a business — can astrology help with timing?",
        answer:
          "Yes, business-launch timing is a core part of this consultation, looking at your chart's currently running and upcoming planetary periods.",
      },
      {
        question: "What if I don't have a specific decision, just general career confusion?",
        answer:
          "That's a common starting point too — the astrologer can identify your chart's natural professional strengths and currently favourable direction even without a specific offer on the table.",
      },
      {
        question: "Will this consultation guarantee a promotion or job offer?",
        answer:
          "No — this consultation offers astrological guidance and timing insight to inform your own decisions and effort, not a guarantee of any specific career outcome.",
      },
    ],
    demoReport: {
      title: "Sample Career Astrology Reading",
      sampleSubject: "Sample chart for Vikram Chauhan, born 5 May 1991, Delhi — question: job change evaluation",
      summary:
        "A sample career consultation showing how a specific job-change question is evaluated against a chart's current planetary period.",
      sections: [
        {
          heading: "Current Career Period",
          body: "Vikram is currently running a Mercury-Venus sub-period, generally supportive of communication, negotiation, and client-facing roles — a favourable backdrop for evaluating a move rather than staying static.",
        },
        {
          heading: "Evaluating the Offer",
          body: "The new role's higher visibility aligns with the 10th house strength currently active in his chart, suggesting this is a reasonably well-timed opportunity rather than a premature move.",
        },
        {
          heading: "Guidance",
          body: "The chart favours negotiating firmly on compensation before accepting, as the current period supports Vikram's negotiating position more than it will in the following six months. A follow-up consultation before finalising terms is a reasonable next step.",
        },
      ],
    },
    seo: {
      title: "Career Astrology Consultation | TRUELOGER",
      description:
        "Book a career astrology consultation to evaluate a job change, plan business timing, and identify periods favourable for professional growth.",
    },
    extraDisclaimer:
      "This consultation offers astrological guidance to inform your own career decisions and is not a substitute for professional financial or career counselling.",
  },

  // ---------------------------------------------------------------
  // 12. Marriage Astrology
  // ---------------------------------------------------------------
  {
    id: "marriage-astrology",
    slug: "marriage-astrology",
    name: "Marriage Astrology",
    category: "astrology",
    subtitle: "Chart-based guidance on marriage timing and marital harmony",
    description:
      "A consultation focused specifically on marriage — timing of marriage, likely characteristics of a future spouse, marital harmony in an existing or upcoming marriage, and Mangal Dosha-type considerations often raised during matchmaking. Suitable for singles being matched, couples already engaged, or those navigating friction within a marriage.",
    icon: "Users",
    pricing: { 15: 529, 30: 929, 45: 1339, 60: 1749 },
    highlights: [
      "Marriage timing analysis",
      "Likely characteristics and temperament of a future spouse",
      "Mangal Dosha and similar dosha-type considerations",
      "Marital harmony guidance for existing marriages",
      "Two-chart compatibility review for a proposed match",
      "Remedies for marriage-related planetary afflictions",
    ],
    suitableFor: [
      "Singles being matched or actively looking to marry",
      "Couples evaluating a proposed match",
      "Those navigating friction within an existing marriage",
      "Families seeking a second opinion during matchmaking",
      "Anyone concerned about a Mangal Dosha-type indication",
    ],
    topics: [
      "Marriage timing",
      "Spouse characteristics",
      "Mangal Dosha considerations",
      "Marital harmony",
      "Matchmaking second opinion",
      "Resolving marital friction",
    ],
    faqs: [
      {
        question: "What is Mangal Dosha and does it always cause problems?",
        answer:
          "Mangal Dosha refers to a specific placement of Mars in the chart that traditional astrology flags for extra attention in marriage matching — it's a factor to be read carefully alongside the rest of the chart, not an automatic red flag on its own.",
      },
      {
        question: "Can this consultation give a marriage timing window?",
        answer:
          "Yes, marriage timing is one of the most common reasons clients book this consultation, based on the currently running and upcoming planetary periods in your chart.",
      },
      {
        question: "We're already married — can this still help us?",
        answer:
          "Yes, this consultation also covers marital harmony for existing marriages, looking at current planetary influences affecting the relationship and practical guidance for navigating a difficult period.",
      },
      {
        question: "Do both people need to be present for a matchmaking consultation?",
        answer:
          "Having both sets of accurate birth details gives the fullest picture, though a consultation can still proceed with one party's chart plus the other's available details.",
      },
    ],
    demoReport: {
      title: "Sample Marriage Astrology Reading",
      sampleSubject: "Sample chart for Kavya Reddy, born 18 September 1996, Bengaluru — question: marriage timing",
      summary:
        "A sample marriage-focused consultation showing how timing and spouse-characteristic questions are addressed in a real session.",
      sections: [
        {
          heading: "Marriage Timing",
          body: "The 7th house lord in Kavya's chart is currently activated by the running planetary period, indicating marriage-related developments are astrologically supported within the next 12-18 months rather than significantly delayed.",
        },
        {
          heading: "Spouse Characteristics",
          body: "Venus placed in a communicative, socially active sign suggests a partner who is outgoing and values open conversation, likely from a professional or education-oriented background based on the 7th house's planetary influences.",
        },
        {
          heading: "Dosha Consideration",
          body: "A mild Mangal Dosha-type placement is present but is significantly eased by Jupiter's supportive aspect on the same house — a pattern the astrologer would explain is generally considered manageable rather than a serious obstacle.",
        },
      ],
    },
    seo: {
      title: "Marriage Astrology Consultation | TRUELOGER",
      description:
        "Book a marriage astrology consultation covering marriage timing, spouse characteristics, Mangal Dosha considerations, and marital harmony guidance.",
    },
    extraDisclaimer:
      "This consultation offers astrological perspective on marriage and relationships and is not a substitute for professional counselling where significant marital distress is involved.",
  },

  // ---------------------------------------------------------------
  // 13. Prashna / Horary Astrology
  // ---------------------------------------------------------------
  {
    id: "prashna-horary",
    slug: "prashna-horary",
    name: "Prashna / Horary Astrology",
    category: "divination",
    subtitle: "One focused question, answered from a chart cast for the moment you ask",
    description:
      "A fast, single-question consultation using Prashna (horary) astrology, where a chart is cast for the exact moment you ask your question rather than your birth details. It's built for one clear, specific question — not a broad life reading — and is a good fit when you need a quick, focused answer.",
    icon: "HelpCircle",
    pricing: { 15: 459, 30: 819, 45: 1179, 60: 1529 },
    highlights: [
      "Chart cast for the exact moment of your question",
      "Fast, single-question format",
      "No birth details required",
      "Clear, direct answers to specific yes/no or timing questions",
      "Suitable for urgent or time-sensitive decisions",
      "Follow-up clarification on the same question within the session",
    ],
    suitableFor: [
      "Anyone with one clear, specific question needing a quick answer",
      "Those without accurate birth-time details available",
      "People facing a time-sensitive decision",
      "Clients wanting a focused session rather than a broad reading",
    ],
    topics: [
      "Will this specific thing happen",
      "Lost item or missing person queries",
      "Urgent decision timing",
      "Yes/no clarity",
      "Quick outcome questions",
      "Time-sensitive choices",
    ],
    faqs: [
      {
        question: "Do I need my birth details for a Prashna consultation?",
        answer:
          "No — Prashna works from a chart cast for the exact moment you ask your question, not your birth details, which is what makes it fast and accessible even without accurate birth-time records.",
      },
      {
        question: "What kind of questions work best for this format?",
        answer:
          "Specific, clearly-framed questions work best — \"will I get this job\" or \"should I sign this agreement this week\" rather than an open-ended life overview.",
      },
      {
        question: "Can I ask more than one question in a session?",
        answer:
          "This format is built around one focused question for the clearest reading, though a longer session can accommodate a second closely related question if time allows.",
      },
      {
        question: "How is this different from a tarot reading?",
        answer:
          "Both are quick, question-focused formats, but Prashna is chart-based astrology cast for the moment of asking, while tarot uses card symbolism — some clients prefer one method's style over the other.",
      },
    ],
    demoReport: {
      title: "Sample Prashna / Horary Reading",
      sampleSubject: "Sample reading for Ritu Agarwal, question asked at 4:12 PM, 2 September 2025, Mumbai",
      summary:
        "A sample horary consultation showing how a chart cast for the moment of the question is used to answer it directly.",
      sections: [
        {
          heading: "The Question",
          body: "Ritu asked whether a pending property deal would be finalised within the month. The chart was cast for the exact moment the question was asked, using the ascendant at that moment as the reading's starting point.",
        },
        {
          heading: "Chart Reading",
          body: "The ascendant lord forms a direct, unobstructed connection to the house governing agreements and transactions, generally read in Prashna as a favourable sign for the matter proceeding without major hurdles.",
        },
        {
          heading: "Direct Answer",
          body: "Based on this connection, the reading favours the deal moving forward within the asked timeframe, though a minor delaying influence suggests it may finalise closer to the end of the month rather than the start.",
        },
      ],
    },
    seo: {
      title: "Prashna / Horary Astrology Consultation | TRUELOGER",
      description:
        "Get a fast, focused Prashna (horary) astrology consultation that answers one specific question using a chart cast for the moment you ask.",
    },
  },
];

export function getServiceById(id: string): ConsultationService | undefined {
  return CONSULTATION_SERVICES.find((service) => service.id === id);
}

export function getAllServiceSlugs(): string[] {
  return CONSULTATION_SERVICES.map((service) => service.slug);
}
