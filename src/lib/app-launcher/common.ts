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
