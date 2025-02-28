import { writable, derived, type Writable, type Readable } from 'svelte/store';
import { ANNOTATION_TYPES, type AnnotationType, type TimeEntry, type TimelineMarker, type SummaryData } from '$lib/types';

// Store state interface
interface MeetingState {
    meetingId: string;
    meetingType: string;
    meetingName: string;
    customName: string | null;

    // Time entries and timeline
    timeEntries: TimeEntry[];
    timelineMarkers: TimelineMarker[];
    timelineKey: number;

    // Video state
    videoURL: string | null;
    videoFile: File | null;
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    seekPosition: number;

    // Timer state
    isRunning: boolean;
    startTime: number | null;
    elapsedTime: number;
    formattedTime: string;
    timerInterval: ReturnType<typeof setInterval> | null;
    maxRecordedElapsedTime: number;

    // UI state
    isRightPanelOpen: boolean;
    currentPointType: string | null;
    customButtons: AnnotationType[];

    // Timeline positioning
    arePositionsLocked: boolean;
    lockedPositions: {[key: string]: number};

    // Summary data
    summaryData: SummaryData;
}

// Export data interface
interface ExportedMeetingData {
    id: string;
    type: string;
    name: string;
    duration: number;
    formattedDuration: string;
    entries: TimeEntry[];
    summary: SummaryData;
    startedAt: string;
}

// Initial summary data
const createSummaryData = (): SummaryData => ({
    userInfo: 0,
    questions: 0,
    answers: 0,
    painPoints: 0,
    ambivalent: 0,
    successPoints: 0,
    featureIdeas: 0,
    notes: 0,
    other: 0
});

// Create the meeting store
function createMeetingStore() {
    // Meeting data
    const { subscribe, set, update }: Writable<MeetingState> = writable({
        meetingId: '',
        meetingType: 'ux',
        meetingName: '',
        customName: null,

        // Time entries and timeline
        timeEntries: [],
        timelineMarkers: [],
        timelineKey: 0,

        // Video state
        videoURL: null,
        videoFile: null,
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        seekPosition: 0,

        // Timer state
        isRunning: false,
        startTime: null,
        elapsedTime: 0,
        formattedTime: "00:00",
        timerInterval: null,
        maxRecordedElapsedTime: 0,

        // UI state
        isRightPanelOpen: false,
        currentPointType: null,
        customButtons: [],

        // Timeline positioning
        arePositionsLocked: false,
        lockedPositions: {},

        // Summary data
        summaryData: createSummaryData()
    });

    // Helper functions
    function formatTime(seconds: number): string {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    function generateId(): string {
        return `entry-${Date.now()}`;
    }

    function getIconColor(type: string): string {
        const annotationType = [...ANNOTATION_TYPES].find(t => t.id === type);
        return annotationType ? annotationType.color : '#e0e0e0';
    }

    function getIcon(type: string): string {
        const annotationType = [...ANNOTATION_TYPES].find(t => t.id === type);
        return annotationType ? annotationType.icon : '•';
    }

    function getTypeLabel(type: string): string {
        const annotationType = ANNOTATION_TYPES.find(t => t.id === type);
        return annotationType ? annotationType.label : type;
    }

    // Calculate timeline position
    function getTimelinePosition(entry: TimeEntry, state: MeetingState): number {
        // If positions are locked, use the locked position
        if (state.arePositionsLocked && state.lockedPositions[entry.id] !== undefined) {
            return state.lockedPositions[entry.id];
        }

        let position = 0;

        // Special case for entries with zero elapsed time
        if (entry.elapsedTimeMs === 0) {
            const entryIndex = state.timeEntries.findIndex(e => e.id === entry.id);
            if (entryIndex >= 0) {
                const zeroTimeEntries = state.timeEntries.filter(e => e.elapsedTimeMs === 0).length;
                const spacing = 5; // Smaller spacing to keep at start
                position = 2 + (entryIndex % zeroTimeEntries) * spacing;
            } else {
                position = 2;
            }
        }
        // For entries with elapsed time, calculate the position properly
        else if (entry.elapsedTimeMs > 0) {
            const maxTimeToUse = Math.max(state.maxRecordedElapsedTime, state.elapsedTime);

            // Scale elapsed time relative to video duration
            if (state.duration > 0) {
                const scaledPosition = (entry.elapsedTimeMs / maxTimeToUse) *
                    (maxTimeToUse / (state.duration * 1000)) * 100;
                position = scaledPosition;
            } else {
                // If no video, distribute based on elapsed time
                position = (entry.elapsedTimeMs / maxTimeToUse) * 100;
            }
        }

        // Ensure position is within bounds
        return Math.min(98, Math.max(2, position));
    }

    // Update timeline markers
    function updateTimelineMarkers(state: MeetingState): TimelineMarker[] {
        return state.timeEntries.map(entry => ({
            ...entry,
            position: getTimelinePosition(entry, state),
            color: getIconColor(entry.type),
            icon: getIcon(entry.type)
        }));
    }

    return {
        subscribe,

        // Initialize the meeting
        init: (meetingType: string, customName: string | null, meetingId?: string): void => {
            const id = meetingId || `meeting-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            const nameMapping: {[key: string]: string} = {
                'ux': 'UX Research Interview',
                'client': 'Client Meeting',
                'stakeholder': 'Stakeholder Meeting',
                'team': 'Team Meeting',
                'custom': customName || 'Custom Meeting'
            };

            update(state => ({
                ...state,
                meetingId: id,
                meetingType,
                customName,
                meetingName: nameMapping[meetingType] || 'Meeting'
            }));
        },

        // Timer controls
        startTimer: (): void => {
            update(state => {
                if (state.isRunning) return state;

                const startTime = Date.now() - state.elapsedTime;
                const timerInterval = setInterval(() => {
                    meeting.updateTimer();
                }, 100);

                return {
                    ...state,
                    isRunning: true,
                    startTime,
                    timerInterval
                };
            });
        },

        stopTimer: (): void => {
            update(state => {
                if (!state.isRunning) return state;

                if (state.timerInterval) {
                    clearInterval(state.timerInterval);
                }

                return {
                    ...state,
                    isRunning: false,
                    timerInterval: null,
                    maxRecordedElapsedTime: Math.max(state.maxRecordedElapsedTime, state.elapsedTime)
                };
            });
        },

        updateTimer: (): void => {
            update(state => {
                if (!state.isRunning || state.startTime === null) return state;

                const elapsedTime = Date.now() - state.startTime;
                const minutes = Math.floor(elapsedTime / 60000);
                const seconds = Math.floor((elapsedTime % 60000) / 1000);
                const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

                // Track the maximum elapsed time
                const maxRecordedElapsedTime = Math.max(state.maxRecordedElapsedTime, elapsedTime);

                // Update timeline markers
                const timelineMarkers = updateTimelineMarkers({
                    ...state,
                    elapsedTime,
                    maxRecordedElapsedTime
                });

                return {
                    ...state,
                    elapsedTime,
                    formattedTime,
                    maxRecordedElapsedTime,
                    timelineMarkers,
                    timelineKey: state.timelineKey + 1
                };
            });
        },

        // Video functions
        setVideo: (file: File | null): void => {
            update(state => {
                // Clean up previous video URL
                if (state.videoURL) {
                    URL.revokeObjectURL(state.videoURL);
                }

                const videoURL = file ? URL.createObjectURL(file) : null;

                return {
                    ...state,
                    videoFile: file,
                    videoURL,
                    isPlaying: false,
                    arePositionsLocked: false,
                    lockedPositions: {}
                };
            });
        },

        updateVideoTime: (currentTime: number): void => {
            update(state => ({
                ...state,
                currentTime
            }));
        },

        updateVideoDuration: (duration: number): void => {
            update(state => ({
                ...state,
                duration,
                timelineMarkers: updateTimelineMarkers({...state, duration})
            }));
        },

        togglePlay: (): void => {
            // This should be coordinated with actual video element in the component
            update(state => ({
                ...state,
                isPlaying: !state.isPlaying
            }));
        },

        setSeekPosition: (position: number): void => {
            update(state => ({
                ...state,
                seekPosition: position,
                currentTime: position * state.duration
            }));
        },

        // Entry management
        recordPoint: (type: string): void => {
            update(state => {
                if (!state.isRunning && type !== 'end') {
                    // Start the timer
                    const startTime = Date.now() - state.elapsedTime;
                    const timerInterval = setInterval(() => {
                        meeting.updateTimer();
                    }, 100);

                    state = {
                        ...state,
                        isRunning: true,
                        startTime,
                        timerInterval
                    };
                }

                if (type === 'end') {
                    if (state.timerInterval) {
                        clearInterval(state.timerInterval);
                    }

                    return {
                        ...state,
                        isRunning: false,
                        timerInterval: null,
                        maxRecordedElapsedTime: Math.max(state.maxRecordedElapsedTime, state.elapsedTime)
                    };
                } else {
                    // Create the new entry
                    const newEntry: TimeEntry = {
                        id: generateId(),
                        type,
                        videoTime: state.currentTime,
                        videoTimeFormatted: formatTime(state.currentTime),
                        stopwatchTime: state.formattedTime,
                        elapsedTimeMs: state.elapsedTime,
                        timestamp: Date.now(),
                        description: ""
                    };

                    // Update summary count
                    const summaryData = {...state.summaryData};
                    if (type in summaryData) {
                        summaryData[type] += 1;
                    }

                    // Add to time entries
                    const timeEntries = [...state.timeEntries, newEntry];

                    // Calculate position for this new entry
                    const lockedPositions = {...state.lockedPositions};
                    if (state.duration > 0) {
                        const position = (state.currentTime / state.duration) * 100;
                        lockedPositions[newEntry.id] = Math.min(98, Math.max(2, position));
                    }

                    // Update the timeline markers
                    const updatedState = {
                        ...state,
                        timeEntries,
                        summaryData,
                        lockedPositions
                    };

                    const timelineMarkers = updateTimelineMarkers(updatedState);

                    return {
                        ...updatedState,
                        timelineMarkers,
                        timelineKey: state.timelineKey + 1
                    };
                }
            });
        },

        updateEntryDescription: (id: string, description: string): void => {
            update(state => {
                const timeEntries = state.timeEntries.map(entry =>
                    entry.id === id ? {...entry, description} : entry
                );

                return {
                    ...state,
                    timeEntries
                };
            });
        },

        removeEntry: (id: string): void => {
            update(state => {
                // Find entry before removal to update summary
                const entryToRemove = state.timeEntries.find(entry => entry.id === id);

                // Remove entry from the list
                const timeEntries = state.timeEntries.filter(entry => entry.id !== id);

                // Update summary count
                const summaryData = {...state.summaryData};
                if (entryToRemove && entryToRemove.type in summaryData) {
                    summaryData[entryToRemove.type] -= 1;
                }

                // Update timeline markers
                const updatedState = {
                    ...state,
                    timeEntries,
                    summaryData
                };

                const timelineMarkers = updateTimelineMarkers(updatedState);

                return {
                    ...updatedState,
                    timelineMarkers,
                    timelineKey: state.timelineKey + 1
                };
            });
        },

        // UI state
        toggleRightPanel: (): void => {
            update(state => ({
                ...state,
                isRightPanelOpen: !state.isRightPanelOpen
            }));
        },

        createCustomButton: (label: string): void => {
            update(state => {
                const customButtons = [...state.customButtons, {
                    id: `custom-${Date.now()}`,
                    icon: '⭐',
                    label,
                    color: '#f0f4c3'
                }];

                return {
                    ...state,
                    customButtons
                };
            });
        },

        lockPositions: (): void => {
            update(state => {
                if (state.arePositionsLocked || !state.duration) return state;

                const lockedPositions = {...state.lockedPositions};

                state.timeEntries.forEach(entry => {
                    if (lockedPositions[entry.id] === undefined) {
                        const position = getTimelinePosition(entry, state);
                        lockedPositions[entry.id] = position;
                    }
                });

                return {
                    ...state,
                    arePositionsLocked: true,
                    lockedPositions
                };
            });
        },

        // Export data
        exportData: (): { subscribe: Readable<ExportedMeetingData>['subscribe'] } => {
            return {
                subscribe: derived(
                    { subscribe },
                    ($state): ExportedMeetingData => ({
                        id: $state.meetingId,
                        type: $state.meetingType,
                        name: $state.meetingName,
                        duration: $state.elapsedTime,
                        formattedDuration: $state.formattedTime,
                        entries: $state.timeEntries,
                        summary: $state.summaryData,
                        startedAt: new Date().toISOString()
                    })
                ).subscribe
            };
        }
    };
}

export const meeting = createMeetingStore();
