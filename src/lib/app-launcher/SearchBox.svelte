<script lang="ts">
    import { Search } from "lucide-svelte";
    export let value: string = "";
    export let placeholder: string = "你想要什么...";
    export let onChange: (text: string) => void = () => {};
    export const isFocus = () => inputRef && inputRef.matches(":focus");
    let inputRef: HTMLInputElement;
    $: onChange(value);
</script>

<div
    class="flex items-center justify-between border rounded-lg px-3 py-2 shadow-sm transition-all
        border-gray-600 bg-gray-900/80"
>
    <input
        class="flex-1 bg-transparent outline-none text-sm text-gray-200"
        type="text"
        bind:value
        {placeholder}
        bind:this={inputRef}
    />

    <Search class="w-5 h-5 text-gray-300" />
</div>

<style>
    input::placeholder {
        color: rgb(165, 165, 165);
    }
</style>
