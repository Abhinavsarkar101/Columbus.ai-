import { ArchetypeCode } from './catalog';

// Section 3.2: The Six Archetypes
export interface ArchetypeDef {
  code: ArchetypeCode;
  name: string;
  color: string;
  characterEnergy: string; // e.g. "Peter Brand energy (Moneyball)"
  characterLabel: string;  // e.g. "Peter Brand (Moneyball)"
  tagline: string;
  description: string;
  strength: string;
  shadowSide: string;
  worksBestWhen: string;
  risk: string;
  nextStep: string;
}

export const ARCHETYPES: Record<ArchetypeCode, ArchetypeDef> = {
  AN: {
    code: 'AN',
    name: 'The Analyst',
    color: '#3b82f6',
    characterEnergy: 'Peter Brand energy (Moneyball)',
    characterLabel: 'Peter Brand (Moneyball)',
    tagline: "Show me the evidence and I'll show you the move.",
    description:
      'You trust evidence and enjoy finding the answer inside the numbers. You are happiest when the problem is precise and the logic can be checked.',
    strength: 'clear, checkable thinking.',
    shadowSide: 'can over-analyse when a fast decision is needed.',
    worksBestWhen: 'you have good data and time to dig.',
    risk: "Strong analysis loses impact if you don't practise explaining it simply.",
    nextStep: "Analyse one company's annual report and present it in 3 slides.",
  },
  ST: {
    code: 'ST',
    name: 'The Strategist',
    color: '#8b5cf6',
    characterEnergy: 'Gandalf energy',
    characterLabel: 'Gandalf',
    tagline: 'I see where the road bends before anyone walks it.',
    description:
      'You think in long horizons and trade-offs. You like open problems where the job is to choose a direction.',
    strength: 'seeing long-term patterns.',
    shadowSide: 'can stay high-level while details slip.',
    worksBestWhen: 'the problem is open-ended and you can shape the direction.',
    risk: 'Open-ended roles reward structured thinking, which needs practice.',
    nextStep: 'Read two short business cases and write a one-page recommendation for each.',
  },
  BU: {
    code: 'BU',
    name: 'The Builder',
    color: '#f97316',
    characterEnergy: 'Tony Stark energy',
    characterLabel: 'Tony Stark',
    tagline: "Give me a weekend and a garage, and I'll show you a prototype.",
    description:
      'You learn by making things and testing them. You are comfortable with uncertainty if it means creating something new.',
    strength: 'turning ideas into working things fast.',
    shadowSide: 'can skip planning or the basics.',
    worksBestWhen: 'you can test small and improve quickly.',
    risk: 'Building without a plan can be costly, and some fields need rigorous basics.',
    nextStep: 'Build one tiny project in two weeks (a page, a small sale, a survey) and note what you learned.',
  },
  PE: {
    code: 'PE',
    name: 'The Persuader',
    color: '#ec4899',
    characterEnergy: 'Elle Woods energy',
    characterLabel: 'Elle Woods',
    tagline: "Underestimate my pitch once. You won't do it twice.",
    description:
      'You read what people want and know how to move them. You enjoy winning attention, trust and deals.',
    strength: 'moving people to act.',
    shadowSide: 'needs numbers behind the story.',
    worksBestWhen: 'you meet people and your effort leads to visible wins.',
    risk: 'Persuasion works best with numbers behind it, so expect to learn analytics basics.',
    nextStep: 'Write a one-page pitch for a product you like, with three supporting numbers.',
  },
  CO: {
    code: 'CO',
    name: 'The Connector',
    color: '#10b981',
    characterEnergy: 'Woody energy',
    characterLabel: 'Woody',
    tagline: 'Nobody gets left behind, and everyone gets heard.',
    description:
      'You get energy from people and purpose. You are drawn to work that develops people or improves lives.',
    strength: 'building trust and developing people.',
    shadowSide: 'can take on others\' stress or avoid hard conversations.',
    worksBestWhen: 'the work has a human purpose.',
    risk: 'Mission-driven roles can be emotionally demanding, so check the day-to-day reality.',
    nextStep: 'Talk to two people in HR, healthcare or sustainability about a typical week.',
  },
  OP: {
    code: 'OP',
    name: 'The Operator',
    color: '#eab308',
    characterEnergy: 'Mark Watney energy',
    characterLabel: 'Mark Watney',
    tagline: 'Every big problem is a checklist of small ones.',
    description:
      'You like making complex things run smoothly. You enjoy clear processes, reliable delivery and steady improvement.',
    strength: 'making complex things run reliably.',
    shadowSide: 'routine can bore you, and unclear change can frustrate you.',
    worksBestWhen: 'goals are clear and you can improve a process.',
    risk: 'Process-heavy work can feel routine if you like variety, so look for roles with change projects.',
    nextStep: 'Map one process you know on one page and list three fixes.',
  },
};

export const CHARACTER_DISCLAIMER_NOTE =
  'Character references are for fun. Not affiliated with any film studio. This is not a clinical personality test.';

export const ARCHETYPE_TIE_ORDER: ArchetypeCode[] = ['AN', 'ST', 'BU', 'PE', 'CO', 'OP'];
