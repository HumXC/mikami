<script lang="ts">
    import { App, Layer, Theme, Window } from "@humxc/mikami";
    import { onMount, tick } from "svelte";
    import CategoryItem from "./CategoryItem.svelte";
    import SearchBox from "./SearchBox.svelte";
    import { Application, IsPrintableKey, ListApps } from "./common";
    import { Sleep } from "../../utils";
    let apps: Application[] = [];
    let appsByCategory: Map<string, Application[]> = new Map();
    let filteredCategories: Map<string, Application[]> = new Map();
    let filteredCategoriesSorted: string[] = [];
    let categoryRefs: CategoryItem[] = [];
    let searchBoxRef: SearchBox;

    ListApps().then(async (result) => {
        apps = result;
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
    });
    const onRun = (app: App.Application, action?: string) => {
        console.log(app);
        // Layer.Close();
    };
    // Layer.Init({
    //     Height: 100,
    //     Anchor: ["top", "right", "left"],
    //     Layer: "top",
    //     Margin: [8, 8, 0, 8],
    //     AutoExclusiveZoneEnable: true,
    //     KeyboardMode: "on-demand",
    // });
    Window.Init();
    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.code === "Escape") {
            Layer.Close();
        }
        if (IsPrintableKey(event)) searchBoxRef?.getFocus();
    };
    onMount(() => {
        document.addEventListener("keydown", handleKeyDown);
    });
    function onSearch(text: string) {
        const keywords = text
            .trim()
            .toLowerCase()
            .split(/\s+/)
            .filter((kw) => kw.length > 0);

        filteredCategoriesSorted = [];
        if (keywords.length === 0) {
            filteredCategories = appsByCategory;
            filteredCategoriesSorted = Array.from(filteredCategories.keys()).sort();
            for (const r of categoryRefs) {
                r?.unexpand();
            }
            return;
        }

        const seenAppNames = new Set<string>();
        const result = new Map<string, Application[]>();
        const categoryScores: Array<{ category: string; score: number }> = [];

        for (const [category, apps] of appsByCategory.entries()) {
            const lowerCategory = category.toLowerCase();
            const categoryMatch = keywords.some((kw) => lowerCategory.includes(kw));
            const matchedApps: { app: Application; matchIndex: number }[] = [];

            for (const app of apps) {
                const lowerName = app.Name.toLowerCase();
                if (seenAppNames.has(lowerName)) continue;

                let matchIndex = Infinity;
                for (const kw of keywords) {
                    const index = lowerName.indexOf(kw);
                    if (index >= 0) matchIndex = Math.min(matchIndex, index);
                }

                if (matchIndex !== Infinity) {
                    matchedApps.push({ app, matchIndex });
                    seenAppNames.add(lowerName);
                }
            }

            if (categoryMatch || matchedApps.length > 0) {
                // 排序 app，根据匹配的索引排序（匹配越靠前越优先）
                matchedApps.sort((a, b) => a.matchIndex - b.matchIndex);

                // 仅保留排序后的 app
                result.set(
                    category,
                    matchedApps.map(({ app }) => app)
                );

                // 类别的匹配得分（越前面匹配的 app 排得越靠前）
                const topMatchScore = matchedApps.reduce(
                    (score, { matchIndex }) => score + (matchIndex === 0 ? -1 : 0),
                    0
                );
                categoryScores.push({ category, score: topMatchScore });
            }
        }

        // 排序 categories（得分低的排前面）
        categoryScores.sort((a, b) => a.score - b.score);
        filteredCategoriesSorted = categoryScores.map((item) => item.category);

        filteredCategories = result;

        for (const r of categoryRefs) {
            r?.expand();
        }
    }
</script>

<!-- svelte-ignore a11y_missing_attribute -->
<div class="w-full h-full">
    <!-- sidebar -->
    <div class="sidebar w-70 h-full flex flex-col">
        <!-- 可滚动区域 -->
        <div class="flex-1 flex flex-col pl-4 pt-4 overflow-hidden">
            <div class="flex flex-col gap-1 overflow-auto pr-4">
                {#each filteredCategoriesSorted as category, i (i)}
                    <CategoryItem
                        bind:this={categoryRefs[i]}
                        apps={filteredCategories.get(category)!}
                        {category}
                        {onRun}
                    />
                {/each}
            </div>
        </div>

        <!-- 底部搜索框 -->
        <div class="p-4 border-t border-gray-300">
            <SearchBox onChange={onSearch} bind:this={searchBoxRef} />
        </div>
    </div>

    <!-- cards -->
    <div></div>
</div>

<style>
    .sidebar {
        background-color: rgb(8, 14, 24);
        color: rgb(198, 198, 198);
    }
</style>
