import { apps as App, icon as Icon, layer } from "@mika-shell/core";
import { convertToPinyin } from "tiny-pinyin";
import { Sleep } from "../../utils";
// TODO: 去除 AppLauncher.svelte 中的 apps
export const Apps: Map<string, Application> = new Map();
export async function InitApps() {
    const result = JSON.parse(localStorage.getItem("app-launcher-apps") || "[]") as Application[];
    result.forEach((app) => {
        Apps.set(app.id, app);
    });
    ListApps().then((apps) => {
        localStorage.setItem("app-launcher-apps", JSON.stringify(apps));
    });
}
let mouseX = 0;
let mouseY = 0;
document.addEventListener("mousemove", (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
});
export function MouseHasMoved(x: number, y: number): boolean {
    return mouseX !== x || mouseY !== y;
}

export type Application = App.Entry & {
    iconData: string;
};
async function ListApps(): Promise<Application[]> {
    const result: Application[] = [];
    let apps = await App.list();
    apps = apps.filter((app) => !(app.noDisplay || app.hidden));
    for (const app of apps) {
        let icon: string | null = null;

        try {
            icon = await Icon.lookup(app.icon || "", 256);
        } catch {}
        try {
            if (icon === null) {
                icon = await Icon.lookup("application-x-executable-symbolic", 64);
            }
        } catch {}

        let a: Application = {
            ...app,
            iconData: icon || "",
        };
        result.push(a);
    }
    return result;
}
export function IsPrintableKey(event: KeyboardEvent): boolean {
    const key = event.key;
    // 忽略常见控制键
    return key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;
}
export function OnAppRun(app: Application, action?: string) {
    layer.close();
}

function getSearchBody(str: string): { full: string; initials: string } {
    const flag = "#`";
    // 首字母的组合
    let initials = "";
    let lowerName = convertToPinyin(str, flag, true);
    if (lowerName.length === str.length + (str.length - 1) * flag.length) {
        // 不包含拼音
        lowerName = str.toLowerCase();
        lowerName.split(" ").forEach((s) => {
            initials += s.charAt(0);
        });
    } else {
        lowerName.split(flag).forEach((s) => {
            initials += s.charAt(0);
        });
        lowerName = lowerName.replaceAll(flag, "").toLowerCase();
    }
    return { full: lowerName, initials };
}
// 返回搜索得分，搜索的结果越靠前，得分越高
// 得分以负数表示，-1 是最高分，0 表示没有搜索到结果
function searchText(str: string, keyword: string): number {
    const index = str.indexOf(keyword);
    if (index === -1) {
        return 0;
    }
    return -index - 1;
}

// TODO: 优化搜索算法
export function Search(
    payload: Map<string, Application[]>,
    keywords: string[]
): { result: Map<string, Application[]>; sorted: string[] } {
    let result = new Map<string, Application[]>();
    let sorted: string[] = [];

    if (keywords.length === 0) {
        result = payload;
        sorted = Array.from(result.keys()).sort();
        return { result, sorted };
    }

    const seenAppNames = new Set<string>();
    let categoryScores: Array<{
        category: string;
        score: number;
    }> = [];

    for (const [category, apps] of payload.entries()) {
        const lowerCategory = category.toLowerCase();
        let categoryMatchScore = 0;
        for (const kw of keywords) {
            categoryMatchScore += searchText(lowerCategory, kw);
        }
        const matchedApps: { app: Application; score: number }[] = [];
        for (const app of apps) {
            const { full, initials } = getSearchBody(app.name);

            if (seenAppNames.has(full)) continue;

            let score = 0;
            for (const kw of keywords) {
                let sc = searchText(full, kw);
                if (sc === 0) {
                    sc = searchText(initials, kw);
                }
                score += sc;
            }

            if (score !== 0) {
                matchedApps.push({ app, score });
                seenAppNames.add(full);
            }
        }
        const hasAppMatch = matchedApps.length > 0;
        let score = hasAppMatch ? matchedApps.reduce((sum, a) => sum + a.score, 0) : 0;
        if (hasAppMatch) {
            matchedApps.sort((a, b) => b.score - a.score);
            result.set(
                category,
                matchedApps.map(({ app }) => app)
            );
        } else if (categoryMatchScore != 0) {
            result.set(category, apps); // 仅匹配分类名时保留全部 app
        }

        if (categoryMatchScore !== 0 && score - categoryMatchScore >= 0) {
            score = -1;
        } else {
            score -= categoryMatchScore;
        }

        categoryScores.push({ category, score });
    }
    categoryScores = categoryScores
        .filter((item) => item.score !== 0)
        .sort((a, b) => {
            return b.score - a.score;
        });

    sorted = categoryScores.map((item) => item.category);

    return { result, sorted };
}
