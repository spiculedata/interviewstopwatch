<script lang="ts">
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { meeting } from '$lib/stores/meetingStore';
    import ControlPanel from '$lib/components/meeting/ControlPanel.svelte';
    import VideoPlayer from '$lib/components/meeting/VideoPlayer.svelte';
    import TimeEntries from '$lib/components/meeting/TimeEntries.svelte';

    // Route and URL parameters
    $: meetingType = $page.params.type;
    $: customName = $page.url.searchParams.get('name');
    $: meetingId = $page.url.searchParams.get('id') || '';

    // UI state
    $: isRightPanelOpen = $meeting.isRightPanelOpen;

    onMount(() => {
        // Initialize the meeting
        meeting.init(meetingType, customName, meetingId);

        // Clean up on unmount
        return () => {
            const timerInterval = $meeting.timerInterval;
            if (timerInterval) clearInterval(timerInterval);
        };
    });
</script>

<div class="min-h-screen bg-gray-100 p-4">
    <div class="flex max-w-6xl mx-auto h-[calc(100vh-2rem)] border-2 border-gray-800">
        <!-- Left panel (always visible) -->
        <div class="flex-1 bg-white relative overflow-y-auto {isRightPanelOpen ? 'border-r-2 border-gray-800' : ''}">
            <!-- Dot pattern overlay -->
            <div class="absolute inset-0 bg-dot-pattern opacity-50 pointer-events-none"></div>

            <!-- Control panel -->
            <ControlPanel {meetingType} />
        </div>

        <!-- Right panel (conditionally visible) -->
        {#if isRightPanelOpen}
            <div class="flex-1 bg-white relative overflow-y-auto">
                <!-- Dot pattern overlay -->
                <div class="absolute inset-0 bg-dot-pattern opacity-50 pointer-events-none"></div>

                <div class="relative z-10 p-6">
                    <!-- Video player -->
                    <VideoPlayer />

                    <!-- Time entries list -->
                    <TimeEntries />
                </div>
            </div>
        {/if}
    </div>
</div>

<style>
    /* Additional styles that aren't easily done with Tailwind */
    :global(.font-comic) {
        font-family: 'Comic Sans MS', cursive;
    }

    .bg-dot-pattern {
        background-image: radial-gradient(#e0e0e0 1px, transparent 1px);
        background-size: 12px 12px;
    }

    /* Add any Tailwind-specific customizations here */
    @tailwind base;
    @tailwind components;
    @tailwind utilities;
</style>
