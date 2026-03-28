export interface Activity {
  id: string;
  name: string;
  icon: string;
  color: string;
  category: 'work' | 'fitness' | 'hobby' | 'personal' | 'learning';
  isCustom?: boolean;
}

export const DEFAULT_ACTIVITIES: Activity[] = [
  { id: 'work', name: 'Work', icon: 'briefcase-outline', color: '#4A7C59', category: 'work' },
  { id: 'gym', name: 'Gym', icon: 'barbell-outline', color: '#C17767', category: 'fitness' },
  { id: 'chess', name: 'Chess', icon: 'game-controller-outline', color: '#8B7355', category: 'hobby' },
  { id: 'guitar', name: 'Guitar', icon: 'musical-notes-outline', color: '#9B6B9E', category: 'hobby' },
  { id: 'tv', name: 'TV/Movies', icon: 'tv-outline', color: '#5B8BA0', category: 'hobby' },
  { id: 'reading', name: 'Reading', icon: 'book-outline', color: '#728C69', category: 'hobby' },
  { id: 'journal', name: 'Journalling', icon: 'document-text-outline', color: '#D4B483', category: 'personal' },
  { id: 'shopping', name: 'Shopping', icon: 'cart-outline', color: '#CC8866', category: 'hobby' },
  { id: 'startup', name: 'Startup', icon: 'rocket-outline', color: '#6B8E9B', category: 'work' },
  { id: 'articles', name: 'Articles', icon: 'newspaper-outline', color: '#7B9BAB', category: 'learning' },
  { id: 'ai', name: 'AI Knowledge', icon: 'hardware-chip-outline', color: '#9B7BB0', category: 'learning' },
  { id: 'jobprep', name: 'Job Prep', icon: 'school-outline', color: '#6E9B6E', category: 'learning' },
  { id: 'family', name: 'Family Time', icon: 'people-outline', color: '#C4866B', category: 'personal' },
  { id: 'rest', name: 'Rest', icon: 'bed-outline', color: '#8B9BAB', category: 'personal' },
];

export interface ExtraField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'multiline';
}

export const EXTRA_FIELDS: Record<string, ExtraField[]> = {
  work: [
    { key: 'tasks', label: 'Key Tasks', type: 'multiline' },
    { key: 'accomplishments', label: 'Accomplishments', type: 'multiline' },
  ],
  gym: [
    { key: 'workoutType', label: 'Workout Type', type: 'text' },
    { key: 'exercises', label: 'Exercises', type: 'multiline' },
  ],
  chess: [
    { key: 'platform', label: 'Platform (chess.com/lichess)', type: 'text' },
    { key: 'gamesPlayed', label: 'Games Played', type: 'number' },
    { key: 'puzzlesSolved', label: 'Puzzles Solved', type: 'number' },
  ],
  guitar: [
    { key: 'song', label: 'Song / Piece', type: 'text' },
    { key: 'technique', label: 'Technique Practiced', type: 'text' },
  ],
  tv: [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'mediaType', label: 'Type (tv/movie)', type: 'text' },
    { key: 'genre', label: 'Genre', type: 'text' },
  ],
  reading: [
    { key: 'bookTitle', label: 'Book Title', type: 'text' },
    { key: 'pagesRead', label: 'Pages Read', type: 'number' },
  ],
  journal: [
    { key: 'topic', label: 'Journal Topic', type: 'text' },
    { key: 'wordCount', label: 'Word Count', type: 'number' },
  ],
  shopping: [
    { key: 'items', label: 'Items', type: 'multiline' },
    { key: 'amount', label: 'Amount Spent', type: 'number' },
  ],
  startup: [
    { key: 'milestone', label: 'Milestone / Focus', type: 'text' },
    { key: 'blockers', label: 'Blockers', type: 'multiline' },
  ],
  articles: [
    { key: 'articleTitle', label: 'Article Title', type: 'text' },
    { key: 'articleUrl', label: 'URL', type: 'text' },
    { key: 'articleTopic', label: 'Topic', type: 'text' },
  ],
  ai: [
    { key: 'topics', label: 'Topics Explored', type: 'multiline' },
    { key: 'tools', label: 'Tools / Models Used', type: 'text' },
  ],
  jobprep: [
    { key: 'prepTopic', label: 'Topic', type: 'text' },
    { key: 'problemsSolved', label: 'Problems Solved', type: 'number' },
    { key: 'platform', label: 'Platform', type: 'text' },
  ],
  family: [
    { key: 'activityType', label: 'Activity', type: 'text' },
    { key: 'participants', label: 'With Whom', type: 'text' },
  ],
  rest: [
    { key: 'restType', label: 'Type (nap/meditation/etc)', type: 'text' },
    { key: 'duration', label: 'Duration (mins)', type: 'number' },
  ],
};

export const MOODS = [
  { id: 'productive', emoji: '\u{1F680}', label: 'Productive', color: '#4D734D' },
  { id: 'focused', emoji: '\u{1F3AF}', label: 'Focused', color: '#5B8BA0' },
  { id: 'happy', emoji: '\u{1F60A}', label: 'Happy', color: '#D4B483' },
  { id: 'relaxed', emoji: '\u{1F60C}', label: 'Relaxed', color: '#728C69' },
  { id: 'tired', emoji: '\u{1F634}', label: 'Tired', color: '#8B9BAB' },
  { id: 'stressed', emoji: '\u{1F630}', label: 'Stressed', color: '#C17767' },
  { id: 'neutral', emoji: '\u{1F610}', label: 'Neutral', color: '#6E756B' },
];

export const ICON_OPTIONS = [
  'star-outline', 'heart-outline', 'flame-outline', 'leaf-outline',
  'diamond-outline', 'trophy-outline', 'bulb-outline', 'color-palette-outline',
  'fitness-outline', 'globe-outline', 'headset-outline', 'camera-outline',
  'cafe-outline', 'bicycle-outline', 'airplane-outline', 'code-slash-outline',
];

export const COLOR_OPTIONS = [
  '#C17767', '#728C69', '#D4B483', '#5B8BA0', '#9B6B9E',
  '#8B7355', '#CC8866', '#6B8E9B', '#9B7BB0', '#6E9B6E',
  '#C4866B', '#7B9BAB', '#4A7C59', '#8B9BAB',
];
