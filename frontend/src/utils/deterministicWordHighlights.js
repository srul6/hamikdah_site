/**
 * Deterministically pick words to highlight from a string.
 * Same text always yields the same highlights; changing the text recalculates them.
 * Preserves original characters (including punctuation / Hebrew) — only wraps selected words.
 */

const STOPWORDS = new Set([
    // English
    'a', 'an', 'the', 'and', 'or', 'but', 'if', 'in', 'on', 'at', 'to', 'for',
    'of', 'as', 'by', 'with', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
    'it', 'its', 'this', 'that', 'these', 'those', 'you', 'your', 'we', 'our',
    'they', 'their', 'he', 'she', 'him', 'her', 'not', 'no', 'so', 'do', 'does',
    'did', 'can', 'will', 'just', 'also', 'than', 'then', 'when', 'what', 'which',
    // Hebrew (common short / function words)
    'של', 'את', 'על', 'עם', 'אל', 'או', 'גם', 'כי', 'לא', 'זה', 'זו', 'זאת',
    'הם', 'הן', 'הוא', 'היא', 'אני', 'אנחנו', 'אתם', 'אתן', 'יש', 'אין',
    'כל', 'מה', 'מי', 'אם', 'כן', 'פה', 'שם', 'בין', 'אחר', 'עוד', 'רק',
    'כדי', 'אבל', 'כאן', 'שלא', 'להם', 'להן', 'אותו', 'אותה', 'אותם', 'אותן'
]);

function fnv1a(str) {
    let hash = 0x811c9dc5;
    for (let i = 0; i < str.length; i += 1) {
        hash ^= str.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193);
    }
    return hash >>> 0;
}

function mulberry32(seed) {
    let t = seed >>> 0;
    return () => {
        t += 0x6d2b79f5;
        let r = Math.imul(t ^ (t >>> 15), 1 | t);
        r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
        return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
}

function isEligibleWord(word) {
    if (!word || word.length < 3) return false;
    const lower = word.toLocaleLowerCase();
    if (STOPWORDS.has(lower) || STOPWORDS.has(word)) return false;
    return true;
}

/**
 * @param {string} text
 * @returns {Array<{ type: 'text' | 'highlight', value: string }>}
 */
export function buildHighlightedSegments(text) {
    const source = String(text || '');
    if (!source) return [];

    // Unicode letters, optionally with apostrophe/geresh inside a word
    const wordRe = /\p{L}+(?:['’\u05F3]\p{L}+)*/gu;
    const matches = [];
    let match;
    while ((match = wordRe.exec(source)) !== null) {
        matches.push({
            start: match.index,
            end: match.index + match[0].length,
            word: match[0]
        });
    }

    const eligibleIndexes = [];
    matches.forEach((m, i) => {
        if (isEligibleWord(m.word)) eligibleIndexes.push(i);
    });

    const highlightSet = new Set();
    if (eligibleIndexes.length > 0) {
        const target = Math.min(
            7,
            Math.max(1, Math.round(eligibleIndexes.length * 0.18))
        );
        const rand = mulberry32(fnv1a(source));
        const pool = eligibleIndexes.slice();
        // Fisher–Yates with seeded RNG
        for (let i = pool.length - 1; i > 0; i -= 1) {
            const j = Math.floor(rand() * (i + 1));
            const tmp = pool[i];
            pool[i] = pool[j];
            pool[j] = tmp;
        }
        // Prefer spreading: sort selected by position after picking
        const picked = pool.slice(0, target).sort((a, b) => a - b);
        // Drop adjacent highlights for a calmer look
        let last = -2;
        for (const idx of picked) {
            if (idx === last + 1) continue;
            highlightSet.add(idx);
            last = idx;
        }
    }

    const segments = [];
    let cursor = 0;
    matches.forEach((m, i) => {
        if (m.start > cursor) {
            segments.push({ type: 'text', value: source.slice(cursor, m.start) });
        }
        segments.push({
            type: highlightSet.has(i) ? 'highlight' : 'text',
            value: m.word
        });
        cursor = m.end;
    });
    if (cursor < source.length) {
        segments.push({ type: 'text', value: source.slice(cursor) });
    }
    return segments;
}
