<script lang="ts">
    import { meeting } from '$lib/stores/meetingStore';
    import { ANNOTATION_TYPES, type TimeEntry } from '$lib/types';

    function getTypeLabel(type: string): string {
        const annotationType = ANNOTATION_TYPES.find(t => t.id === type);
        return annotationType ? annotationType.label : type;
    }

    function getIconColor(type: string): string {
        const annotationType = ANNOTATION_TYPES.find(t => t.id === type);
        return annotationType ? annotationType.color : '#e0e0e0';
    }

    function getIcon(type: string): string {
        const annotationType = ANNOTATION_TYPES.find(t => t.id === type);
        return annotationType ? annotationType.icon : '•';
    }

    function updateEntryDescription(id: string, description: string): void {
        meeting.updateEntryDescription(id, description);
    }

    function removeEntry(id: string): void {
        meeting.removeEntry(id);
    }

    $: entries = $meeting.timeEntries;
</script>

<h3 class="font-comic mt-0">POINTS OF INTEREST</h3>

<!-- Time entries list -->
<div class="time-entries">
    {#each entries as entry}
        <div class="flex border-b border-gray-200 py-3 font-comic">
            <div class="w-[70px] text-right pr-4">
                {entry.stopwatchTime}
            </div>
            <div class="flex-grow">
                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <span class="mr-2 inline-block w-5 h-5 rounded-full text-center leading-5 text-xs"
                              style="background-color: {getIconColor(entry.type)};">
                            {getIcon(entry.type)}
                        </span>
                        <span>
                            {getTypeLabel(entry.type)}
                        </span>
                    </div>
                    <button
                            class="bg-transparent border-0 text-gray-500 cursor-pointer text-sm"
                            on:click={() => removeEntry(entry.id)}
                            title="Remove this entry"
                    >
                        ✕
                    </button>
                </div>
                <input
                        type="text"
                        placeholder="Add description..."
                        value={entry.description}
                        on:input={(e) => updateEntryDescription(entry.id, (e.target as HTMLInputElement).value)}
                        class="w-full border-0 border-b border-dashed border-gray-300 font-inherit bg-transparent mt-1 py-1"
                />
            </div>
        </div>
    {/each}

    {#if entries.length === 0}
        <div class="py-8 text-center text-gray-500 font-comic">
            No entries yet. Use the annotation buttons to mark important moments.
        </div>
    {/if}
</div>

<style>
    .font-comic {
        font-family: 'Comic Sans MS', cursive;
    }
</style>
