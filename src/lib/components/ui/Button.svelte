<script>
    export let variant = 'default'; // 'default', 'primary', etc.
    export let size = 'md'; // 'sm', 'md', 'lg', 'xl', etc.
    export let fullWidth = false;
    export let disabled = false;
    export let type = 'button';
    export let style = '';
</script>

<button
        {type}
        class="font-comic border-2 border-gray-800 bg-white cursor-pointer {disabled ? 'opacity-70' : ''}
        {fullWidth ? 'w-full' : ''}
        {variant === 'primary' ? 'text-xl uppercase' : ''}
        {size === 'sm' ? 'py-2 px-4' : size === 'lg' ? 'p-4' : 'p-2'}"
        disabled={disabled}
        style={style}
        on:click
>
    <slot />
</button>

<style>
    .font-comic {
        font-family: 'Comic Sans MS', cursive;
    }
</style>
