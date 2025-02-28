// Type definitions for meeting data

export type AnnotationType = {
    id: string;
    icon: string;
    label: string;
    color: string;
};

export type TimeEntry = {
    id: string;
    type: string;
    videoTime: number;
    videoTimeFormatted: string;
    stopwatchTime: string;
    elapsedTimeMs: number;
    timestamp: number;
    description: string;
};

export type TimelineMarker = TimeEntry & {
    position: number;
    color: string;
    icon: string;
};

export type SummaryData = {
    userInfo: number;
    questions: number;
    answers: number;
    painPoints: number;
    ambivalent: number;
    successPoints: number;
    featureIdeas: number;
    notes: number;
    other: number;
    [key: string]: number; // Index signature for dynamic access
};

export const ANNOTATION_TYPES: AnnotationType[] = [
    { id: 'userInfo', icon: '👤', label: 'User Info', color: '#e3f2fd' },
    { id: 'question', icon: '?', label: 'Question', color: '#f3e5f5' },
    { id: 'answer', icon: '🔊', label: 'Answer', color: '#e8f5e9' },
    { id: 'pain', icon: '😞', label: 'Pain Point', color: '#ffebee' },
    { id: 'ambivalent', icon: '😐', label: 'Ambivalent', color: '#fff3e0' },
    { id: 'success', icon: '😊', label: 'Success Point', color: '#e0f7fa' },
    { id: 'idea', icon: '💡', label: 'Feature Idea', color: '#e8eaf6' },
    { id: 'note', icon: '📝', label: 'Note', color: '#f5f5f5' },
    { id: 'other', icon: '〰️', label: 'Other', color: '#fafafa' }
];

export const meetingNames: {[key: string]: string} = {
    'ux': 'UX Research Interview',
    'client': 'Client Meeting',
    'stakeholder': 'Stakeholder Meeting',
    'team': 'Team Meeting',
    'custom': 'Custom Meeting'
};
