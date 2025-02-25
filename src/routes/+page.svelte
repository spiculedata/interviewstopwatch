<!-- src/routes/+page.svelte -->
<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';

    // Meeting types
    const meetingTypes = [
        { id: 'ux', label: 'UX' },
        { id: 'client', label: 'Client' },
        { id: 'stakeholder', label: 'Stake.' },
        { id: 'team', label: 'Team' }
    ];

    let selectedMeetingType = null;
    let customMeeting = '';
    let isCustom = false;

    function selectMeetingType(type) {
        if (type === 'custom') {
            isCustom = true;
            selectedMeetingType = null;
        } else {
            isCustom = false;
            selectedMeetingType = type;
            // Navigate to the meeting page with the selected type
            goto(`/meeting/${type}`);
        }
    }

    function handleCustomSubmit() {
        if (customMeeting.trim()) {
            goto(`/meeting/custom?name=${encodeURIComponent(customMeeting)}`);
        }
    }

    onMount(() => {
        // Any initialization code could go here
    });
</script>

<div style="display: flex; justify-content: center; align-items: center; min-height: 100vh; background-color: #f0f0f0; padding: 1rem;">
    <div style="width: 100%; max-width: 400px;">
        <!-- Paper-like background with dot pattern -->
        <div style="position: relative; background-color: white; border: 2px solid #333; overflow: hidden;">
            <!-- Dot pattern overlay -->
            <div style="position: absolute; inset: 0; background-image: radial-gradient(#e0e0e0 1px, transparent 1px); background-size: 12px 12px; opacity: 0.5; pointer-events: none;"></div>

            <!-- Content container -->
            <div style="position: relative; z-index: 1; padding: 1.5rem;">
                <!-- Header -->
                <h1 style="font-family: 'Comic Sans MS', cursive; text-align: center; font-size: 1.5rem; margin-bottom: 2rem; padding-bottom: 0.5rem; border-bottom: 2px solid #ccc; color: #333;">
                    Meeting Highlighter
                </h1>

                <!-- Question -->
                <div style="font-family: 'Comic Sans MS', cursive; margin-bottom: 1.5rem; font-size: 1.125rem; color: #333;">
                    What kind of meeting
                </div>

                <!-- Meeting type buttons -->
                <div style="display: flex; justify-content: space-between; gap: 0.5rem; margin-bottom: 1.5rem;">
                    {#each meetingTypes as type}
                        <button
                                style="width: 3.5rem; height: 3.5rem; border-radius: 50%; border: 2px solid #333; display: flex; align-items: center; justify-content: center; font-family: 'Comic Sans MS', cursive; transition: all 0.2s; background-color: {selectedMeetingType === type.id ? '#333' : 'white'}; color: {selectedMeetingType === type.id ? 'white' : '#333'}; cursor: pointer;"
                                on:click={() => selectMeetingType(type.id)}
                        >
                            {type.label}
                        </button>
                    {/each}
                </div>

                <!-- Custom meeting button -->
                <button
                        style="width: 100%; padding: 0.5rem 1rem; border: 2px solid #333; border-radius: 0.25rem; font-family: 'Comic Sans MS', cursive; text-align: center; transition: all 0.2s; margin-bottom: 1rem; background-color: {isCustom ? '#333' : 'white'}; color: {isCustom ? 'white' : '#333'}; cursor: pointer;"
                        on:click={() => selectMeetingType('custom')}
                >
                    Make a custom meeting
                </button>

                <!-- Custom meeting input (conditional) -->
                {#if isCustom}
                    <form on:submit|preventDefault={handleCustomSubmit} style="display: flex; flex-direction: column; gap: 0.75rem;">
                        <input
                                type="text"
                                style="width: 100%; padding: 0.5rem; border: 2px solid #333; border-radius: 0.25rem; font-family: 'Comic Sans MS', cursive; background-color: white;"
                                placeholder="Enter custom meeting type"
                                bind:value={customMeeting}
                        />
                        <button
                                type="submit"
                                style="padding: 0.5rem 1rem; background-color: #333; color: white; border-radius: 0.25rem; font-family: 'Comic Sans MS', cursive; cursor: pointer;"
                        >
                            Start Meeting
                        </button>
                    </form>
                {/if}
            </div>
        </div>
    </div>
</div>
