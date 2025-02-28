<script lang="ts">
    import { meeting } from '$lib/stores/meetingStore';

    export let meetingType: string;
</script>

<h2 class="font-comic mt-0">Stopwatch</h2>

<!-- Meeting type selector -->
<div class="mb-6">
    <div class="mb-2 font-comic">What would you like to do</div>
    <div class="mb-2">
        <select class="w-full p-2 font-comic border-2 border-gray-300 bg-gray-100">
            <option>Start a new annotate ▼</option>
        </select>
    </div>

    <div class="mb-2">
        <select
                class="w-full p-2 font-comic border-2 border-gray-300 bg-gray-100"
                bind:value={meetingType}
        >
            <option value="ux">UX Research Interview ▼</option>
            <option value="client">Client Meeting ▼</option>
            <option value="stakeholder">Stakeholder Meeting ▼</option>
            <option value="team">Team Meeting ▼</option>
            <option value="custom">Custom Meeting ▼</option>
        </select>
    </div>

    <div class="text-sm cursor-pointer text-gray-600 underline" on:click={() => meeting.createCustomButton(prompt("Enter button name") || "")}>
        Create a custom button set
    </div>
</div>

<style>
    .font-comic {
        font-family: 'Comic Sans MS', cursive;
    }
</style>
