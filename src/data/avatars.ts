// Section 3.4: Avatar SVGs (inline, stored as strings)
// Illustrated anime characters for each archetype with expressive eyes, layered hair, and distinct styling.

export const ARCHETYPE_AVATARS: Record<string, string> = {
  // 1. AN - The Analyst: Intellectual anime character with sleek dark-blue hair, stylish glasses, deep sapphire eyes, and tech turtleneck
  AN: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" role="img" aria-label="The Analyst anime avatar">
  <defs>
    <radialGradient id="an_bg" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#090d16"/>
    </radialGradient>
    <linearGradient id="an_hair" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3b82f6"/>
      <stop offset="50%" stop-color="#1d4ed8"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <linearGradient id="an_skin" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffedd5"/>
      <stop offset="100%" stop-color="#fed7aa"/>
    </linearGradient>
    <linearGradient id="an_eye" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#60a5fa"/>
      <stop offset="100%" stop-color="#1e3a8a"/>
    </linearGradient>
  </defs>
  <!-- Background -->
  <circle cx="60" cy="60" r="58" fill="url(#an_bg)" stroke="#2563eb" stroke-width="2"/>
  <circle cx="60" cy="60" r="52" fill="none" stroke="#1e3a8a" stroke-width="1" stroke-dasharray="3 3"/>
  <!-- Floating data nodes -->
  <circle cx="24" cy="32" r="2.5" fill="#60a5fa" opacity="0.6"/>
  <circle cx="96" cy="36" r="2" fill="#38bdf8" opacity="0.7"/>
  <path d="M24 32 L34 42" stroke="#3b82f6" stroke-width="0.8" opacity="0.4"/>
  <!-- Back Hair -->
  <path d="M34 50 C26 62 28 85 36 94 C40 86 42 70 42 60 Z" fill="#0f172a"/>
  <path d="M86 50 C94 62 92 85 84 94 C80 86 78 70 78 60 Z" fill="#0f172a"/>
  <!-- Clothes / Turtleneck & Coat -->
  <path d="M26 112 C26 95 40 88 60 88 C80 88 94 95 94 112 Z" fill="#1e293b"/>
  <path d="M42 88 L60 102 L78 88 L72 82 L48 82 Z" fill="#0f172a"/>
  <path d="M50 82 L70 82 L68 94 L52 94 Z" fill="#0284c7" opacity="0.8"/>
  <!-- Neck & Shadow -->
  <polygon points="52,72 68,72 66,85 54,85" fill="#fbcfe8" opacity="0.3"/>
  <polygon points="53,70 67,70 65,84 55,84" fill="#fed7aa"/>
  <path d="M54 70 C60 76 66 76 66 70 Z" fill="#fdba74" opacity="0.6"/>
  <!-- Face -->
  <path d="M38 48 C38 68 48 80 60 80 C72 80 82 68 82 48 C82 36 72 32 60 32 C48 32 38 36 38 48 Z" fill="url(#an_skin)"/>
  <!-- Ears -->
  <path d="M36 52 C34 52 33 58 37 62" fill="#fed7aa"/>
  <path d="M84 52 C86 52 87 58 83 62" fill="#fed7aa"/>
  <!-- Anime Eyes -->
  <!-- Left Eye -->
  <ellipse cx="49" cy="54" rx="5.5" ry="7" fill="#0f172a"/>
  <ellipse cx="49" cy="55" rx="4.5" ry="6" fill="url(#an_eye)"/>
  <ellipse cx="49" cy="56" rx="2.5" ry="3.5" fill="#020617"/>
  <circle cx="47.5" cy="52.5" r="1.8" fill="#ffffff"/>
  <circle cx="50.5" cy="56.5" r="0.9" fill="#ffffff"/>
  <path d="M43 49 C46 46 53 46 56 48" stroke="#1e293b" stroke-width="1.8" stroke-linecap="round" fill="none"/>
  <!-- Right Eye -->
  <ellipse cx="71" cy="54" rx="5.5" ry="7" fill="#0f172a"/>
  <ellipse cx="71" cy="55" rx="4.5" ry="6" fill="url(#an_eye)"/>
  <ellipse cx="71" cy="56" rx="2.5" ry="3.5" fill="#020617"/>
  <circle cx="69.5" cy="52.5" r="1.8" fill="#ffffff"/>
  <circle cx="72.5" cy="56.5" r="0.9" fill="#ffffff"/>
  <path d="M64 48 C67 46 74 46 77 49" stroke="#1e293b" stroke-width="1.8" stroke-linecap="round" fill="none"/>
  <!-- Nose & Mouth -->
  <path d="M60 60 L59 63" stroke="#f97316" stroke-width="1" stroke-linecap="round"/>
  <path d="M56 68 C58 70 62 70 64 68" stroke="#b91c1c" stroke-width="1.2" stroke-linecap="round" fill="none"/>
  <!-- Eyeglasses -->
  <rect x="42" y="47" width="14" height="13" rx="3" fill="none" stroke="#93c5fd" stroke-width="1.4"/>
  <rect x="64" y="47" width="14" height="13" rx="3" fill="none" stroke="#93c5fd" stroke-width="1.4"/>
  <path d="M56 53 L64 53" stroke="#93c5fd" stroke-width="1.4"/>
  <path d="M38 52 L42 52 M78 52 L82 52" stroke="#93c5fd" stroke-width="1.2"/>
  <path d="M44 49 L50 49" stroke="#ffffff" stroke-width="1" opacity="0.7"/>
  <!-- Front Hair & Bangs -->
  <path d="M36 44 C40 30 52 24 60 24 C70 24 82 30 84 44 C84 44 80 40 76 40 C72 40 68 45 66 48 C64 42 60 40 56 40 C52 40 46 46 44 48 C42 44 38 44 36 44 Z" fill="url(#an_hair)"/>
  <path d="M52 26 C56 36 50 46 48 52 C52 46 58 46 62 52 C63 46 68 42 72 44 C68 34 60 28 52 26 Z" fill="url(#an_hair)"/>
  <path d="M42 34 C50 31 70 31 78 34" stroke="#93c5fd" stroke-width="1.4" stroke-linecap="round" fill="none" opacity="0.6"/>
</svg>`,

  // 2. ST - The Strategist: Commanding anime leader with regal purple/violet swept hair, sharp piercing eyes, and high-collar commander jacket
  ST: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" role="img" aria-label="The Strategist anime avatar">
  <defs>
    <radialGradient id="st_bg" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#311042"/>
      <stop offset="100%" stop-color="#0b0414"/>
    </radialGradient>
    <linearGradient id="st_hair" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#a855f7"/>
      <stop offset="60%" stop-color="#6b21a8"/>
      <stop offset="100%" stop-color="#3b0764"/>
    </linearGradient>
    <linearGradient id="st_skin" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fff1f2"/>
      <stop offset="100%" stop-color="#fecdd3"/>
    </linearGradient>
    <linearGradient id="st_eye" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#c084fc"/>
      <stop offset="100%" stop-color="#581c87"/>
    </linearGradient>
  </defs>
  <!-- Background -->
  <circle cx="60" cy="60" r="58" fill="url(#st_bg)" stroke="#9333ea" stroke-width="2"/>
  <polygon points="60,10 63,16 69,17 65,22 66,28 60,25 54,28 55,22 51,17 57,16" fill="#facc15" opacity="0.8"/>
  <!-- Back Hair -->
  <path d="M30 46 C22 60 24 88 34 100 C38 88 40 70 42 58 Z" fill="#3b0764"/>
  <path d="M90 46 C98 60 96 88 86 100 C82 88 80 70 78 58 Z" fill="#3b0764"/>
  <!-- High Collar Outfit -->
  <path d="M24 112 C24 94 38 86 60 86 C82 86 96 94 96 112 Z" fill="#1e1b4b"/>
  <path d="M40 86 L48 68 L60 84 L72 68 L80 86 Z" fill="#4338ca"/>
  <path d="M48 68 L60 84 L72 68" stroke="#facc15" stroke-width="1.5" fill="none"/>
  <!-- Neck -->
  <polygon points="53,68 67,68 65,82 55,82" fill="#fecdd3"/>
  <path d="M54 68 C60 74 66 74 66 68 Z" fill="#fb7185" opacity="0.4"/>
  <!-- Face -->
  <path d="M38 46 C38 66 48 78 60 78 C72 78 82 66 82 46 C82 34 72 30 60 30 C48 30 38 34 38 46 Z" fill="url(#st_skin)"/>
  <!-- Ears -->
  <path d="M36 50 C34 50 33 56 37 60" fill="#fecdd3"/>
  <path d="M84 50 C86 50 87 56 83 60" fill="#fecdd3"/>
  <!-- Eyes -->
  <ellipse cx="49" cy="52" rx="5.5" ry="6.5" fill="#1e1b4b"/>
  <ellipse cx="49" cy="53" rx="4.5" ry="5.5" fill="url(#st_eye)"/>
  <circle cx="49" cy="54" r="2.2" fill="#090514"/>
  <circle cx="47.5" cy="50.5" r="1.8" fill="#ffffff"/>
  <circle cx="50.5" cy="54.5" r="0.8" fill="#ffffff"/>
  <path d="M42 47 C45 44 53 45 56 47" stroke="#1e1b4b" stroke-width="2" stroke-linecap="round" fill="none"/>
  <ellipse cx="71" cy="52" rx="5.5" ry="6.5" fill="#1e1b4b"/>
  <ellipse cx="71" cy="53" rx="4.5" ry="5.5" fill="url(#st_eye)"/>
  <circle cx="71" cy="54" r="2.2" fill="#090514"/>
  <circle cx="69.5" cy="50.5" r="1.8" fill="#ffffff"/>
  <circle cx="72.5" cy="54.5" r="0.8" fill="#ffffff"/>
  <path d="M64 47 C67 45 75 44 78 47" stroke="#1e1b4b" stroke-width="2" stroke-linecap="round" fill="none"/>
  <!-- Nose & Confident Smirk -->
  <path d="M60 58 L59 61" stroke="#e11d48" stroke-width="1" stroke-linecap="round"/>
  <path d="M57 66 C60 68 64 67 66 65" stroke="#9f1239" stroke-width="1.5" stroke-linecap="round" fill="none"/>
  <!-- Front Swept Hair -->
  <path d="M34 40 C38 24 54 20 66 22 C78 24 86 32 86 44 C82 38 78 36 74 38 C70 40 68 46 64 50 C60 42 54 38 48 40 C42 42 38 48 34 40 Z" fill="url(#st_hair)"/>
  <path d="M44 26 C54 28 64 34 68 44 C66 38 60 36 56 36 C50 36 44 42 42 46 C40 38 42 30 44 26 Z" fill="#c084fc" opacity="0.6"/>
  <path d="M68 24 C76 30 82 38 84 48 C82 44 78 42 74 44 Z" fill="url(#st_hair)"/>
</svg>`,

  // 3. BU - The Builder: Dynamic anime engineer/creator with spiky copper hair, tech headset, warm amber eyes, and hoodie
  BU: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" role="img" aria-label="The Builder anime avatar">
  <defs>
    <radialGradient id="bu_bg" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#431407"/>
      <stop offset="100%" stop-color="#0c0a09"/>
    </radialGradient>
    <linearGradient id="bu_hair" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f97316"/>
      <stop offset="50%" stop-color="#ea580c"/>
      <stop offset="100%" stop-color="#7c2d12"/>
    </linearGradient>
    <linearGradient id="bu_skin" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fff7ed"/>
      <stop offset="100%" stop-color="#fed7aa"/>
    </linearGradient>
    <linearGradient id="bu_eye" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="#b45309"/>
    </linearGradient>
  </defs>
  <!-- Background -->
  <circle cx="60" cy="60" r="58" fill="url(#bu_bg)" stroke="#ea580c" stroke-width="2"/>
  <!-- Sparks & Gear Accent -->
  <circle cx="92" cy="28" r="6" fill="none" stroke="#f97316" stroke-width="1.5" stroke-dasharray="2 2"/>
  <circle cx="92" cy="28" r="2" fill="#fdba74"/>
  <circle cx="28" cy="30" r="1.5" fill="#fbbf24"/>
  <!-- Spiky Back Hair -->
  <path d="M26 42 L20 48 L28 54 L18 64 L30 68 L26 78 L38 82" fill="#7c2d12"/>
  <path d="M94 42 L100 48 L92 54 L102 64 L90 68 L94 78 L82 82" fill="#7c2d12"/>
  <path d="M38 24 L42 16 L50 22 L58 14 L66 22 L76 16 L80 24" fill="url(#bu_hair)"/>
  <!-- Modern Hoodie & Tech Collar -->
  <path d="M22 112 C22 94 36 86 60 86 C84 86 98 94 98 112 Z" fill="#1c1917"/>
  <path d="M38 86 C44 94 54 98 60 98 C66 98 76 94 82 86 Z" fill="#ea580c"/>
  <path d="M50 98 L50 112 M70 98 L70 112" stroke="#fdba74" stroke-width="1.5"/>
  <!-- Headset around neck -->
  <path d="M32 74 C32 86 44 92 60 92 C76 92 88 86 88 74" stroke="#44403c" stroke-width="5" stroke-linecap="round" fill="none"/>
  <rect x="28" y="70" width="8" height="14" rx="3" fill="#ea580c"/>
  <rect x="84" y="70" width="8" height="14" rx="3" fill="#ea580c"/>
  <circle cx="32" cy="77" r="2" fill="#22c55e"/>
  <!-- Neck -->
  <polygon points="53,68 67,68 65,82 55,82" fill="#fed7aa"/>
  <path d="M54 68 C60 74 66 74 66 68 Z" fill="#fb923c" opacity="0.4"/>
  <!-- Face -->
  <path d="M38 46 C38 66 48 78 60 78 C72 78 82 66 82 46 C82 34 72 30 60 30 C48 30 38 34 38 46 Z" fill="url(#bu_skin)"/>
  <!-- Cheeks Blush -->
  <ellipse cx="44" cy="62" rx="3" ry="1.5" fill="#f87171" opacity="0.4"/>
  <ellipse cx="76" cy="62" rx="3" ry="1.5" fill="#f87171" opacity="0.4"/>
  <!-- Eyes -->
  <ellipse cx="49" cy="52" rx="6" ry="7" fill="#1c1917"/>
  <ellipse cx="49" cy="53" rx="5" ry="6" fill="url(#bu_eye)"/>
  <circle cx="49" cy="54" r="2.5" fill="#451a03"/>
  <circle cx="47" cy="50" r="2" fill="#ffffff"/>
  <circle cx="51" cy="55" r="1" fill="#ffffff"/>
  <path d="M42 46 C46 43 53 43 57 46" stroke="#451a03" stroke-width="2" stroke-linecap="round" fill="none"/>
  <ellipse cx="71" cy="52" rx="6" ry="7" fill="#1c1917"/>
  <ellipse cx="71" cy="53" rx="5" ry="6" fill="url(#bu_eye)"/>
  <circle cx="71" cy="54" r="2.5" fill="#451a03"/>
  <circle cx="69" cy="50" r="2" fill="#ffffff"/>
  <circle cx="73" cy="55" r="1" fill="#ffffff"/>
  <path d="M63 46 C67 43 74 43 78 46" stroke="#451a03" stroke-width="2" stroke-linecap="round" fill="none"/>
  <!-- Nose & Smile -->
  <path d="M60 58 L59 61" stroke="#ea580c" stroke-width="1" stroke-linecap="round"/>
  <path d="M56 66 C58 69 62 69 64 66" stroke="#991b1b" stroke-width="1.5" stroke-linecap="round" fill="none"/>
  <!-- Spiky Bangs / Front Hair -->
  <path d="M34 44 C38 30 50 24 60 24 C72 24 84 30 86 44 C82 40 76 44 72 40 C68 36 64 48 60 52 C58 44 54 38 48 42 C44 46 38 40 34 44 Z" fill="url(#bu_hair)"/>
  <path d="M46 26 L52 38 L58 32 L64 42 L72 32" stroke="#fed7aa" stroke-width="1.5" fill="none" opacity="0.6"/>
</svg>`,

  // 4. PE - The Persuader: Vibrant anime character with ruby/rose highlights, charming wink/smile, and trendy jacket
  PE: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" role="img" aria-label="The Persuader anime avatar">
  <defs>
    <radialGradient id="pe_bg" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#4a044e"/>
      <stop offset="100%" stop-color="#0f051d"/>
    </radialGradient>
    <linearGradient id="pe_hair" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ec4899"/>
      <stop offset="50%" stop-color="#db2777"/>
      <stop offset="100%" stop-color="#831843"/>
    </linearGradient>
    <linearGradient id="pe_skin" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fff1f2"/>
      <stop offset="100%" stop-color="#fecdd3"/>
    </linearGradient>
    <linearGradient id="pe_eye" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#f43f5e"/>
      <stop offset="100%" stop-color="#881337"/>
    </linearGradient>
  </defs>
  <!-- Background -->
  <circle cx="60" cy="60" r="58" fill="url(#pe_bg)" stroke="#ec4899" stroke-width="2"/>
  <!-- Sparkles -->
  <path d="M96 26 L98 32 L104 34 L98 36 L96 42 L94 36 L88 34 L94 32 Z" fill="#fb7185"/>
  <path d="M22 36 L23 40 L27 41 L23 42 L22 46 L21 42 L17 41 L21 40 Z" fill="#f472b6" opacity="0.8"/>
  <!-- Back Flowing Hair -->
  <path d="M28 44 C20 62 20 90 32 104 C36 90 38 72 40 58 Z" fill="#831843"/>
  <path d="M92 44 C100 62 100 90 88 104 C84 90 82 72 80 58 Z" fill="#831843"/>
  <!-- Chic Streetwear Jacket -->
  <path d="M24 112 C24 94 38 86 60 86 C82 86 96 94 96 112 Z" fill="#3b0764"/>
  <path d="M44 86 L60 102 L76 86 Z" fill="#f43f5e"/>
  <circle cx="48" cy="98" r="2.5" fill="#fde047"/>
  <!-- Neck -->
  <polygon points="53,68 67,68 65,82 55,82" fill="#fecdd3"/>
  <path d="M54 68 C60 74 66 74 66 68 Z" fill="#f43f5e" opacity="0.3"/>
  <!-- Face -->
  <path d="M38 46 C38 66 48 78 60 78 C72 78 82 66 82 46 C82 34 72 30 60 30 C48 30 38 34 38 46 Z" fill="url(#pe_skin)"/>
  <ellipse cx="44" cy="62" rx="3.5" ry="2" fill="#fb7185" opacity="0.5"/>
  <ellipse cx="76" cy="62" rx="3.5" ry="2" fill="#fb7185" opacity="0.5"/>
  <!-- Left Eye: Big Sparkly Eye -->
  <ellipse cx="49" cy="52" rx="5.5" ry="6.5" fill="#4c0519"/>
  <ellipse cx="49" cy="53" rx="4.5" ry="5.5" fill="url(#pe_eye)"/>
  <circle cx="49" cy="54" r="2" fill="#1f020a"/>
  <circle cx="47" cy="50.5" r="1.8" fill="#ffffff"/>
  <circle cx="51" cy="54.5" r="0.9" fill="#ffffff"/>
  <path d="M42 47 C45 44 53 44 57 47" stroke="#4c0519" stroke-width="2" stroke-linecap="round" fill="none"/>
  <!-- Right Eye: Playful Anime Wink -->
  <path d="M65 54 C68 49 74 49 77 54" stroke="#4c0519" stroke-width="2.2" stroke-linecap="round" fill="none"/>
  <path d="M63 47 C67 44 74 44 78 47" stroke="#4c0519" stroke-width="1.8" stroke-linecap="round" fill="none"/>
  <!-- Nose & Charming Smile -->
  <path d="M60 58 L59 61" stroke="#e11d48" stroke-width="1" stroke-linecap="round"/>
  <path d="M55 65 C58 70 63 70 66 66" stroke="#9f1239" stroke-width="1.6" stroke-linecap="round" fill="none"/>
  <!-- Layered Bangs & Hair Ribbon -->
  <path d="M34 42 C38 28 50 22 60 22 C72 22 84 28 86 42 C80 36 74 44 68 38 C64 48 58 42 54 46 C48 38 42 44 34 42 Z" fill="url(#pe_hair)"/>
  <path d="M44 26 C52 30 68 30 76 26" stroke="#fbcfe8" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.6"/>
</svg>`,

  // 5. CO - The Connector: Warm, empathetic anime character with soft wavy mint/emerald hair, gentle jade eyes, and modern collar
  CO: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" role="img" aria-label="The Connector anime avatar">
  <defs>
    <radialGradient id="co_bg" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#064e3b"/>
      <stop offset="100%" stop-color="#021f17"/>
    </radialGradient>
    <linearGradient id="co_hair" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981"/>
      <stop offset="50%" stop-color="#059669"/>
      <stop offset="100%" stop-color="#064e3b"/>
    </linearGradient>
    <linearGradient id="co_skin" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#f0fdf4"/>
      <stop offset="100%" stop-color="#dcfce7"/>
    </linearGradient>
    <linearGradient id="co_eye" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#34d399"/>
      <stop offset="100%" stop-color="#047857"/>
    </linearGradient>
  </defs>
  <!-- Background -->
  <circle cx="60" cy="60" r="58" fill="url(#co_bg)" stroke="#10b981" stroke-width="2"/>
  <!-- Connecting network rings -->
  <circle cx="28" cy="34" r="3" fill="none" stroke="#6ee7b7" stroke-width="1.2"/>
  <circle cx="92" cy="32" r="3" fill="none" stroke="#6ee7b7" stroke-width="1.2"/>
  <path d="M28 37 C40 48 80 48 92 35" stroke="#34d399" stroke-width="0.8" stroke-dasharray="2 2" fill="none" opacity="0.4"/>
  <!-- Back Hair -->
  <path d="M30 46 C24 64 26 88 36 98 C40 86 40 70 42 58 Z" fill="#064e3b"/>
  <path d="M90 46 C96 64 94 88 84 98 C80 86 80 70 78 58 Z" fill="#064e3b"/>
  <!-- Clothes / Casual Blazer -->
  <path d="M24 112 C24 94 38 86 60 86 C82 86 96 94 96 112 Z" fill="#065f46"/>
  <path d="M46 86 L60 100 L74 86 Z" fill="#ecfdf5"/>
  <!-- Neck -->
  <polygon points="53,68 67,68 65,82 55,82" fill="#dcfce7"/>
  <path d="M54 68 C60 74 66 74 66 68 Z" fill="#86efac" opacity="0.5"/>
  <!-- Face -->
  <path d="M38 46 C38 66 48 78 60 78 C72 78 82 66 82 46 C82 34 72 30 60 30 C48 30 38 34 38 46 Z" fill="url(#co_skin)"/>
  <ellipse cx="44" cy="62" rx="3.5" ry="1.8" fill="#86efac" opacity="0.6"/>
  <ellipse cx="76" cy="62" rx="3.5" ry="1.8" fill="#86efac" opacity="0.6"/>
  <!-- Eyes -->
  <ellipse cx="49" cy="52" rx="5.5" ry="6.5" fill="#022c22"/>
  <ellipse cx="49" cy="53" rx="4.5" ry="5.5" fill="url(#co_eye)"/>
  <circle cx="49" cy="54" r="2" fill="#011b14"/>
  <circle cx="47" cy="50.5" r="1.8" fill="#ffffff"/>
  <circle cx="51" cy="54.5" r="0.8" fill="#ffffff"/>
  <path d="M43 47 C46 44 53 44 56 47" stroke="#022c22" stroke-width="1.8" stroke-linecap="round" fill="none"/>
  <ellipse cx="71" cy="52" rx="5.5" ry="6.5" fill="#022c22"/>
  <ellipse cx="71" cy="53" rx="4.5" ry="5.5" fill="url(#co_eye)"/>
  <circle cx="71" cy="54" r="2" fill="#011b14"/>
  <circle cx="69" cy="50.5" r="1.8" fill="#ffffff"/>
  <circle cx="73" cy="54.5" r="0.8" fill="#ffffff"/>
  <path d="M64 47 C67 44 74 44 77 47" stroke="#022c22" stroke-width="1.8" stroke-linecap="round" fill="none"/>
  <!-- Nose & Warm Smile -->
  <path d="M60 58 L59 61" stroke="#059669" stroke-width="1" stroke-linecap="round"/>
  <path d="M55 66 C58 69 62 69 65 66" stroke="#047857" stroke-width="1.5" stroke-linecap="round" fill="none"/>
  <!-- Soft Wavy Bangs -->
  <path d="M34 42 C38 28 50 22 60 22 C72 22 84 28 86 42 C82 38 76 42 70 38 C64 48 58 42 54 48 C48 40 42 46 34 42 Z" fill="url(#co_hair)"/>
  <path d="M44 26 C52 30 68 30 76 26" stroke="#a7f3d0" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.6"/>
</svg>`,

  // 6. OP - The Operator: Disciplined tactical anime commander with sharp blonde hair, tactical earpiece, amber eyes, and ops uniform
  OP: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" role="img" aria-label="The Operator anime avatar">
  <defs>
    <radialGradient id="op_bg" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#362506"/>
      <stop offset="100%" stop-color="#0c0702"/>
    </radialGradient>
    <linearGradient id="op_hair" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fde047"/>
      <stop offset="50%" stop-color="#eab308"/>
      <stop offset="100%" stop-color="#854d0e"/>
    </linearGradient>
    <linearGradient id="op_skin" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fefce8"/>
      <stop offset="100%" stop-color="#fef08a"/>
    </linearGradient>
    <linearGradient id="op_eye" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#facc15"/>
      <stop offset="100%" stop-color="#a16207"/>
    </linearGradient>
  </defs>
  <!-- Background -->
  <circle cx="60" cy="60" r="58" fill="url(#op_bg)" stroke="#eab308" stroke-width="2"/>
  <!-- Tactical HUD Grid Accent -->
  <path d="M22 60 L28 60 M92 60 L98 60 M60 22 L60 28 M60 92 L60 98" stroke="#ca8a04" stroke-width="1.5" opacity="0.6"/>
  <!-- Back Hair -->
  <path d="M32 46 C26 58 28 82 36 94 C40 84 42 70 42 58 Z" fill="#854d0e"/>
  <path d="M88 46 C94 58 92 82 84 94 C80 84 78 70 78 58 Z" fill="#854d0e"/>
  <!-- Tactical Ops Uniform -->
  <path d="M24 112 C24 94 38 86 60 86 C82 86 96 94 96 112 Z" fill="#18181b"/>
  <path d="M42 86 L60 98 L78 86 Z" fill="#ca8a04"/>
  <path d="M38 100 L46 94 M82 100 L74 94" stroke="#facc15" stroke-width="1.5"/>
  <!-- Comms Earpiece -->
  <circle cx="83" cy="56" r="3" fill="#18181b" stroke="#eab308" stroke-width="1"/>
  <circle cx="83" cy="56" r="1" fill="#22c55e"/>
  <path d="M83 58 L78 68" stroke="#71717a" stroke-width="1.2" stroke-linecap="round"/>
  <!-- Neck -->
  <polygon points="53,68 67,68 65,82 55,82" fill="#fef08a"/>
  <path d="M54 68 C60 74 66 74 66 68 Z" fill="#eab308" opacity="0.3"/>
  <!-- Face -->
  <path d="M38 46 C38 66 48 78 60 78 C72 78 82 66 82 46 C82 34 72 30 60 30 C48 30 38 34 38 46 Z" fill="url(#op_skin)"/>
  <!-- Eyes -->
  <ellipse cx="49" cy="52" rx="5.5" ry="6.5" fill="#292524"/>
  <ellipse cx="49" cy="53" rx="4.5" ry="5.5" fill="url(#op_eye)"/>
  <circle cx="49" cy="54" r="2" fill="#0c0a09"/>
  <circle cx="47" cy="50.5" r="1.8" fill="#ffffff"/>
  <circle cx="51" cy="54.5" r="0.8" fill="#ffffff"/>
  <path d="M42 46 C45 44 53 44 56 46" stroke="#292524" stroke-width="2" stroke-linecap="round" fill="none"/>
  <ellipse cx="71" cy="52" rx="5.5" ry="6.5" fill="#292524"/>
  <ellipse cx="71" cy="53" rx="4.5" ry="5.5" fill="url(#op_eye)"/>
  <circle cx="71" cy="54" r="2" fill="#0c0a09"/>
  <circle cx="69" cy="50.5" r="1.8" fill="#ffffff"/>
  <circle cx="73" cy="54.5" r="0.8" fill="#ffffff"/>
  <path d="M64 46 C67 44 75 44 78 46" stroke="#292524" stroke-width="2" stroke-linecap="round" fill="none"/>
  <!-- Nose & Firm Line Mouth -->
  <path d="M60 58 L59 61" stroke="#ca8a04" stroke-width="1" stroke-linecap="round"/>
  <path d="M56 67 L64 67" stroke="#78350f" stroke-width="1.6" stroke-linecap="round"/>
  <!-- Sharp Angular Bangs -->
  <path d="M34 42 C38 28 50 22 60 22 C72 22 84 28 86 42 C82 38 78 44 72 38 C66 48 62 40 58 48 C52 40 44 44 34 42 Z" fill="url(#op_hair)"/>
  <path d="M44 26 C52 30 68 30 76 26" stroke="#fef08a" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.7"/>
</svg>`,
};
