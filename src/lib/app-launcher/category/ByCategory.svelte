<script lang="ts">
    import { convertToPinyin } from "tiny-pinyin";
    import CategoryItem from "./CategoryItem.svelte";
    import SearchBox from "./SearchBox.svelte";
    import { Application, IsPrintableKey, Search } from "../common";
    import { tick } from "svelte";

    export let apps: Map<string, Application[]> = new Map();
    let filteredCategories: Map<string, Application[]> = new Map();
    let filteredCategoriesSorted: string[] = [];
    let categoryRefs: CategoryItem[] = [];
    let searchBoxRef: SearchBox;
    let searchText = "";
    let inited = false;
    $: if (!inited && apps.size !== 0) {
        filteredCategories = apps;
        filteredCategoriesSorted = Array.from(filteredCategories.keys()).sort((a, b) => {
            return a.localeCompare(b);
        });

        inited = true;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
        if (searchBoxRef && searchBoxRef.isFocus()) return;
        if (event.key === "Backspace") {
            searchText = searchText.slice(0, -1);
        }
        if (IsPrintableKey(event)) {
            searchText += event.key;
        }

        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "a") {
            searchBoxRef.focus();
        }
    };
    document.addEventListener("keydown", handleKeyDown);
    async function onSearch(text: string) {
        const keywords = text
            .trim()
            .toLowerCase()
            .split(/\s+/)
            .filter((kw) => kw.length > 0);

        if (keywords.length === 0) {
            filteredCategories = apps;
            filteredCategoriesSorted = Array.from(filteredCategories.keys()).sort();
            for (const r of categoryRefs) {
                r?.unexpand();
            }
            return;
        }
        const { result, sorted } = Search(apps, keywords);
        filteredCategoriesSorted = sorted;
        filteredCategories = result;
        let isFocusFirst = false;
        await tick();
        for (const r of categoryRefs) {
            if (!r) continue;
            r.expand();
            if (!isFocusFirst) {
                r.focus();
                isFocusFirst = true;
            }
        }
    }
</script>

<div class="sidebar w-full h-full flex flex-col">
    <!-- 可滚动区域 -->
    <div class="flex-1 flex flex-col pl-4 pt-4 pb-1 overflow-hidden">
        <div class="flex flex-col gap-1 overflow-auto pr-4">
            {#each filteredCategoriesSorted as category, i (i)}
                <CategoryItem
                    bind:this={categoryRefs[i]}
                    apps={filteredCategories.get(category)!}
                    {category}
                />
            {/each}
        </div>
    </div>

    <!-- 底部搜索框 -->
    <div class="p-4 border-t border-gray-600">
        <SearchBox onChange={onSearch} bind:this={searchBoxRef} bind:value={searchText} />
    </div>
</div>
