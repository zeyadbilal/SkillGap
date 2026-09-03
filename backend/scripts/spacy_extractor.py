#!/usr/bin/env python3
import sys
import json
import re
from pathlib import Path

try:
    import spacy
    from spacy.lang.en import English
except Exception:
    # minimal fallback
    spacy = None

CV = sys.stdin.read().strip()
if not CV:
    print(json.dumps({'error': 'no input'}))
    sys.exit(1)

# load model
nlp = None
if spacy:
    try:
        nlp = spacy.load('en_core_web_trf')
    except Exception:
        try:
            nlp = spacy.load('en_core_web_sm')
        except Exception:
            nlp = None

# simple skill list loader (reuse repo skill dict if available)
skills_path = Path(__file__).resolve().parents[1] / 'DataPipeline' / 'config' / 'skills_dictionary.json'
skill_items = []
if skills_path.exists():
    try:
        raw = json.loads(skills_path.read_text())
        for track, items in raw.items():
            for it in items:
                skill_items.append((it, track))
    except Exception:
        skill_items = []

# matcher using spaCy or simple regex
from collections import defaultdict
hits = defaultdict(lambda: {'skill': None, 'tracks': set(), 'mentions': 0})
text = CV
text_lower = text.lower()

if nlp:
    doc = nlp(text)
    # build phrase set from skill_items
    phrases = {s.lower(): t for s, t in skill_items}
    for ent in doc.ents:
        # consider ORG, WORK_OF_ART, PRODUCT etc as possible skills
        name = ent.text.strip()
        key = name.lower()
        if key in phrases:
            hits[name]['skill'] = name
            hits[name]['tracks'].add(phrases[key])
            hits[name]['mentions'] += 1
    # also scan tokens for phrase matches
    for s, t in skill_items:
        if s.lower() in text_lower:
            hits[s]['skill'] = s
            hits[s]['tracks'].add(t)
            hits[s]['mentions'] += text_lower.count(s.lower())
else:
    # regex fallback
    for s, t in skill_items:
        pat = re.compile(r"\b" + re.escape(s.lower()) + r"\b")
        if pat.search(text_lower):
            hits[s]['skill'] = s
            hits[s]['tracks'].add(t)
            hits[s]['mentions'] += len(pat.findall(text_lower))

# build detected skills list
detected = []
for k, v in hits.items():
    detected.append({
        'skill': v['skill'] or k,
        'tracks': list(v['tracks']) if v['tracks'] else ['Machine Learning / AI'],
        'mentions': v['mentions'],
        'confidence': 0.9 if v['mentions']>0 else 0.6,
        'proficiencyLevel': 'Intermediate'  # leave as heuristic; backend can refine
    })

# infer track by majority
from collections import Counter
track_counts = Counter()
for d in detected:
    for t in d['tracks']:
        track_counts[t]+=1
inferred = track_counts.most_common(1)[0][0] if track_counts else 'Machine Learning / AI'

out = {
    'detectedSkills': detected,
    'inferredTrack': inferred,
    'textLength': len(text),
}
print(json.dumps(out))
