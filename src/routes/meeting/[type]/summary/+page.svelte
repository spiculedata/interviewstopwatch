<script lang="ts">
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { getMeetingData, type MeetingData } from '$lib/meetingService';
    import { ANNOTATION_TYPES, type SummaryData } from '$lib/types';

    $: meetingId = $page.url.searchParams.get('id') ?? '';
    $: meetingType = $page.params.type ?? 'custom';
    $: customName = $page.url.searchParams.get('name');

    const meetingNames: Record<string, string> = {
        'ux': 'UX Research Interview',
        'client': 'Client Meeting',
        'stakeholder': 'Stakeholder Meeting',
        'team': 'Team Meeting'
    };

    $: meetingName = meetingNames[meetingType] || customName || 'Meeting';

    const emptySummary: SummaryData = {
        userInfo: 0, question: 0, answer: 0, pain: 0, ambivalent: 0,
        success: 0, idea: 0, note: 0, other: 0
    };

    let summaryData: SummaryData = { ...emptySummary };
    let isLoading = true;
    let loadError: string | null = null;
    let meetingData: MeetingData | null = null;

    $: totalHighlights = ANNOTATION_TYPES.reduce((sum, t) => sum + (summaryData[t.id] || 0), 0);

    function pct(count: number): number {
        return totalHighlights ? Math.round((count / totalHighlights) * 100) : 0;
    }

    async function loadMeetingData(): Promise<void> {
        isLoading = true;
        loadError = null;

        try {
            if (!meetingId) {
                loadError = 'No meeting ID provided';
                return;
            }
            const result = await getMeetingData(meetingId);
            if (result.success && result.data) {
                meetingData = result.data;
                summaryData = { ...emptySummary, ...(meetingData.summary as SummaryData) };
            } else {
                loadError = result.message || 'Could not load meeting data';
            }
        } catch (error) {
            loadError = error instanceof Error ? error.message : 'An unexpected error occurred';
        } finally {
            isLoading = false;
        }
    }

    function exportToCSV(): void {
        const date = meetingData?.startedAt
            ? new Date(meetingData.startedAt).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0];

        const lines: string[] = [
            `Meeting Summary - ${meetingData?.name || meetingName}`,
            `Type of Meeting: ${meetingData?.name || meetingName}`,
            `Date: ${date}`,
            `Meeting ID: ${meetingId}`,
            '',
            'Category,Count,Percentage',
            ...ANNOTATION_TYPES.map(t => {
                const count = summaryData[t.id] || 0;
                return `"${t.label}",${count},${pct(count)}%`;
            }),
            '',
            `Total Highlights,${totalHighlights},100%`,
            '',
            'Meeting Timeline:',
            'Type,Stopwatch Time,Description'
        ];

        if (meetingData?.entries) {
            for (const entry of meetingData.entries) {
                const label = ANNOTATION_TYPES.find(t => t.id === entry.type)?.label ?? entry.type;
                const description = (entry.description ?? '').replace(/"/g, '""');
                lines.push(`"${label}","${entry.stopwatchTime}","${description}"`);
            }
        }

        const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = (meetingData?.name || meetingName).replace(/\s+/g, '_') + '_summary.csv';
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    onMount(() => {
        loadMeetingData();
    });
</script>

<div style="min-height: 100vh; background-color: #f0f0f0; padding: 1rem;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white; border: 2px solid #333; position: relative;">
        <div style="position: absolute; inset: 0; background-image: radial-gradient(#e0e0e0 1px, transparent 1px); background-size: 12px 12px; opacity: 0.5; pointer-events: none;"></div>

        <div style="position: relative; z-index: 1; padding: 1.5rem;">
            <div style="margin-bottom: 2rem; font-family: 'Comic Sans MS', cursive; text-align: center;">
                <h1 style="font-size: 1.5rem; border: 1px solid #333; display: inline-block; padding: 0.5rem 1rem; margin: 0 auto;">[{meetingName} Summary]</h1>
            </div>

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
                <div style="margin-bottom: 1.5rem; font-family: 'Comic Sans MS', cursive; display: flex;">
                    <div style="width: 150px; font-weight: bold;">Type of Meeting:</div>
                    <div>{meetingData?.name || meetingName}</div>
                </div>

                <div style="margin-bottom: 1rem; font-family: 'Comic Sans MS', cursive;">
                    <h2 style="font-size: 1.25rem; text-decoration: underline; margin-bottom: 1rem;">Summary:</h2>

                    {#each ANNOTATION_TYPES as type}
                        {@const count = summaryData[type.id] || 0}
                        <div style="margin-bottom: 0.5rem; display: flex; align-items: center;">
                            <input type="checkbox" checked={count > 0} style="margin-right: 0.5rem; width: 18px; height: 18px;" disabled>
                            <span style="flex: 1;">{type.label}</span>
                            <span style="margin-right: 2rem;">{count}</span>
                            <div style="width: 48px; height: 20px; border: 1px solid #333; text-align: center; line-height: 20px;">
                                {pct(count)}%
                            </div>
                        </div>
                    {/each}
                </div>

                <div style="margin: 2rem 0; border-top: 1px solid #333; border-bottom: 1px solid #333; padding: 1rem 0; font-family: 'Comic Sans MS', cursive;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: bold;">Total Highlights</span>
                        <span>{totalHighlights}</span>
                    </div>
                </div>
            {/if}

            <div style="display: flex; justify-content: flex-end; margin-top: 3rem;">
                <button
                        on:click={exportToCSV}
                        disabled={isLoading || !!loadError}
                        style="font-family: 'Comic Sans MS', cursive; border: 1px solid #333; padding: 0.5rem 1rem; background-color: white; cursor: pointer; {(isLoading || loadError) ? 'opacity: 0.5; cursor: not-allowed;' : ''}"
                >
                    Export to CSV
                </button>
            </div>

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
