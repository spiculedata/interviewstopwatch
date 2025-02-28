<!-- src/routes/meeting/[type]/+page.svelte -->
<script lang="ts">
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { saveMeetingData } from '$lib/meetingService';
    import { tick } from 'svelte';

    // Types
    type AnnotationType = {
        id: string;
        icon: string;
        label: string;
        color: string;
    };

    type TimeEntry = {
        id: string;
        type: string;
        videoTime: number;
        videoTimeFormatted: string;
        stopwatchTime: string;
        elapsedTimeMs: number;
        timestamp: number;
        description: string;
    };

    type TimelineMarker = TimeEntry & {
        position: number;
        color: string;
        icon: string;
    };

    type SummaryData = {
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

    // Constants and configuration
    const ANNOTATION_TYPES: AnnotationType[] = [
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

    // Route and URL parameters
    $: meetingType = $page.params.type;
    $: customName = $page.url.searchParams.get('name');
    $: meetingId = $page.url.searchParams.get('id') || generateMeetingId();

    // Meeting type name mapping
    const meetingNames: {[key: string]: string} = {
        'ux': 'UX Research Interview',
        'client': 'Client Meeting',
        'stakeholder': 'Stakeholder Meeting',
        'team': 'Team Meeting',
        'custom': customName || 'Custom Meeting'
    };
    $: meetingName = meetingNames[meetingType] || 'Meeting';

    // State management
    let customButtons: AnnotationType[] = [];
    let currentPointType: string | null = null;
    let timeEntries: TimeEntry[] = [];
    let timelineMarkers: TimelineMarker[] = [];
    let timelineKey = 0;

    // Panel state
    let isRightPanelOpen = false;

    // Summary data
    let summaryData: SummaryData = {
        userInfo: 0,
        questions: 0,
        answers: 0,
        painPoints: 0,
        ambivalent: 0,
        successPoints: 0,
        featureIdeas: 0,
        notes: 0,
        other: 0
    };

    // Video state
    let videoElement: HTMLVideoElement;
    let videoFile: File | null = null;
    let videoURL: string | null = null;
    let isPlaying = false;
    let currentTime = 0;
    let duration = 0;
    let seekPosition = 0;
    let isDragging = false;
    let animationFrameId: number | null = null;

    // Timer state
    let isRunning = false;
    let startTime: number | null = null;
    let elapsedTime = 0;
    let formattedTime = "00:00";
    let timerInterval: ReturnType<typeof setInterval> | null = null;
    let maxRecordedElapsedTime = 0;

    // Timeline positioning
    let arePositionsLocked = false;
    let lockedPositions: {[key: string]: number} = {};

    // ========== Timer Functions ==========

    function startTimer(): void {
        if (!isRunning) {
            isRunning = true;
            startTime = Date.now() - elapsedTime;
            timerInterval = setInterval(updateTimer, 100); // 100ms for smoother updates
        }
    }

    function stopTimer(): void {
        if (isRunning) {
            isRunning = false;
            if (timerInterval) {
                clearInterval(timerInterval);
            }
            maxRecordedElapsedTime = Math.max(maxRecordedElapsedTime, elapsedTime);
        }
    }

    function updateTimer(): void {
        if (startTime === null) return;

        elapsedTime = Date.now() - startTime;
        const minutes = Math.floor(elapsedTime / 60000);
        const seconds = Math.floor((elapsedTime % 60000) / 1000);
        formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        // Track the maximum elapsed time
        maxRecordedElapsedTime = Math.max(maxRecordedElapsedTime, elapsedTime);

        // Only update timeline when necessary
        updateTimelineMarkers();
    }

    function getStopwatchTime(): string {
        return formattedTime;
    }

    // ========== Video Player Functions ==========

    function togglePlay(): void {
        if (videoElement) {
            if (videoElement.paused) {
                // Lock positions when play starts if needed
                lockPositionsIfNeeded();

                videoElement.play()
                    .then(() => {
                        isPlaying = true;
                    })
                    .catch(err => {
                        console.error('Error playing video:', err);
                        isPlaying = false;
                    });
            } else {
                videoElement.pause();
                isPlaying = false;
            }
        }
    }

    function lockPositionsIfNeeded(): void {
        if (!arePositionsLocked && videoElement && videoElement.duration > 0) {
            timeEntries.forEach(entry => {
                if (lockedPositions[entry.id] === undefined) {
                    const position = getTimelinePosition(entry);
                    lockedPositions[entry.id] = position;
                }
            });
            arePositionsLocked = true;
        }
    }

    function formatTime(seconds: number): string {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    function getVideoTime(): string {
        if (videoElement) {
            return formatTime(videoElement.currentTime);
        }
        return "00:00";
    }

    function startVideoProgressUpdates(): void {
        // Cancel any existing animation frame
        stopVideoProgressUpdates();

        function updateVideoProgress(): void {
            if (videoElement && videoElement.duration) {
                // Update seek position
                seekPosition = videoElement.currentTime / videoElement.duration;
            }

            // Continue the loop
            animationFrameId = requestAnimationFrame(updateVideoProgress);
        }

        // Start the loop
        animationFrameId = requestAnimationFrame(updateVideoProgress);
    }

    function stopVideoProgressUpdates(): void {
        if (animationFrameId !== null) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    }

    function handleFileUpload(event: Event): void {
        const target = event.target as HTMLInputElement;
        const files = target.files;

        if (!files || files.length === 0) return;

        const file = files[0];
        if (file && file.type.startsWith('video/')) {
            // Clean up previous video
            if (videoURL) {
                URL.revokeObjectURL(videoURL);
            }

            // Load the new video
            videoFile = file;
            videoURL = URL.createObjectURL(file);

            // Pause any playing video
            if (videoElement) {
                videoElement.pause();
                isPlaying = false;
            }

            // Reset position locks for new video
            arePositionsLocked = false;
            lockedPositions = {};

            // Small delay to ensure DOM is ready
            setTimeout(() => {
                if (videoElement) {
                    setupVideoListeners();
                    videoElement.src = videoURL;
                }
            }, 100);
        }
    }

    // ========== Timeline and Seek Functions ==========

    function handleSeekStart(event: MouseEvent): void {
        isDragging = true;
        handleSeekMove(event);
    }

    function handleSeekMove(event: MouseEvent): void {
        if (!isDragging) return;

        const timeline = event.currentTarget as HTMLElement;
        const rect = timeline.getBoundingClientRect();
        const position = (event.clientX - rect.left) / rect.width;
        seekPosition = Math.min(Math.max(position, 0), 1);

        if (videoElement && videoElement.duration) {
            currentTime = seekPosition * videoElement.duration;
        }
    }

    function handleSeekEnd(): void {
        if (!isDragging) return;

        isDragging = false;
        if (videoElement && videoElement.duration) {
            videoElement.currentTime = seekPosition * videoElement.duration;
            currentTime = videoElement.currentTime;
        }
    }

    function handleTimelineClick(event: MouseEvent): void {
        const timeline = event.currentTarget as HTMLElement;
        const rect = timeline.getBoundingClientRect();
        const clickPosition = (event.clientX - rect.left) / rect.width;

        if (videoElement && videoElement.duration) {
            videoElement.currentTime = clickPosition * videoElement.duration;
            currentTime = videoElement.currentTime;
        }
    }

    function jumpToVideoTime(time: number): void {
        if (videoElement && !isNaN(time)) {
            videoElement.currentTime = time;
            if (videoElement.paused) {
                videoElement.play().catch(err => console.error('Error playing video:', err));
            }
        }
    }

    // ========== Timeline Marker Management ==========

    // Update timeline markers - this is a key optimization point
    function updateTimelineMarkers(): void {
        // Calculate and update all marker positions
        timelineMarkers = timeEntries.map(entry => ({
            ...entry,
            position: getTimelinePosition(entry),
            color: getIconColor(entry.type),
            icon: getIcon(entry.type)
        }));

        // Force update by incrementing key
        timelineKey++;
    }

    function getTimelinePosition(entry: TimeEntry): number {
        // If positions are locked, use the locked position
        if (arePositionsLocked && lockedPositions[entry.id] !== undefined) {
            return lockedPositions[entry.id];
        }

        let position = 0;

        // Special case for entries with zero elapsed time
        if (entry.elapsedTimeMs === 0) {
            const entryIndex = timeEntries.findIndex(e => e.id === entry.id);
            if (entryIndex >= 0) {
                const zeroTimeEntries = timeEntries.filter(e => e.elapsedTimeMs === 0).length;
                const spacing = 5; // Smaller spacing to keep at start
                position = 2 + (entryIndex % zeroTimeEntries) * spacing;
            } else {
                position = 2;
            }
        }
        // For entries with elapsed time, calculate the position properly
        else if (entry.elapsedTimeMs > 0) {
            const maxTimeToUse = Math.max(maxRecordedElapsedTime, elapsedTime);

            if (videoElement && videoElement.duration > 0) {
                // Scale elapsed time relative to video duration
                const scaledPosition = (entry.elapsedTimeMs / maxTimeToUse) *
                    (maxTimeToUse / (videoElement.duration * 1000)) * 100;

                position = scaledPosition;
            } else {
                // If no video, distribute based on elapsed time
                position = (entry.elapsedTimeMs / maxTimeToUse) * 100;
            }
        }

        // Ensure position is within bounds
        return Math.min(98, Math.max(2, position));
    }

    function scaleTimelinePositions(): void {
        if (videoElement && videoElement.duration > 0) {
            // Get all markers sorted by elapsed time
            const sortedEntries = [...timeEntries].sort((a, b) => a.elapsedTimeMs - b.elapsedTimeMs);

            // Scale positions proportionally to video duration
            sortedEntries.forEach(entry => {
                const relativeTime = entry.elapsedTimeMs / elapsedTime;
                const videoTime = relativeTime * videoElement.duration;
                const position = (videoTime / videoElement.duration) * 100;

                // Store the scaled position
                lockedPositions[entry.id] = Math.min(98, Math.max(2, position));
            });

            // Lock positions
            arePositionsLocked = true;

            // Update the display
            updateTimelineMarkers();
        }
    }

    // ========== Entry Management ==========

    function recordPoint(type: string): void {
        if (!isRunning && type !== 'end') {
            startTimer();
        }

        if (type === 'end') {
            stopTimer();
        } else {
            // Capture current times
            const capturedVideoTime = videoElement ? videoElement.currentTime : 0;
            const capturedVideoTimeFormatted = videoElement ? formatTime(capturedVideoTime) : "00:00";

            // Create the new entry
            const newEntry: TimeEntry = {
                id: `entry-${Date.now()}`,
                type,
                videoTime: capturedVideoTime,
                videoTimeFormatted: capturedVideoTimeFormatted,
                stopwatchTime: getStopwatchTime(),
                elapsedTimeMs: elapsedTime,
                timestamp: Date.now(),
                description: ""
            };

            // Update summary count
            if (type in summaryData) {
                summaryData[type] += 1;
            }

            // Add to time entries
            timeEntries = [...timeEntries, newEntry];

            // Calculate position for this new entry
            if (videoElement && videoElement.duration > 0) {
                const position = (capturedVideoTime / videoElement.duration) * 100;
                lockedPositions[newEntry.id] = Math.min(98, Math.max(2, position));
            }

            // Update the timeline markers
            updateTimelineMarkers();
        }
    }

    function updateEntryDescription(id: string, description: string): void {
        timeEntries = timeEntries.map(entry =>
            entry.id === id ? {...entry, description} : entry
        );
    }

    function removeEntry(id: string): void {
        // Find entry before removal to update summary
        const entryToRemove = timeEntries.find(entry => entry.id === id);

        // Remove entry from the list
        timeEntries = timeEntries.filter(entry => entry.id !== id);

        // Update summary count
        if (entryToRemove && entryToRemove.type in summaryData) {
            summaryData[entryToRemove.type] -= 1;
        }

        // Update timeline markers
        updateTimelineMarkers();
    }

    // ========== UI and Utility Functions ==========

    function createCustomButton(): void {
        const buttonName = prompt("Enter button name");
        if (buttonName) {
            customButtons = [...customButtons, {
                id: `custom-${Date.now()}`,
                icon: '⭐',
                label: buttonName,
                color: '#f0f4c3'
            }];
        }
    }

    function toggleRightPanel(): void {
        isRightPanelOpen = !isRightPanelOpen;
    }

    function generateMeetingId(): string {
        return `meeting-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    }

    function getIconColor(type: string): string {
        const annotationType = [...ANNOTATION_TYPES, ...customButtons].find(t => t.id === type);
        return annotationType ? annotationType.color : '#e0e0e0';
    }

    function getIcon(type: string): string {
        const annotationType = [...ANNOTATION_TYPES, ...customButtons].find(t => t.id === type);
        return annotationType ? annotationType.icon : '•';
    }

    function getTypeLabel(type: string): string {
        const annotationType = ANNOTATION_TYPES.find(t => t.id === type);
        return annotationType ? annotationType.label : type;
    }

    async function exportData(): Promise<void> {
        const exportData = {
            id: meetingId,
            type: meetingType,
            name: meetingName,
            duration: elapsedTime,
            formattedDuration: formattedTime,
            entries: timeEntries,
            summary: summaryData,
            startedAt: new Date().toISOString()
        };

        // Create JSON blob and download
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${meetingName.replace(/\s/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // ========== Event Setup ==========

    function setupVideoListeners(): void {
        if (!videoElement) return;

        // Remove existing listeners first to prevent duplicates
        videoElement.removeEventListener('timeupdate', handleTimeUpdate);
        videoElement.removeEventListener('durationchange', handleDurationChange);
        videoElement.removeEventListener('loadedmetadata', handleMetadataLoaded);
        videoElement.removeEventListener('play', handlePlay);
        videoElement.removeEventListener('pause', handlePause);
        videoElement.removeEventListener('ended', handleEnded);

        // Add event listeners
        videoElement.addEventListener('timeupdate', handleTimeUpdate);
        videoElement.addEventListener('durationchange', handleDurationChange);
        videoElement.addEventListener('loadedmetadata', handleMetadataLoaded);
        videoElement.addEventListener('play', handlePlay);
        videoElement.addEventListener('pause', handlePause);
        videoElement.addEventListener('ended', handleEnded);
    }

    // Event handlers for video
    function handleTimeUpdate(): void {
        currentTime = videoElement.currentTime;
    }

    function handleDurationChange(): void {
        duration = videoElement.duration;
    }

    function handleMetadataLoaded(): void {
        duration = videoElement.duration;
        updateTimelineMarkers();
    }

    function handlePlay(): void {
        isPlaying = true;
        startVideoProgressUpdates();
        lockPositionsIfNeeded();
    }

    function handlePause(): void {
        isPlaying = false;
        stopVideoProgressUpdates();
    }

    function handleEnded(): void {
        isPlaying = false;
        stopVideoProgressUpdates();
    }

    // Setup on component mount
    onMount(() => {
        // Set up video event listeners if video element exists
        if (videoElement) {
            setupVideoListeners();
        }

        // Add window event listeners for drag events
        window.addEventListener('mousemove', handleSeekMove);
        window.addEventListener('mouseup', handleSeekEnd);

        // Clean up on unmount
        return () => {
            if (timerInterval) clearInterval(timerInterval);
            if (videoURL) URL.revokeObjectURL(videoURL);
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            window.removeEventListener('mousemove', handleSeekMove);
            window.removeEventListener('mouseup', handleSeekEnd);
        };
    });
</script>

<div class="meeting-container" style="min-height: 100vh; background-color: #f5f5f5; padding: 1rem;">
    <div class="meeting-panels" style="display: flex; max-width: 1200px; margin: 0 auto; height: calc(100vh - 2rem); border: 2px solid #333;">
        <!-- Left panel (always visible) -->
        <div class="left-panel" style="flex: {isRightPanelOpen ? '1' : '1'}; background-color: white; position: relative; overflow-y: auto; border-right: {isRightPanelOpen ? '2px solid #333' : 'none'};">
            <!-- Dot pattern overlay -->
            <div style="position: absolute; inset: 0; background-image: radial-gradient(#e0e0e0 1px, transparent 1px); background-size: 12px 12px; opacity: 0.5; pointer-events: none;"></div>

            <div style="position: relative; z-index: 1; padding: 1.5rem;">
                <!-- Header section -->
                <h2 style="font-family: 'Comic Sans MS', cursive; margin-top: 0;">Stopwatch</h2>

                <!-- Meeting type selector -->
                <div style="margin-bottom: 1.5rem;">
                    <div style="margin-bottom: 0.5rem; font-family: 'Comic Sans MS', cursive;">What would you like to do</div>
                    <div class="meeting-type-selector" style="margin-bottom: 0.5rem;">
                        <select style="width: 100%; padding: 0.5rem; font-family: 'Comic Sans MS', cursive; border: 2px solid #ccc; background-color: #f0f0f0;">
                            <option>Start a new annotate ▼</option>
                        </select>
                    </div>

                    <div class="meeting-type-selector" style="margin-bottom: 0.5rem;">
                        <select
                                style="width: 100%; padding: 0.5rem; font-family: 'Comic Sans MS', cursive; border: 2px solid #ccc; background-color: #f0f0f0;"
                                bind:value={meetingType}
                        >
                            <option value="ux">UX Research Interview ▼</option>
                            <option value="client">Client Meeting ▼</option>
                            <option value="stakeholder">Stakeholder Meeting ▼</option>
                            <option value="team">Team Meeting ▼</option>
                            <option value="custom">Custom Meeting ▼</option>
                        </select>
                    </div>

                    <div style="font-size: 0.8rem; cursor: pointer; color: #666; text-decoration: underline;" on:click={createCustomButton}>
                        Create a custom button set
                    </div>
                </div>

                <!-- Timer controls -->
                <div style="display: flex; gap: 1rem; margin-bottom: 2rem;">
                    <button
                            style="flex: 1; font-family: 'Comic Sans MS', cursive; padding: 1rem; border: 2px solid #333; background-color: white; cursor: pointer; {isRunning ? 'opacity: 0.7;' : ''}"
                            on:click={startTimer}
                            disabled={isRunning}
                    >
                        START TIMER
                    </button>

                    <button
                            style="flex: 1; font-family: 'Comic Sans MS', cursive; padding: 1rem; border: 2px solid #333; background-color: white; cursor: pointer;"
                            on:click={() => recordPoint('end')}
                    >
                        END TIMER
                    </button>
                </div>

                <div style="text-align: right; margin-bottom: 0.5rem; font-family: 'Comic Sans MS', cursive; font-size: 0.8rem;">
                    ✏️ Edit Buttons
                </div>

                <!-- Annotation buttons grid -->
                <div class="annotation-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 2rem;">
                    {#each ANNOTATION_TYPES as type}
                        <div class="annotation-button" style="display: flex; flex-direction: column; align-items: center;">
                            <button
                                    style="width: 60px; height: 60px; border-radius: 50%; border: 2px solid #333; display: flex; align-items: center; justify-content: center; background-color: white; cursor: pointer; margin-bottom: 0.5rem; {currentPointType === type.id ? `background-color: ${type.color};` : ''}"
                                    on:click={() => recordPoint(type.id)}
                            >
                                <span style="font-size: 1.5rem;">{type.icon}</span>
                            </button>
                            <span style="font-family: 'Comic Sans MS', cursive; font-size: 0.8rem; text-align: center;">{type.label}</span>
                            <span style="font-family: 'Comic Sans MS', cursive; font-size: 0.7rem; color: #999;">0{summaryData[type.id] || 0}</span>
                        </div>
                    {/each}

                    {#each customButtons as button}
                        <div class="annotation-button" style="display: flex; flex-direction: column; align-items: center;">
                            <button
                                    style="width: 60px; height: 60px; border-radius: 50%; border: 2px solid #333; display: flex; align-items: center; justify-content: center; background-color: white; cursor: pointer; margin-bottom: 0.5rem; {currentPointType === button.id ? `background-color: ${button.color};` : ''}"
                                    on:click={() => recordPoint(button.id)}
                            >
                                <span style="font-size: 1.5rem;">{button.icon}</span>
                            </button>
                            <span style="font-family: 'Comic Sans MS', cursive; font-size: 0.8rem; text-align: center;">{button.label}</span>
                        </div>
                    {/each}
                </div>

                <!-- Timeline with timestamps -->
                <div style="margin-bottom: 2rem;">
                    <div class="timeline" style="position: relative; height: 30px; background-color: #f0f0f0; border-radius: 15px; margin-bottom: 0.5rem; overflow: hidden;">
                        {#each timelineMarkers as marker (marker.id + timelineKey)}
                            <div
                                    class="timeline-marker"
                                    style="position: absolute; top: 50%; transform: translateY(-50%); left: {marker.position}%; width: 20px; height: 20px; border-radius: 50%; background-color: {marker.color}; display: flex; align-items: center; justify-content: center; font-size: 10px; z-index: 2; cursor: pointer;"
                                    title="{getTypeLabel(marker.type)} at {marker.videoTimeFormatted}"
                                    on:click={() => jumpToVideoTime(marker.videoTime)}
                            >
                                {marker.icon}
                            </div>
                        {/each}

                        <!-- Progress bar -->
                        <div style="position: absolute; bottom: 0; left: 0; height: 100%; width: {isRunning && videoElement ? (videoElement.currentTime / videoElement.duration) * 100 : 0}%; background-color: #ddd; z-index: 1;"></div>
                    </div>

                    <!-- Timeline timestamps -->
                    <div style="display: flex; justify-content: space-between; font-family: 'Comic Sans MS', cursive; font-size: 0.9rem; color: #555;">
                        <div>0:00</div>
                        <div>{formattedTime}</div>
                    </div>
                </div>

                <div style="text-align: right; margin-bottom: 1rem;">
                    <button
                            style="font-family: 'Comic Sans MS', cursive; padding: 0.5rem; border: none; background-color: transparent; cursor: pointer; text-decoration: underline;"
                            on:click={toggleRightPanel}
                    >
                        {isRightPanelOpen ? 'Collapse ◂' : 'Expand ▸'}
                    </button>
                </div>

                <!-- Export button -->
                <div style="margin-top: 2rem;">
                    <button
                            on:click={exportData}
                            style="width: 100%; font-family: 'Comic Sans MS', cursive; padding: 1rem; border: 2px solid #333; background-color: white; cursor: pointer; font-size: 1.2rem; text-transform: uppercase;"
                    >
                        EXPORT
                    </button>
                </div>
            </div>
        </div>

        <!-- Right panel (conditionally visible) -->
        {#if isRightPanelOpen}
            <div class="right-panel" style="flex: 1; background-color: white; position: relative; overflow-y: auto;">
                <!-- Dot pattern overlay -->
                <div style="position: absolute; inset: 0; background-image: radial-gradient(#e0e0e0 1px, transparent 1px); background-size: 12px 12px; opacity: 0.5; pointer-events: none;"></div>

                <div style="position: relative; z-index: 1; padding: 1.5rem;">
                    <!-- Video section -->
                    <div style="margin-bottom: 2rem; display: flex; flex-direction: column; width: 100%;">
                        <!-- Video Container -->
                        <div style="width: 100%; aspect-ratio: 16/9; background-color: #000; position: relative; border: 2px solid #ccc; overflow: hidden; margin-bottom: 0.5rem;">
                            {#if videoURL}
                                <!-- Hidden native video element (no controls) -->
                                <video
                                        bind:this={videoElement}
                                        src={videoURL}
                                        style="width: 100%; height: 100%; object-fit: contain;"
                                        on:click={togglePlay}
                                ></video>

                                <!-- Play button overlay (shows when paused) -->
                                {#if !isPlaying}
                                    <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background-color: rgba(0, 0, 0, 0.3); cursor: pointer;" on:click={togglePlay}>
                                        <div style="width: 80px; height: 80px; border-radius: 50%; background-color: rgba(255, 255, 255, 0.8); display: flex; align-items: center; justify-content: center;">
                                            <span style="margin-left: 5px; font-size: 40px;">▶</span>
                                        </div>
                                    </div>
                                {/if}
                            {:else}
                                <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-family: 'Comic Sans MS', cursive; font-size: 2rem; color: #999;">
                                    VIDEO
                                </div>
                            {/if}
                        </div>

                        <!-- Custom Video Controls -->
                        <div style="width: 100%; display: flex; flex-direction: column; gap: 0.5rem;">
                            <!-- Playback timeline -->
                            <div class="video-timeline"
                                 style="position: relative; height: 40px; background-color: #f0f0f0; border-radius: 20px; overflow: hidden; cursor: pointer;"
                                 on:mousedown={handleSeekStart}
                                 on:click={handleTimelineClick}>

                                <!-- Progress bar -->
                                <div style="position: absolute; left: 0; top: 0; height: 100%; width: {seekPosition * 100}%; background-color: #ddd; transition: width 0.1s linear;"></div>

                                <!-- Current position indicator -->
                                <div style="position: absolute; left: {seekPosition * 100}%; top: 50%; transform: translate(-50%, -50%); width: 16px; height: 16px; border-radius: 50%; background-color: #333; z-index: 3;"></div>

                                <!-- Marker icons on timeline - ensure they appear on top -->
                                {#each timelineMarkers as marker (marker.id)}
                                    <div
                                            class="video-marker"
                                            style="position: absolute; top: 50%; transform: translateY(-50%);
                  left: {marker.position}%;
                  width: 24px; height: 24px;
                  border-radius: 50%;
                  background-color: {marker.color};
                  display: flex; align-items: center; justify-content: center;
                  font-size: 12px; z-index: 5; cursor: pointer;
                  box-shadow: 0 0 0 2px white;"
                                            title="{getTypeLabel(marker.type)} at {marker.videoTimeFormatted}"
                                            on:click|stopPropagation={() => jumpToVideoTime(marker.videoTime)}
                                    >
                                        {marker.icon}
                                    </div>
                                {/each}
                            </div>

                            <!-- Controls and time display -->
                            <div style="display: flex; align-items: center; justify-content: space-between; font-family: 'Comic Sans MS', cursive;">
                                <!-- Play/Pause button -->
                                <button
                                        style="width: 40px; height: 40px; border-radius: 50%; border: 2px solid #333; background-color: white; display: flex; align-items: center; justify-content: center; cursor: pointer;"
                                        on:click={togglePlay}
                                >
                                    {isPlaying ? '❚❚' : '▶'}
                                </button>

                                <!-- Time display -->
                                <div style="font-family: 'Comic Sans MS', cursive; font-size: 0.9rem;">
                                    {formatTime(currentTime)} / {formatTime(duration || 0)}
                                </div>

                                <!-- Volume control (placeholder) -->
                                <div style="display: flex; align-items: center; gap: 0.5rem;">
                                    <span>🔊</span>
                                    <div style="width: 60px; height: 8px; background-color: #ddd; border-radius: 4px; overflow: hidden;">
                                        <div style="width: 80%; height: 100%; background-color: #333;"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Video upload button -->
                        <div style="display: flex; justify-content: center; margin-top: 1rem;">
                            <input
                                    type="file"
                                    id="video-upload"
                                    accept="video/*"
                                    on:change={handleFileUpload}
                                    style="display: none;"
                            />
                            <label
                                    for="video-upload"
                                    style="cursor: pointer; font-family: 'Comic Sans MS', cursive; padding: 0.5rem 1rem; border: 1px solid #333; background-color: white;"
                            >
                                {videoURL ? 'Change Video' : 'Upload Video'}
                            </label>
                        </div>
                    </div>

                    <h3 style="font-family: 'Comic Sans MS', cursive; margin-top: 0;">POINTS OF INTEREST</h3>

                    <!-- Time entries list -->
                    <div class="time-entries">
                        {#each timeEntries as entry}
                            <div class="entry-row" style="display: flex; border-bottom: 1px solid #eee; padding: 0.75rem 0; font-family: 'Comic Sans MS', cursive;">
                                <div style="width: 70px; text-align: right; padding-right: 1rem;">
                                    {entry.stopwatchTime}
                                </div>
                                <div style="flex-grow: 1;">
                                    <div style="display: flex; align-items: center; justify-content: space-between;">
                                        <div style="display: flex; align-items: center;">
                                        <span style="margin-right: 0.5rem; display: inline-block; width: 20px; height: 20px; border-radius: 50%; background-color: {getIconColor(entry.type)}; text-align: center; line-height: 20px; font-size: 12px;">
                                            {getIcon(entry.type)}
                                        </span>
                                            <span>
                                            {getTypeLabel(entry.type)}
                                        </span>
                                        </div>
                                        <button
                                                style="background: none; border: none; color: #999; cursor: pointer; font-size: 0.9rem;"
                                                on:click={() => removeEntry(entry.id)}
                                                title="Remove this entry"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    <input
                                            type="text"
                                            placeholder="Add description..."
                                            value={entry.description}
                                            on:input={(e) => updateEntryDescription(entry.id, (e.target as HTMLInputElement).value)}
                                            style="width: 100%; border: none; border-bottom: 1px dashed #ccc; font-family: inherit; background: transparent; margin-top: 0.25rem; padding: 0.25rem 0;"
                                    />
                                </div>
                            </div>
                        {/each}

                        {#if timeEntries.length === 0}
                            <div style="padding: 2rem 0; text-align: center; color: #999; font-family: 'Comic Sans MS', cursive;">
                                No entries yet. Use the annotation buttons to mark important moments.
                            </div>
                        {/if}
                    </div>
                </div>
            </div>
        {/if}
    </div>
</div>
