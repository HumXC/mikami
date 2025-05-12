<script lang="ts">
    import { Search } from "lucide-svelte";
    export let value: string = "";
    export let placeholder: string = "你想要什么...";
    export let onChange: (text: string) => void = () => {};
    export const getFocus = () => searchBoxRef?.focus();
    let searchBoxRef: HTMLInputElement;
</script>

<div
    class="flex items-center justify-between border rounded-lg px-3 py-2 shadow-sm transition-all
        border-gray-600 bg-gray-900/80
        focus-within:ring-2 focus-within:ring-green-600"
>
    <input
        class="flex-1 bg-transparent outline-none text-sm text-gray-200 placeholder-gray-400"
        type="text"
        bind:value
        {placeholder}
        on:input={() => onChange(value)}
        bind:this={searchBoxRef}
    />

    <Search class="w-5 h-5 text-gray-300 ml-2" />
</div>
