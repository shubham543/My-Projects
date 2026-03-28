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
  type: 'text' | 'number' | 'multiline' | 'select';
  options?: string[];
}

export const EXTRA_FIELDS: Record<string, ExtraField[]> = {
  work: [
    { key: 'tasks', label: 'Key Tasks', type: 'multiline' },
    { key: 'accomplishments', label: 'Accomplishments', type: 'multiline' },
  ],
  gym: [
    { key: 'workoutType', label: 'Workout Type', type: 'select', options: [
      'Push', 'Pull', 'Legs', 'Upper Body', 'Lower Body', 'Full Body',
      'Cardio', 'HIIT', 'Yoga', 'Flexibility', 'Swimming', 'Running',
      'Cycling', 'Sports', 'Calisthenics', 'Other',
    ]},
    { key: 'exercises', label: 'Exercises', type: 'multiline' },
  ],
  chess: [
    { key: 'platform', label: 'Platform', type: 'select', options: [
      'chess.com', 'lichess.org', 'Chess24', 'OTB (Over the Board)', 'Other',
    ]},
    { key: 'gamesPlayed', label: 'Games Played', type: 'number' },
    { key: 'puzzlesSolved', label: 'Puzzles Solved', type: 'number' },
  ],
  guitar: [
    { key: 'song', label: 'Song / Piece', type: 'text' },
    { key: 'technique', label: 'Technique', type: 'select', options: [
      'Chords', 'Fingerpicking', 'Strumming', 'Scales', 'Barre Chords',
      'Arpeggios', 'Soloing', 'Music Theory', 'Song Learning', 'Other',
    ]},
  ],
  tv: [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'mediaType', label: 'Type', type: 'select', options: [
      'TV Series', 'Movie', 'Documentary', 'Anime', 'Web Series', 'Short Film',
    ]},
    { key: 'genre', label: 'Genre', type: 'select', options: [
      'Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Thriller',
      'Romance', 'Documentary', 'Fantasy', 'Animation', 'Mystery',
      'Crime', 'Biography', 'Adventure', 'Other',
    ]},
  ],
  reading: [
    { key: 'bookTitle', label: 'Book Title', type: 'text' },
    { key: 'pagesRead', label: 'Pages Read', type: 'number' },
    { key: 'genre', label: 'Genre', type: 'select', options: [
      'Fiction', 'Non-Fiction', 'Self-Help', 'Technical', 'Biography',
      'Science', 'Philosophy', 'Business', 'History', 'Fantasy', 'Other',
    ]},
  ],
  journal: [
    { key: 'topic', label: 'Journal Topic', type: 'text' },
    { key: 'journalType', label: 'Type', type: 'select', options: [
      'Gratitude', 'Reflection', 'Goal Setting', 'Free Writing',
      'Dream Journal', 'Mood Journal', 'Bullet Journal', 'Other',
    ]},
    { key: 'wordCount', label: 'Word Count', type: 'number' },
  ],
  shopping: [
    { key: 'category', label: 'Category', type: 'select', options: [
      'Electronics', 'Clothing', 'Groceries', 'Books', 'Home & Garden',
      'Health & Fitness', 'Gadgets', 'Entertainment', 'Gifts', 'Other',
    ]},
    { key: 'items', label: 'Items', type: 'multiline' },
    { key: 'amount', label: 'Amount Spent', type: 'number' },
  ],
  startup: [
    { key: 'focusArea', label: 'Focus Area', type: 'select', options: [
      'Ideation', 'Market Research', 'Product Development', 'UI/UX Design',
      'Coding', 'Testing', 'Marketing', 'Outreach', 'Finance', 'Legal', 'Other',
    ]},
    { key: 'milestone', label: 'Milestone / Focus', type: 'text' },
    { key: 'blockers', label: 'Blockers', type: 'multiline' },
  ],
  articles: [
    { key: 'articleTitle', label: 'Article Title', type: 'text' },
    { key: 'articleUrl', label: 'URL', type: 'text' },
    { key: 'articleTopic', label: 'Topic', type: 'select', options: [
      'Technology', 'AI / ML', 'Business', 'Science', 'Health',
      'Productivity', 'Finance', 'Design', 'Programming', 'Startups',
      'Psychology', 'Philosophy', 'News', 'Other',
    ]},
  ],
  ai: [
    { key: 'focusArea', label: 'Focus Area', type: 'select', options: [
      'LLMs / ChatGPT', 'Image Generation', 'Machine Learning', 'Deep Learning',
      'NLP', 'Computer Vision', 'Reinforcement Learning', 'AI Ethics',
      'AI Tools', 'Research Papers', 'Prompt Engineering', 'Other',
    ]},
    { key: 'topics', label: 'Topics Explored', type: 'multiline' },
    { key: 'tools', label: 'Tools / Models Used', type: 'text' },
  ],
  jobprep: [
    { key: 'prepType', label: 'Prep Type', type: 'select', options: [
      'DSA', 'System Design', 'Behavioral', 'Mock Interview',
      'Resume / Portfolio', 'Networking', 'Company Research', 'Other',
    ]},
    { key: 'prepTopic', label: 'Topic', type: 'text' },
    { key: 'problemsSolved', label: 'Problems Solved', type: 'number' },
    { key: 'platform', label: 'Platform', type: 'select', options: [
      'LeetCode', 'HackerRank', 'CodeForces', 'InterviewBit',
      'AlgoExpert', 'NeetCode', 'GeeksforGeeks', 'Pramp', 'Other',
    ]},
  ],
  family: [
    { key: 'activityType', label: 'Activity', type: 'select', options: [
      'Dinner Together', 'Outing / Trip', 'Movie Night', 'Game Night',
      'Cooking Together', 'Walk / Exercise', 'Shopping', 'Conversation',
      'Celebration', 'Video Call', 'Other',
    ]},
    { key: 'participants', label: 'With Whom', type: 'text' },
  ],
  rest: [
    { key: 'restType', label: 'Type', type: 'select', options: [
      'Nap', 'Meditation', 'Deep Breathing', 'Relaxation', 'Walk',
      'Sauna / Spa', 'Stretching', 'Just Chilling', 'Other',
    ]},
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
