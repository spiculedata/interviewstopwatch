<script lang="ts">
    import { meeting } from '$lib/stores/meetingStore';
    import { ANNOTATION_TYPES, type AnnotationType } from '$lib/types';

    export let currentPointType: string | null = null;

    $: customButtons = $meeting.customButtons;
    $: summaryData = $meeting.summaryData;

    function recordPoint(type: string): void {
        meeting.recordPoint(type);
    }

    function createCustomButton(): void {
        const buttonName = prompt("Enter button name");
        if (buttonName) {
            meeting.createCustomButton(buttonName);
        }
    }
</script>

<div class="text-right mb-2 font-comic text-sm">
    <button class="cursor-pointer" on:click={createCustomButton}>✏️ Edit Buttons</button>
</div>

<!-- Annotation buttons grid -->
<div class="grid grid-cols-3 gap-4 mb-8">
    {#each ANNOTATION_TYPES as type}
        <div class="flex flex-col items-center">
            <button
                    class="w-[60px] h-[60px] rounded-full border-2 border-gray-800 flex items-center justify-center bg-white cursor-pointer mb-2"
                    style="background-color: {currentPointType === type.id ? type.color : 'white'};"
                    on:click={() => recordPoint(type.id)}
            >
                <span class="text-2xl">{type.icon}</span>
            </button>
            <span class="font-comic text-sm text-center">{type.label}</span>
            <span class="font-comic text-xs text-gray-500">0{summaryData[type.id] || 0}</span>
        </div>
    {/each}

    {#each customButtons as button}
        <div class="flex flex-col items-center">
            <button
                    class="w-[60px] h-[60px] rounded-full border-2 border-gray-800 flex items-center justify-center bg-white cursor-pointer mb-2"
                    style="background-color: {currentPointType === button.id ? button.color : 'white'};"
                    on:click={() => recordPoint(button.id)}
            >
                <span class="text-2xl">{button.icon}</span>
            </button>
            <span class="font-comic text-sm text-center">{button.label}</span>
        </div>
    {/each}
</div>

<style>
    .font-comic {
        font-family: 'Comic Sans MS', cursive;
    }
</style>
