<script lang="ts">
    import { Menu, LayoutList, Tags } from "lucide-svelte";
    import SideControlerButton from "./SideControlerButton.svelte";
    let isExpanded = false;
    export let state: string = "hide";
    function toggleState(newState: string) {
        if (state === "hide" || state !== newState) {
            state = newState;
        } else {
            state = "hide";
        }
    }
</script>

<div class="box flex flex-col h-full p-2 gap-2">
    <SideControlerButton
        Icon={Menu as any}
        text="Menu"
        onClick={() => (isExpanded = !isExpanded)}
        bind:isExpanded
    />
    <SideControlerButton
        Icon={LayoutList as any}
        text="Name"
        onClick={() => toggleState("name")}
        bind:isExpanded
    />
    <SideControlerButton
        Icon={Tags as any}
        text="Tags"
        onClick={() => toggleState("tags")}
        bind:isExpanded
    />
    <!-- Grid 删除控件的区域，如果 Grid 的控件被移动到 div 上方，会删除该控件 -->
    <div class="tile-trash h-full w-full"></div>
</div>

<style>
    .box {
        background-color: rgb(9, 15, 26);
        border: rgba(20, 28, 44, 0.89) 2px solid;
    }
</style>
