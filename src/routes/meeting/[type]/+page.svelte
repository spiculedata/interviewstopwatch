<!-- src/routes/meeting/[type]/+page.svelte -->
<script>
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { saveMeetingData } from '$lib/meetingService';

    // Get the meeting type from the route parameter
    $: meetingType = $page.params.type;
    $: customName = $page.url.searchParams.get('name');

    // Map of meeting type to full name
    const meetingNames = {
        'ux': 'UX Meeting',
        'client': 'Client Meeting',
        'stakeholder': 'Stakeholder Meeting',
        'team': 'Team Meeting',
        'custom': customName || 'Custom Meeting'
    };

    // Get the display name based on the meeting type
    $: meetingName = meetingNames[meetingType] || 'Meeting';

    let meetingId = '';
    let isSaving = false;
    let saveError = null;

    // Timer functionality
    let isRunning = false;
    let startTime = null;
    let elapsedTime = 0;
    let formattedTime = "00:00";
    let timerInterval;
    let timeEntries = [];

    // Summary data
    let summaryData = {
        painPoints: 0,
        positivePoints: 0,
        bugs: 0,
        paymentInfo: 0
    };

    // Current point type
    let currentPointType = null;

    function startTimer() {
        if (!isRunning) {
            isRunning = true;
            startTime = Date.now() - elapsedTime;
            timerInterval = setInterval(updateTimer, 1000);
        }
    }

    function stopTimer() {
        if (isRunning) {
            isRunning = false;
            clearInterval(timerInterval);
        }
    }

    function updateTimer() {
        elapsedTime = Date.now() - startTime;
        const minutes = Math.floor(elapsedTime / 60000);
        const seconds = Math.floor((elapsedTime % 60000) / 1000);
        formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    function getStopwatchTime() {
        return formattedTime;
    }

    function getUTCTime() {
        const now = new Date();
        const hours = now.getUTCHours().toString().padStart(2, '0');
        const minutes = now.getUTCMinutes().toString().padStart(2, '0');
        const seconds = now.getUTCSeconds().toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }

    function recordPoint(type) {
        if (!isRunning && type !== 'end') {
            startTimer();
        }

        currentPointType = type;

        if (type === 'end') {
            stopTimer();
        } else {
            const newEntry = {
                type,
                utcTime: getUTCTime(),
                stopwatchTime: getStopwatchTime(),
                elapsedTime: formattedTime
            };

            timeEntries = [newEntry, ...timeEntries];

            // Update summary data
            if (type === 'pain') {
                summaryData.painPoints += 1;
            } else if (type === 'happy') {
                summaryData.positivePoints += 1;
            } else if (type === 'bug') {
                summaryData.bugs += 1;
            } else if (type === 'payment') {
                summaryData.paymentInfo += 1;
            }
        }
    }

    // Generate a unique meeting ID if not provided
    onMount(() => {
        meetingId = $page.url.searchParams.get('id') || generateMeetingId();

        // Initialize
        return () => {
            if (timerInterval) clearInterval(timerInterval);
        };
    });

    function generateMeetingId() {
        return `meeting-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    }

    async function saveToStateStore() {
        isSaving = true;
        saveError = null;

        try {
            // Prepare meeting data for storage
            const meetingData = {
                id: meetingId,
                type: meetingType,
                name: meetingName,
                customName: customName,
                duration: elapsedTime,
                formattedDuration: formattedTime,
                entries: timeEntries,
                summary: summaryData,
                startedAt: new Date().toISOString(),
                utcTime: getUTCTime()
            };

            // Save to API which connects to DAPR state store
            const result = await saveMeetingData(meetingData);

            if (result.success) {
                console.log('Meeting data saved successfully to DAPR');
                // Navigate to summary page with the meeting ID
                goto(`/meeting/${meetingType}/summary?id=${meetingId}`);
            } else {
                saveError = result.message;
                console.error('Failed to save meeting data:', result.message);
            }
        } catch (error) {
            saveError = error.message || 'An unexpected error occurred';
            console.error('Error saving meeting data:', error);
        } finally {
            isSaving = false;
        }
    }
</script>

<div style="min-height: 100vh; background-color: #f0f0f0; padding: 1rem;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white; border: 2px solid #333; position: relative;">
        <!-- Dot pattern overlay -->
        <div style="position: absolute; inset: 0; background-image: radial-gradient(#e0e0e0 1px, transparent 1px); background-size: 12px 12px; opacity: 0.5; pointer-events: none;"></div>

        <div style="position: relative; z-index: 1; padding: 1rem;">
            <!-- Header section -->
            <div style="border-bottom: 1px solid #333; padding-bottom: 0.5rem; margin-bottom: 1rem;">
                <div style="font-family: 'Comic Sans MS', cursive; font-size: 1.25rem; font-weight: bold; display: flex; align-items: center;">
                    <span style="margin-right: 0.5rem;">▶</span> <span contenteditable="true" style="min-width: 150px; border-bottom: 1px dashed #999;">{meetingName}</span>
                </div>
            </div>

            <!-- Controls section -->
            <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
                <button
                        style="font-family: 'Comic Sans MS', cursive; padding: 0.5rem 1rem; border: 1px solid #333; background-color: white; cursor: pointer; {isRunning ? 'text-decoration: line-through;' : ''}"
                        on:click={startTimer}
                        disabled={isRunning}
                >
                    <span style="margin-right: 0.25rem;">▶</span> START MEETING
                </button>

                <div style="display: flex; align-items: center; font-family: 'Comic Sans MS', cursive; font-size: 1.2rem; font-weight: bold;">
                    {formattedTime}
                </div>

                <button
                        style="font-family: 'Comic Sans MS', cursive; padding: 0.5rem 1rem; border: 1px solid #333; background-color: white; cursor: pointer;"
                        on:click={() => recordPoint('end')}
                >
                    END
                </button>
            </div>

            <!-- Event tracking buttons -->
            <div style="display: flex; justify-content: space-between; margin-bottom: 2rem; border-bottom: 1px solid #ccc; padding-bottom: 1rem;">
                <!-- Happy button -->
                <div style="display: flex; flex-direction: column; align-items: center;">
                    <button
                            style="width: 40px; height: 40px; border-radius: 50%; border: 2px solid #333; display: flex; align-items: center; justify-content: center; background-color: white; cursor: pointer; margin-bottom: 0.5rem; {currentPointType === 'happy' ? 'background-color: #e6f7ff;' : ''}"
                            on:click={() => recordPoint('happy')}
                    >
                        <span style="font-size: 1.2rem;">:)</span>
                    </button>
                    <span style="font-family: 'Comic Sans MS', cursive; font-size: 0.8rem;">Happy</span>
                </div>

                <!-- Pain Point button -->
                <div style="display: flex; flex-direction: column; align-items: center;">
                    <button
                            style="width: 40px; height: 40px; border-radius: 50%; border: 2px solid #333; display: flex; align-items: center; justify-content: center; background-color: white; cursor: pointer; margin-bottom: 0.5rem; {currentPointType === 'pain' ? 'background-color: #ffe6e6;' : ''}"
                            on:click={() => recordPoint('pain')}
                    >
                        <span style="font-size: 1.2rem;">⚠</span>
                    </button>
                    <span style="font-family: 'Comic Sans MS', cursive; font-size: 0.8rem;">Pain Point</span>
                </div>

                <!-- Bug button -->
                <div style="display: flex; flex-direction: column; align-items: center;">
                    <button
                            style="width: 40px; height: 40px; border-radius: 50%; border: 2px solid #333; display: flex; align-items: center; justify-content: center; background-color: white; cursor: pointer; margin-bottom: 0.5rem; {currentPointType === 'bug' ? 'background-color: #fff9c4;' : ''}"
                            on:click={() => recordPoint('bug')}
                    >
                        <span style="font-size: 1.2rem;">🐞</span>
                    </button>
                    <span style="font-family: 'Comic Sans MS', cursive; font-size: 0.8rem;">Bug</span>
                </div>

                <!-- Payment button -->
                <div style="display: flex; flex-direction: column; align-items: center;">
                    <button
                            style="width: 40px; height: 40px; border-radius: 50%; border: 2px solid #333; display: flex; align-items: center; justify-content: center; background-color: white; cursor: pointer; margin-bottom: 0.5rem; {currentPointType === 'payment' ? 'background-color: #e8f5e9;' : ''}"
                            on:click={() => recordPoint('payment')}
                    >
                        <span style="font-size: 1rem;">💰</span>
                    </button>
                    <span style="font-family: 'Comic Sans MS', cursive; font-size: 0.8rem;">Payment</span>
                </div>
            </div>

            <!-- Time entries list -->
            <div>
                {#each timeEntries as entry, i}
                    <div style="display: flex; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid #eee; font-family: 'Comic Sans MS', cursive; {entry.type === 'pain' ? 'color: #d32f2f;' : entry.type === 'happy' ? 'color: #388e3c;' : ''}">
                        <div>
                            {entry.type === 'pain' ? 'Pain Point' : entry.type === 'happy' ? 'Happy Point' : entry.type === 'bug' ? 'Bug' : entry.type === 'payment' ? 'Payment Info' : 'Note'}
                            {#if entry.type === 'pain'}
                                <input type="text" placeholder="Enter description..." style="border: none; border-bottom: 1px dashed #ccc; margin-left: 0.5rem; font-family: inherit; background: transparent;">
                            {/if}
                        </div>
                        <div style="text-align: right; display: flex; flex-direction: column;">
                            <span>SW: {entry.stopwatchTime}</span>
                            <span style="font-size: 0.8rem; color: #666;">UTC: {entry.utcTime}</span>
                        </div>
                    </div>
                {/each}

                {#if timeEntries.length === 0}
                    <div style="padding: 2rem 0; text-align: center; color: #999; font-family: 'Comic Sans MS', cursive;">
                        No entries yet. Click an emotion button to record a point.
                    </div>
                {/if}

                <!-- Empty rows for spacing -->
                <div style="height: 50px; border-bottom: 1px solid #eee;"></div>
                <div style="height: 50px; border-bottom: 1px solid #eee;"></div>
            </div>

            <!-- Footer navigation -->
            <div style="margin-top: 2rem; display: flex; justify-content: space-between;">
                <a href="/" style="text-decoration: none;">
                    <button style="font-family: 'Comic Sans MS', cursive; padding: 0.5rem 1rem; border: 1px solid #333; background-color: white; cursor: pointer;">
                        Back
                    </button>
                </a>

                <button
                        on:click={saveToStateStore}
                        disabled={isSaving}
                        style="font-family: 'Comic Sans MS', cursive; padding: 0.5rem 1rem; border: 1px solid #333; background-color: white; cursor: pointer; {isSaving ? 'opacity: 0.7;' : ''}"
                >
                    {isSaving ? 'Saving...' : 'View Summary'}
                </button>
            </div>

            {#if saveError}
                <div style="margin-top: 1rem; color: #d32f2f; font-family: 'Comic Sans MS', cursive; text-align: center; padding: 0.5rem; background-color: #ffebee; border-radius: 4px;">
                    Error: {saveError}
                </div>
            {/if}
        </div>
    </div>
</div>
