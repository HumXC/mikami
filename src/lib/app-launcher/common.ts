import { App, Theme } from "@humxc/mikami";

export class Application extends App.Application {
    IconData: string = "";
}

export async function ListApps(): Promise<Application[]> {
    const result: Application[] = [];
    let apps = await App.List();
    apps = apps.filter((app) => !(app.NoDisplay || app.Hidden));
    for (const app of apps) {
        let icon = await Theme.LookupIcon(app.Icon, 64);
        if (icon === "") {
            icon = await Theme.LookupIcon("application-x-executable", 64);
        }
        const a = new Application(app);
        a.IconData = icon;
        result.push(a);
    }
    return result;
}
export function IsPrintableKey(event: KeyboardEvent): boolean {
    const key = event.key;
    // 忽略常见控制键
    return key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;
}

export function OnRun(app: App.Application, action?: string) {
    console.log(app);
    // Layer.Close();
}
export function Search(
    payload: Map<string, Application[]>,
    text: string
): { result: Map<string, Application[]>; sorted: string[] } {
    let result = new Map<string, Application[]>();
    let sorted: string[] = [];

    const keywords = text
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .filter((kw) => kw.length > 0);

    if (keywords.length === 0) {
        result = payload;
        sorted = Array.from(result.keys()).sort();
        return { result, sorted };
    }

    const seenAppNames = new Set<string>();
    const categoryScores: Array<{
        category: string;
        score: number; // 用于排序
        hasAppMatch: boolean;
    }> = [];

    for (const [category, apps] of payload.entries()) {
        const lowerCategory = category.toLowerCase();

        let categoryMatchScore = Infinity;
        for (const kw of keywords) {
            const idx = lowerCategory.indexOf(kw);
            if (idx !== -1) categoryMatchScore = Math.min(categoryMatchScore, idx);
        }

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

        const hasAppMatch = matchedApps.length > 0;

        if (hasAppMatch || categoryMatchScore !== Infinity) {
            if (hasAppMatch) {
                matchedApps.sort((a, b) => a.matchIndex - b.matchIndex);
                result.set(
                    category,
                    matchedApps.map(({ app }) => app)
                );
            } else {
                result.set(category, apps); // 仅匹配分类名时保留全部 app
            }

            const score = hasAppMatch
                ? matchedApps.reduce((sum, a) => sum + a.matchIndex, 0)
                : categoryMatchScore + 10000; // 没有 app 匹配的得一个更大的分数排后

            categoryScores.push({ category, score, hasAppMatch });
        }
    }

    // 排序规则：优先有 app 匹配的，再按 score 升序
    categoryScores.sort((a, b) => {
        if (a.hasAppMatch && !b.hasAppMatch) return -1;
        if (!a.hasAppMatch && b.hasAppMatch) return 1;
        return a.score - b.score;
    });

    sorted = categoryScores.map((item) => item.category);

    return { result, sorted };
}
