<script lang="ts">
    import { meeting } from '$lib/stores/meetingStore';
    import Button from '$lib/components/ui/Button.svelte';
    import MeetingHeader from './MeetingHeader.svelte';
    import AnnotationButtons from './AnnotationButtons.svelte';
    import Timeline from './Timeline.svelte';

    export let meetingType: string;

    function startTimer(): void {
        meeting.startTimer();
    }

    function endTimer(): void {
        meeting.recordPoint('end');
    }

    function toggleRightPanel(): void {
        meeting.toggleRightPanel();
    }

    function exportData(): void {
        const exportStore = meeting.exportData();

        exportStore.subscribe(data => {
            // Create JSON blob and download
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${data.name.replace(/\s/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        })();
    }

    $: isRunning = $meeting.isRunning;
    $: isRightPanelOpen = $meeting.isRightPanelOpen;
</script>

<div class="relative z-10 p-6">
    <!-- Header section -->
    <MeetingHeader {meetingType} />

    <!-- Timer controls -->
    <div class="flex gap-4 mb-8">
        <Button
                on:click={startTimer}
                disabled={isRunning}
                fullWidth={true}
                size="lg"
                variant="default"
        >
            START TIMER
        </Button>

        <Button
                on:click={endTimer}
                fullWidth={true}
                size="lg"
                variant="default"
        >
            END TIMER
        </Button>
    </div>

    <!-- Annotation buttons -->
    <AnnotationButtons />

    <!-- Timeline with timestamps -->
    <Timeline />

    <div class="text-right mb-4">
        <button
                class="font-comic p-2 border-0 bg-transparent cursor-pointer underline"
                on:click={toggleRightPanel}
        >
            {isRightPanelOpen ? 'Collapse ◂' : 'Expand ▸'}
        </button>
    </div>

    <!-- Export button -->
    <div class="mt-8">
        <Button
                on:click={exportData}
                fullWidth={true}
                size="lg"
                variant="primary"
        >
            EXPORT
        </Button>
    </div>
</div>

<style>
    .font-comic {
        font-family: 'Comic Sans MS', cursive;
    }
</style>
