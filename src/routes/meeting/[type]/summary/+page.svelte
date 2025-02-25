<!-- src/routes/meeting/[type]/summary/+page.svelte -->
<script>
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { getMeetingData } from '$lib/meetingService.js';

    // Get the meeting ID from URL
    $: meetingId = $page.url.searchParams.get('id');

    // Get the meeting type from the route parameter
    $: meetingType = $page.params.type;
    $: customName = $page.url.searchParams.get('name');

    // Map of meeting type to full name
    const meetingNames = {
        'ux': 'UX Meeting',
        'client': 'Client Meeting',
        'stakeholder': 'Stakeholder Meeting',
        'team': 'Team Meeting',
        'custom': customName || 'Custom Meeting',
        'user-research': 'User Research'
    };

    // Get the display name based on the meeting type
    $: meetingName = meetingNames[meetingType] || 'Meeting';

    // Summary data
    let summaryData = {
        painPoints: 0,
        positivePoints: 0,
        bugs: 0,
        paymentInfo: 0
    };

    let isLoading = true;
    let loadError = null;
    let meetingData = null;

    $: totalHighlights = Object.values(summaryData).reduce((a, b) => a + b, 0);

    async function loadMeetingData() {
        isLoading = true;
        loadError = null;

        try {
            if (meetingId) {
                // Fetch from DAPR state store
                const result = await getMeetingData(meetingId);

                if (result.success && result.data) {
                    meetingData = result.data;
                    summaryData = meetingData.summary || summaryData;
                    console.log('Meeting data loaded from DAPR:', meetingData);
                } else {
                    loadError = result.message || 'Could not load meeting data';
                    console.error('Failed to load meeting data:', result.message);
                }
            } else {
                loadError = 'No meeting ID provided';
            }
        } catch (error) {
            loadError = error.message || 'An unexpected error occurred';
            console.error('Error loading meeting data:', error);
        } finally {
            isLoading = false;
        }
    }

    function exportToCSV() {
        // Generate CSV content with data from DAPR
        const csvContent = [
            "Meeting Summary - " + (meetingData?.name || meetingName),
            "Type of Meeting: " + (meetingData?.name || meetingName),
            "Date: " + (meetingData?.startedAt ? new Date(meetingData.startedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
            "UTC Time: " + (meetingData?.utcTime || new Date().toISOString().split('T')[1].split('.')[0]),
            "Meeting ID: " + meetingId,
            "",
            "Category,Count,Percentage",
            "Pain Points," + summaryData.painPoints + "," + (totalHighlights ? Math.round(summaryData.painPoints / totalHighlights * 100) : 0) + "%",
            "Positive Points," + summaryData.positivePoints + "," + (totalHighlights ? Math.round(summaryData.positivePoints / totalHighlights * 100) : 0) + "%",
            "Bugs," + summaryData.bugs + "," + (totalHighlights ? Math.round(summaryData.bugs / totalHighlights * 100) : 0) + "%",
            "Payment Info," + summaryData.paymentInfo + "," + (totalHighlights ? Math.round(summaryData.paymentInfo / totalHighlights * 100) : 0) + "%",
            "",
            "Total Highlights," + totalHighlights + ",100%",
            "",
            "Meeting Timeline:",
            "Type,Stopwatch Time,UTC Time"
        ];

        // Add timeline entries if available
        if (meetingData?.entries && meetingData.entries.length > 0) {
            meetingData.entries.forEach(entry => {
                let entryType = '';
                if (entry.type === 'pain') entryType = 'Pain Point';
                else if (entry.type === 'happy') entryType = 'Happy Point';
                else if (entry.type === 'bug') entryType = 'Bug';
                else if (entry.type === 'payment') entryType = 'Payment Info';
                else entryType = 'Note';

                csvContent.push(`"${entryType}","${entry.stopwatchTime}","${entry.utcTime}"`);
            });
        }

        // Join all lines
        const csvString = csvContent.join("\n");

        // Create a download link
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", (meetingData?.name || meetingName).replace(/\s+/g, '_') + "_summary.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    onMount(() => {
        loadMeetingData();
    });
</script>

<div style="min-height: 100vh; background-color: #f0f0f0; padding: 1rem;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white; border: 2px solid #333; position: relative;">
        <!-- Dot pattern overlay -->
        <div style="position: absolute; inset: 0; background-image: radial-gradient(#e0e0e0 1px, transparent 1px); background-size: 12px 12px; opacity: 0.5; pointer-events: none;"></div>

        <div style="position: relative; z-index: 1; padding: 1.5rem;">
            <!-- Header section -->
            <div style="margin-bottom: 2rem; font-family: 'Comic Sans MS', cursive; text-align: center;">
                <h1 style="font-size: 1.5rem; border: 1px solid #333; display: inline-block; padding: 0.5rem 1rem; margin: 0 auto;">[{meetingName} Summary]</h1>
            </div>

            <!-- Loading state -->
            {#if isLoading}
                <div style="display: flex; justify-content: center; padding: 2rem;">
                    <div style="font-family: 'Comic Sans MS', cursive; text-align: center;">
                        <div style="margin-bottom: 1rem;">Loading meeting data...</div>
                        <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #333; border-radius: 50%; margin: 0 auto; animation: spin 1s linear infinite;"></div>
                    </div>
                </div>
            {:else if loadError}
                <div style="background-color: #ffebee; color: #d32f2f; padding: 1rem; margin: 1rem 0; font-family: 'Comic Sans MS', cursive; text-align: center; border-radius: 4px;">
                    Error: {loadError}
                </div>
            {:else}
                <!-- Meeting type section -->
                <div style="margin-bottom: 1.5rem; font-family: 'Comic Sans MS', cursive; display: flex;">
                    <div style="width: 150px; font-weight: bold;">Type of Meeting:</div>
                    <div>{meetingData?.name || meetingName}</div>
                </div>

                <!-- Summary section -->
                <div style="margin-bottom: 1rem; font-family: 'Comic Sans MS', cursive;">
                    <h2 style="font-size: 1.25rem; text-decoration: underline; margin-bottom: 1rem;">Summary:</h2>

                    <div style="margin-bottom: 0.5rem; display: flex; align-items: center;">
                        <input type="checkbox" checked={summaryData.painPoints > 0} style="margin-right: 0.5rem; width: 18px; height: 18px;" disabled>
                        <span style="flex: 1;">Pain Points</span>
                        <span style="margin-right: 2rem;">{summaryData.painPoints}</span>
                        <div style="width: 40px; height: 20px; border: 1px solid #333; text-align: center; line-height: 20px;">
                            {totalHighlights ? Math.round(summaryData.painPoints / totalHighlights * 100) : 0}%
                        </div>
                    </div>

                    <div style="margin-bottom: 0.5rem; display: flex; align-items: center;">
                        <input type="checkbox" checked={summaryData.positivePoints > 0} style="margin-right: 0.5rem; width: 18px; height: 18px;" disabled>
                        <span style="flex: 1;">Positive Stuff</span>
                        <span style="margin-right: 2rem;">{summaryData.positivePoints}</span>
                        <div style="width: 40px; height: 20px; border: 1px solid #333; text-align: center; line-height: 20px;">
                            {totalHighlights ? Math.round(summaryData.positivePoints / totalHighlights * 100) : 0}%
                        </div>
                    </div>

                    <div style="margin-bottom: 0.5rem; display: flex; align-items: center;">
                        <input type="checkbox" checked={summaryData.bugs > 0} style="margin-right: 0.5rem; width: 18px; height: 18px;" disabled>
                        <span style="flex: 1;">Bugs</span>
                        <span style="margin-right: 2rem;">{summaryData.bugs}</span>
                        <div style="width: 40px; height: 20px; border: 1px solid #333; text-align: center; line-height: 20px;">
                            {totalHighlights ? Math.round((summaryData.bugs || 0) / totalHighlights * 100) : 0}%
                        </div>
                    </div>

                    <div style="margin-bottom: 0.5rem; display: flex; align-items: center;">
                        <input type="checkbox" checked={summaryData.paymentInfo > 0} style="margin-right: 0.5rem; width: 18px; height: 18px;" disabled>
                        <span style="flex: 1;">Payment Info</span>
                        <span style="margin-right: 2rem;">{summaryData.paymentInfo}</span>
                        <div style="width: 40px; height: 20px; border: 1px solid #333; text-align: center; line-height: 20px;">
                            {totalHighlights ? Math.round(summaryData.paymentInfo / totalHighlights * 100) : 0}%
                        </div>
                    </div>
                </div>

                <!-- Total highlights -->
                <div style="margin: 2rem 0; border-top: 1px solid #333; border-bottom: 1px solid #333; padding: 1rem 0; font-family: 'Comic Sans MS', cursive;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: bold;">Total Highlights</span>
                        <span>{totalHighlights}</span>
                    </div>
                </div>
            {/if}

            <!-- Export button -->
            <div style="display: flex; justify-content: flex-end; margin-top: 3rem;">
                <button
                        on:click={exportToCSV}
                        disabled={isLoading || loadError}
                        style="font-family: 'Comic Sans MS', cursive; border: 1px solid #333; padding: 0.5rem 1rem; background-color: white; cursor: pointer; {(isLoading || loadError) ? 'opacity: 0.5; cursor: not-allowed;' : ''}"
                >
                    Export to CSV
                </button>
            </div>

            <!-- Navigation buttons -->
            <div style="display: flex; justify-content: space-between; margin-top: 2rem;">
                <a href="/" style="text-decoration: none;">
                    <button style="font-family: 'Comic Sans MS', cursive; border: 1px solid #333; padding: 0.5rem 1rem; background-color: white; cursor: pointer;">
                        New Meeting
                    </button>
                </a>

                <a href={`/meeting/${meetingType}${meetingId ? `?id=${meetingId}` : ''}`} style="text-decoration: none;">
                    <button style="font-family: 'Comic Sans MS', cursive; border: 1px solid #333; padding: 0.5rem 1rem; background-color: white; cursor: pointer;">
                        Back to Meeting
                    </button>
                </a>
            </div>
        </div>
    </div>
</div>

<style>
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
</style>
