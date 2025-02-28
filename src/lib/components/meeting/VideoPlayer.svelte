<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { meeting } from '$lib/stores/meetingStore';

    let videoElement: HTMLVideoElement;
    let isDragging = false;
    let animationFrameId: number | null = null;

    $: videoURL = $meeting.videoURL;
    $: isPlaying = $meeting.isPlaying;
    $: currentTime = $meeting.currentTime;
    $: duration = $meeting.duration;
    $: seekPosition = $meeting.seekPosition;
    $: timelineMarkers = $meeting.timelineMarkers;

    function formatTime(seconds: number): string {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    function handleFileUpload(event: Event): void {
        const target = event.target as HTMLInputElement;
        const files = target.files;

        if (!files || files.length === 0) return;

        const file = files[0];
        if (file && file.type.startsWith('video/')) {
            meeting.setVideo(file);

            // Small delay to ensure DOM is ready
            setTimeout(() => {
                if (videoElement) {
                    setupVideoListeners();
                    videoElement.src = videoURL;
                }
            }, 100);
        }
    }

    function togglePlay(): void {
        if (videoElement) {
            if (videoElement.paused) {
                // Lock positions when play starts if needed
                meeting.lockPositions();

                videoElement.play()
                    .then(() => {
                        meeting.togglePlay();
                    })
                    .catch(err => {
                        console.error('Error playing video:', err);
                    });
            } else {
                videoElement.pause();
                meeting.togglePlay();
            }
        }
    }

    function handleSeekStart(event: MouseEvent): void {
        isDragging = true;
        handleSeekMove(event);
    }

    function handleSeekMove(event: MouseEvent): void {
        if (!isDragging) return;

        const timeline = event.currentTarget as HTMLElement;
        const rect = timeline.getBoundingClientRect();
        const position = (event.clientX - rect.left) / rect.width;
        const newPosition = Math.min(Math.max(position, 0), 1);

        meeting.setSeekPosition(newPosition);
    }

    function handleSeekEnd(): void {
        if (!isDragging) return;

        isDragging = false;
        if (videoElement && duration) {
            videoElement.currentTime = seekPosition * duration;
            meeting.updateVideoTime(videoElement.currentTime);
        }
    }

    function handleTimelineClick(event: MouseEvent): void {
        const timeline = event.currentTarget as HTMLElement;
        const rect = timeline.getBoundingClientRect();
        const clickPosition = (event.clientX - rect.left) / rect.width;

        if (videoElement && duration) {
            videoElement.currentTime = clickPosition * duration;
            meeting.updateVideoTime(videoElement.currentTime);
        }
    }

    function jumpToVideoTime(time: number): void {
        if (videoElement && !isNaN(time)) {
            videoElement.currentTime = time;
            meeting.updateVideoTime(time);
            if (videoElement.paused) {
                videoElement.play().catch(err => console.error('Error playing video:', err));
            }
        }
    }

    function startVideoProgressUpdates(): void {
        // Cancel any existing animation frame
        stopVideoProgressUpdates();

        function updateVideoProgress(): void {
            if (videoElement && duration) {
                // Update seek position
                meeting.setSeekPosition(videoElement.currentTime / duration);
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

    // Event handlers for video
    function handleTimeUpdate(): void {
        meeting.updateVideoTime(videoElement.currentTime);
    }

    function handleDurationChange(): void {
        meeting.updateVideoDuration(videoElement.duration);
    }

    function handleMetadataLoaded(): void {
        meeting.updateVideoDuration(videoElement.duration);
    }

    function handlePlay(): void {
        meeting.togglePlay();
        startVideoProgressUpdates();
        meeting.lockPositions();
    }

    function handlePause(): void {
        meeting.togglePlay();
        stopVideoProgressUpdates();
    }

    function handleEnded(): void {
        meeting.togglePlay();
        stopVideoProgressUpdates();
    }

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

    onMount(() => {
        // Set up video event listeners if video element exists
        if (videoElement) {
            setupVideoListeners();
        }

        // Add window event listeners for drag events
        window.addEventListener('mousemove', handleSeekMove);
        window.addEventListener('mouseup', handleSeekEnd);
    });

    onDestroy(() => {
        if (videoURL) URL.revokeObjectURL(videoURL);
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        window.removeEventListener('mousemove', handleSeekMove);
        window.removeEventListener('mouseup', handleSeekEnd);
    });
</script>

<div class="mb-8 flex flex-col w-full">
    <!-- Video Container -->
    <div class="w-full aspect-video bg-black relative border-2 border-gray-300 overflow-hidden mb-2">
        {#if videoURL}
            <!-- Hidden native video element (no controls) -->
            <video
                    bind:this={videoElement}
                    src={videoURL}
                    class="w-full h-full object-contain"
                    on:click={togglePlay}
            ></video>

            <!-- Play button overlay (shows when paused) -->
            {#if !isPlaying}
                <div class="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer" on:click={togglePlay}>
                    <div class="w-20 h-20 rounded-full bg-white/80 flex items-center justify-center">
                        <span class="ml-1 text-4xl">▶</span>
                    </div>
                </div>
            {/if}
        {:else}
            <div class="w-full h-full flex items-center justify-center font-comic text-4xl text-gray-500">
                VIDEO
            </div>
        {/if}
    </div>

    <!-- Custom Video Controls -->
    <div class="w-full flex flex-col gap-2">
        <!-- Playback timeline -->
        <div
                class="video-timeline relative h-10 bg-gray-100 rounded-[20px] overflow-hidden cursor-pointer"
                on:mousedown={handleSeekStart}
                on:click={handleTimelineClick}
        >
            <!-- Progress bar -->
            <div
                    class="absolute left-0 top-0 h-full bg-gray-300 transition-width duration-100"
                    style="width: {seekPosition * 100}%;"
            ></div>

            <!-- Current position indicator -->
            <div
                    class="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-gray-800 z-30"
                    style="left: {seekPosition * 100}%;"
            ></div>

            <!-- Marker icons on timeline - ensure they appear on top -->
            {#each timelineMarkers as marker (marker.id)}
                <div
                        class="video-marker absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-xs z-50 cursor-pointer shadow-[0_0_0_2px_white]"
                        style="left: {marker.position}%; background-color: {marker.color};"
                        title="{marker.type} at {marker.videoTimeFormatted}"
                        on:click|stopPropagation={() => jumpToVideoTime(marker.videoTime)}
                >
                    {marker.icon}
                </div>
            {/each}
        </div>

        <!-- Controls and time display -->
        <div class="flex items-center justify-between font-comic">
            <!-- Play/Pause button -->
            <button
                    class="w-10 h-10 rounded-full border-2 border-gray-800 bg-white flex items-center justify-center cursor-pointer"
                    on:click={togglePlay}
            >
                {isPlaying ? '❚❚' : '▶'}
            </button>

            <!-- Time display -->
            <div class="font-comic text-sm">
                {formatTime(currentTime)} / {formatTime(duration || 0)}
            </div>

            <!-- Volume control (placeholder) -->
            <div class="flex items-center gap-2">
                <span>🔊</span>
                <div class="w-[60px] h-2 bg-gray-300 rounded-sm overflow-hidden">
                    <div class="w-4/5 h-full bg-gray-800"></div>
                </div>
            </div>
        </div>
    </div>

    <!-- Video upload button -->
    <div class="flex justify-center mt-4">
        <input
                type="file"
                id="video-upload"
                accept="video/*"
                on:change={handleFileUpload}
                class="hidden"
        />
        <label
                for="video-upload"
                class="cursor-pointer font-comic py-2 px-4 border border-gray-800 bg-white"
        >
            {videoURL ? 'Change Video' : 'Upload Video'}
        </label>
    </div>
</div>

<style>
    .font-comic {
        font-family: 'Comic Sans MS', cursive;
    }

    .transition-width {
        transition: width 0.1s ease-out;
    }
</style>
