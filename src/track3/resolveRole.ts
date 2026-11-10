import { DomainId, ResolvedRole } from './types';
import { DOMAIN_KEYWORD_HINTS, PRESET_ROLES, TRACK3_DOMAINS } from './presets';
import { AI_TAGS, getDomainGroups, TRACK3_TAGS } from './tags';

/**
 * Normalise text: lowercase, strip punctuation except & and /, collapse spaces.
 */
export function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9&/\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks if target phrase exists as whole word or exact match in normalized text.
 */
function phraseMatches(text: string, phrase: string): boolean {
  const normText = normalizeText(text);
  const normPhrase = normalizeText(phrase);
  if (!normText || !normPhrase) return false;
  if (normText === normPhrase) return true;
  const escaped = normPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(^|[\\s&/])${escaped}($|[\\s&/])`);
  return regex.test(normText);
}

/**
 * Pure function to resolve typed target roles without any network/AI calls.
 * Follows PART 9 specifications.
 */
export function resolveTargetRole(
  rawInput: string,
  preferredDomain?: DomainId
): ResolvedRole {
  const norm = normalizeText(rawInput);
  if (!norm) {
    return {
      confidence: 'low',
      roleTitle: 'General Management',
      domainId: 'general-management',
      tags: ['prioritisation', 'stakeholder-management', 'team-leadership'],
      isTyped: true,
      rawInput,
    };
  }

  // 1. Preset alias matching
  // - Exact preset label or alias match, or 2 or more alias hits for one preset: confidence "high"
  // - One alias hit for one preset: confidence "medium"
  interface PresetMatchScore {
    preset: typeof PRESET_ROLES[0];
    exactTitle: boolean;
    exactAlias: boolean;
    aliasHits: number;
    matchingAliases: string[];
  }

  const presetScores: PresetMatchScore[] = [];

  for (const preset of PRESET_ROLES) {
    const normTitle = normalizeText(preset.title);
    const exactTitle = norm === normTitle;

    let exactAlias = false;
    let hitCount = 0;
    const matchingAliases: string[] = [];

    for (const alias of preset.aliases) {
      const normAlias = normalizeText(alias);
      if (norm === normAlias) {
        exactAlias = true;
        hitCount += 2;
        matchingAliases.push(alias);
      } else if (phraseMatches(norm, normAlias)) {
        hitCount++;
        matchingAliases.push(alias);
      }
    }

    if (exactTitle || exactAlias || hitCount > 0) {
      presetScores.push({
        preset,
        exactTitle,
        exactAlias,
        aliasHits: hitCount,
        matchingAliases,
      });
    }
  }

  // Sort preset scores: exact title > exact alias > highest aliasHits > preset order
  presetScores.sort((a, b) => {
    if (a.exactTitle !== b.exactTitle) return a.exactTitle ? -1 : 1;
    if (a.exactAlias !== b.exactAlias) return a.exactAlias ? -1 : 1;
    if (b.aliasHits !== a.aliasHits) return b.aliasHits - a.aliasHits;
    return PRESET_ROLES.indexOf(a.preset) - PRESET_ROLES.indexOf(b.preset);
  });

  if (presetScores.length > 0) {
    const top = presetScores[0];
    const secondHits = presetScores[1]?.aliasHits || 0;

    // High confidence: exact label, exact alias, or 2+ distinct alias hits
    if (top.exactTitle || top.exactAlias || top.aliasHits >= 2) {
      return {
        confidence: 'high',
        presetId: top.preset.id,
        roleTitle: top.preset.title,
        domainId: top.preset.domain,
        tags: [...top.preset.tags],
        aiTags: top.preset.aiTags ? [...top.preset.aiTags] : undefined,
        isTyped: true,
        rawInput,
      };
    }

    // If exactly one alias hit and no other preset has more hits
    // But check if input has multiple distinct domain keywords (e.g. "digital product sales")
    // If so, do not force single alias hit over richer domain analysis
    if (top.aliasHits === 1 && secondHits < 1) {
      // Check if domain keyword hints provide a stronger domain match
      let domainHitsCount = 0;
      for (const d of TRACK3_DOMAINS) {
        for (const hint of DOMAIN_KEYWORD_HINTS[d.id] || []) {
          if (phraseMatches(norm, hint)) domainHitsCount++;
        }
      }
      if (domainHitsCount <= 1) {
        return {
          confidence: 'medium',
          presetId: top.preset.id,
          roleTitle: top.preset.title,
          domainId: top.preset.domain,
          tags: [...top.preset.tags],
          aiTags: top.preset.aiTags ? [...top.preset.aiTags] : undefined,
          isTyped: true,
          rawInput,
        };
      }
    }
  }

  // 2. Count domain keyword hits (PART 5 hints)
  const domainKeywordHits: Record<DomainId, number> = {
    'product-tech': 0,
    'finance-consulting': 0,
    'marketing-growth': 0,
    'operations-analytics': 0,
    'sales-bd': 0,
    people: 0,
    'general-management': 0,
  };

  for (const domain of TRACK3_DOMAINS) {
    const hints = DOMAIN_KEYWORD_HINTS[domain.id] || [];
    for (const hint of hints) {
      if (phraseMatches(norm, hint)) {
        domainKeywordHits[domain.id]++;
      }
    }
  }

  // Find domain with most hits
  let bestDomain: DomainId | null = null;
  let maxDomainHits = 0;

  for (const domain of TRACK3_DOMAINS) {
    const hits = domainKeywordHits[domain.id];
    if (hits > maxDomainHits) {
      maxDomainHits = hits;
      bestDomain = domain.id;
    }
  }

  // If there's a tie or preferredDomain is among top
  if (preferredDomain && domainKeywordHits[preferredDomain] === maxDomainHits && maxDomainHits > 0) {
    bestDomain = preferredDomain;
  }

  // If we have a domain match
  if (bestDomain && maxDomainHits > 0) {
    const matchedDomainTags: string[] = [];
    const domainTags = TRACK3_TAGS.filter((t) => t.domain === bestDomain);

    // Pre-select domain tags whose labels or aliases appear in the typed text
    for (const tag of domainTags) {
      if (phraseMatches(norm, tag.label)) {
        if (!matchedDomainTags.includes(tag.id)) matchedDomainTags.push(tag.id);
        continue;
      }
      for (const alias of tag.aliases) {
        if (phraseMatches(norm, alias)) {
          if (!matchedDomainTags.includes(tag.id)) matchedDomainTags.push(tag.id);
          break;
        }
      }
    }

    // Also match AI tags whose labels or aliases appear (up to 8)
    const matchedAITags: string[] = [];
    for (const tag of AI_TAGS) {
      if (phraseMatches(norm, tag.label)) {
        if (!matchedAITags.includes(tag.label)) matchedAITags.push(tag.label);
        continue;
      }
      for (const alias of tag.aliases) {
        if (phraseMatches(norm, alias)) {
          if (!matchedAITags.includes(tag.label)) matchedAITags.push(tag.label);
          break;
        }
      }
      if (matchedAITags.length >= 8) break;
    }

    // If fewer than 3 domain tags match, add the first tags of the best-matching group (in list order) until there are 3
    if (matchedDomainTags.length < 3) {
      const groups = getDomainGroups(bestDomain);
      const firstGroupTags = groups.length > 0 ? groups[0].tags : domainTags;
      for (const t of firstGroupTags) {
        if (!matchedDomainTags.includes(t.id)) {
          matchedDomainTags.push(t.id);
        }
        if (matchedDomainTags.length >= 3) break;
      }
      for (const t of domainTags) {
        if (matchedDomainTags.length >= 3) break;
        if (!matchedDomainTags.includes(t.id)) {
          matchedDomainTags.push(t.id);
        }
      }
    }

    const domainLabel = TRACK3_DOMAINS.find((d) => d.id === bestDomain)?.label || bestDomain;

    return {
      confidence: 'medium',
      roleTitle: rawInput.trim() || domainLabel,
      domainId: bestDomain,
      tags: matchedDomainTags,
      aiTags: matchedAITags.length > 0 ? matchedAITags.slice(0, 8) : undefined,
      isTyped: true,
      rawInput,
    };
  }

  // 3. No hits at all: confidence "low"; use general-management with prioritisation, stakeholder-management, and team-leadership pre-selected
  return {
    confidence: 'low',
    roleTitle: rawInput.trim() || 'General Management',
    domainId: 'general-management',
    tags: ['prioritisation', 'stakeholder-management', 'team-leadership'],
    isTyped: true,
    rawInput,
  };
}
