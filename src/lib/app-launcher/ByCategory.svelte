<script lang="ts">
    import CategoryItem from "./CategoryItem.svelte";
    import SearchBox from "./SearchBox.svelte";
    import { Application, IsPrintableKey, Search } from "./common";
    export let apps: Application[] = [];
    let appsByCategory: Map<string, Application[]> = new Map();
    let filteredCategories: Map<string, Application[]> = new Map();
    let filteredCategoriesSorted: string[] = [];
    let categoryRefs: CategoryItem[] = [];
    let searchBoxRef: SearchBox;
    let searchText = "";
    let inited = false;
    $: if (!inited && apps.length !== 0) {
        appsByCategory = apps.reduce((acc, app) => {
            const category = app.Categories || ["Others"];
            for (const cat of category) {
                if (!acc.has(cat)) {
                    acc.set(cat, []);
                }
                acc.get(cat)!.push(app);
            }
            return acc;
        }, appsByCategory);
        filteredCategories = appsByCategory;
        filteredCategoriesSorted = Array.from(filteredCategories.keys()).sort();
        inited = true;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
        if (searchBoxRef && searchBoxRef.isFocus()) return;
        let handled = false;
        if (event.key === "Backspace") {
            searchText = searchText.slice(0, -1);
            handled = true;
        }
        if (IsPrintableKey(event)) {
            searchText += event.key;
            handled = true;
        }
        if (handled) {
            onSearch(searchText);
        }
    };
    document.addEventListener("keydown", handleKeyDown);
    function onSearch(text: string) {
        const keywords = text
            .trim()
            .toLowerCase()
            .split(/\s+/)
            .filter((kw) => kw.length > 0);

        if (keywords.length === 0) {
            filteredCategories = appsByCategory;
            filteredCategoriesSorted = Array.from(filteredCategories.keys()).sort();
            for (const r of categoryRefs) {
                r?.unexpand();
            }
            return;
        }
        const { result, sorted } = Search(appsByCategory, text);
        filteredCategoriesSorted = sorted;
        filteredCategories = result;
        let isFocusFirst = false;
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
    <div class="flex-1 flex flex-col pl-4 pt-4 overflow-hidden">
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
    <div class="p-4 border-t border-gray-300">
        <SearchBox onChange={onSearch} bind:this={searchBoxRef} bind:value={searchText} />
    </div>
</div>
