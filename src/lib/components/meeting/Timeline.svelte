<script lang="ts">
    import { meeting } from '$lib/stores/meetingStore';
    import { ANNOTATION_TYPES, type TimelineMarker } from '$lib/types';

    function jumpToVideoTime(time: number): void {
        const video = document.querySelector('video');
        if (video && !isNaN(time)) {
            video.currentTime = time;
            if (video.paused) {
                video.play().catch(err => console.error('Error playing video:', err));
            }
        }
    }

    function getTypeLabel(type: string): string {
        const annotationType = ANNOTATION_TYPES.find(t => t.id === type);
        return annotationType ? annotationType.label : type;
    }

    $: timelineMarkers = $meeting.timelineMarkers;
    $: timelineKey = $meeting.timelineKey;
    $: formattedTime = $meeting.formattedTime;
    $: videoTime = $meeting.currentTime;
    $: videoDuration = $meeting.duration;
    $: isRunning = $meeting.isRunning;
</script>

<!-- Timeline with timestamps -->
<div class="mb-8">
    <div class="relative h-[30px] bg-gray-100 rounded-[15px] mb-2 overflow-hidden">
        {#each timelineMarkers as marker (marker.id + timelineKey)}
            <div
                    class="timeline-marker absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-xs z-20 cursor-pointer"
                    style="left: {marker.position}%; background-color: {marker.color};"
                    title="{getTypeLabel(marker.type)} at {marker.videoTimeFormatted}"
                    on:click={() => jumpToVideoTime(marker.videoTime)}
            >
                {marker.icon}
            </div>
        {/each}

        <!-- Progress bar -->
        <div
                class="absolute bottom-0 left-0 h-full bg-gray-300 z-10"
                style="width: {isRunning && videoDuration ? (videoTime / videoDuration) * 100 : 0}%;"
        ></div>
    </div>

    <!-- Timeline timestamps -->
    <div class="flex justify-between font-comic text-sm text-gray-600">
        <div>0:00</div>
        <div>{formattedTime}</div>
    </div>
</div>

<style>
    .font-comic {
        font-family: 'Comic Sans MS', cursive;
    }
</style>
