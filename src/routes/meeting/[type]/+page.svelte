<script lang="ts">
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { meeting } from '$lib/stores/meetingStore';
    import ControlPanel from '$lib/components/meeting/ControlPanel.svelte';
    import VideoPlayer from '$lib/components/meeting/VideoPlayer.svelte';
    import TimeEntries from '$lib/components/meeting/TimeEntries.svelte';

    $: meetingType = $page.params.type ?? 'custom';
    $: customName = $page.url.searchParams.get('name');
    $: meetingId = $page.url.searchParams.get('id') || '';

    $: isRightPanelOpen = $meeting.isRightPanelOpen;

    onMount(() => {
        meeting.init(meetingType, customName, meetingId);

        return () => {
            const timerInterval = $meeting.timerInterval;
            if (timerInterval) clearInterval(timerInterval);
        };
    });
</script>

<div class="min-h-screen bg-gray-100 p-4">
    <div class="flex max-w-6xl mx-auto h-[calc(100vh-2rem)] border-2 border-gray-800">
        <div class="flex-1 bg-white relative overflow-y-auto {isRightPanelOpen ? 'border-r-2 border-gray-800' : ''}">
            <div class="absolute inset-0 bg-dot-pattern opacity-50 pointer-events-none"></div>
            <ControlPanel {meetingType} />
        </div>

        {#if isRightPanelOpen}
            <div class="flex-1 bg-white relative overflow-y-auto">
                <div class="absolute inset-0 bg-dot-pattern opacity-50 pointer-events-none"></div>
                <div class="relative z-10 p-6">
                    <VideoPlayer />
                    <TimeEntries />
                </div>
            </div>
        {/if}
    </div>
</div>

<style>
    :global(.font-comic) {
        font-family: 'Comic Sans MS', cursive;
    }

    .bg-dot-pattern {
        background-image: radial-gradient(#e0e0e0 1px, transparent 1px);
        background-size: 12px 12px;
    }
</style>
