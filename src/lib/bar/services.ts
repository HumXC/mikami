import { apps, icon, mika, notifd } from "@mika-shell/core";
import { writable } from "svelte/store";
export let notifyQuiet = writable(false);

export class Notification {
    data: notifd.Notification;
    private service: NotificationService;
    constructor(service: NotificationService, data: notifd.Notification) {
        this.data = data;
        this.service = service;
    }
    get summary(): string {
        return this.data.summary;
    }
    get body(): string {
        return this.data.body;
    }
    get id(): number {
        return this.data.id;
    }
    get date(): string {
        const ts = Number(this.data.timestamp / 1_000_000); // ns → ms
        const d = new Date(ts);
        const now = new Date();

        const pad = (n: number) => n.toString().padStart(2, "0");

        // 取出日期部分（不含时间）
        const startOfDay = (date: Date) =>
            new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const diffMs = startOfDay(d).getTime() - startOfDay(now).getTime();
        const diffDays = Math.round(diffMs / 86400000); // 86400000 = 1天

        const timeStr = `${pad(d.getHours())}:${pad(d.getMinutes())}`;

        if (diffDays === 0) {
            // 今天
            return timeStr;
        } else if (diffDays === -1) {
            // 昨天
            return `昨天 ${timeStr}`;
        } else if (diffDays === 1) {
            // 明天
            return `明天 ${timeStr}`;
        } else if (diffDays === 2) {
            return `后天 ${timeStr}`;
        } else if (diffDays < 0 && diffDays >= -6) {
            // 过去 2～6 天
            return `${Math.abs(diffDays)}天前 ${timeStr}`;
        } else if (diffDays > 0 && diffDays <= 6) {
            // 未来 2～6 天
            return `${diffDays}天后 ${timeStr}`;
        } else {
            // 超过 7 天
            return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${timeStr}`;
        }
    }

    async getIcon(): Promise<string | null> {
        const n = this.data;
        if (n.hints.imageData) return n.hints.imageData.base64;
        try {
            if (n.hints.imagePath) return await icon.lookup(n.hints.imagePath, 256);
        } catch (e) {}
        try {
            if (n.appIcon) return await icon.lookup(n.appIcon, 256);
        } catch (e) {}
        try {
            if (n.appName) return await icon.lookup(n.appName, 256);
        } catch (e) {}
        return null;
    }
    activate() {
        notifd.activate(this.data.id);
    }
    dismiss() {
        notifd.dismiss(this.data.id);
        this.service.delete(this.data.id);
        this.service.onRemoved(this.data.id);
        this.service.updateState();
    }
}
export class NotificationService {
    channel: BroadcastChannel = new BroadcastChannel("mika-notification");
    private db: IDBDatabase = null as any;
    onAdded: (n: Notification) => void = () => {};
    onRemoved: (id: number) => void = () => {};
    onStateChanged: (state: "empty" | "notified") => void = () => {};
    onDNDChanged: (value: boolean) => void = () => {};
    private isPopoup = false;
    private waitList: Function[] = [];
    private __doNotDisturb = false;
    state: "empty" | "notified" = "empty";
    private __showPopover = true;
    get showPopover(): boolean {
        return this.__showPopover;
    }
    set showPopover(value: boolean) {
        this.__showPopover = value;
        this.channel.postMessage({ message: "showPopover", value });
    }

    constructor(popover: string | null = null) {
        this.channel.onmessage = (event) => {
            switch (event.data.message) {
                case "dnd":
                    this.__doNotDisturb = event.data.value;
                    this.onDNDChanged(event.data.value);
                    break;
                case "popoup":
                    this.isPopoup = true;
                    break;
                case "popodown":
                    this.isPopoup = false;
                    break;
                case "showPopover":
                    this.__showPopover = event.data.value;
                    break;
                default:
                    break;
            }
        };
        let request = indexedDB.open("notification");
        request.onupgradeneeded = (event: any) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains("notifications")) {
                db.createObjectStore("notifications", { keyPath: "id" });
            }
            if (!db.objectStoreNames.contains("key-value")) {
                db.createObjectStore("key-value");
            }
        };

        request.onsuccess = async (event: any) => {
            this.db = event.target.result;
            const last = await GetLastNotification(this.db);
            notifd.setId(last ? last.id + 0 : 0);
            notifd.on("added", async (id) => {
                if ((await Get(this.db, id)) !== null) return;
                const n = await notifd.get(id);
                this.put(n);
                if (!this.doNotDisturb) {
                    this.onAdded(new Notification(this, n));
                    if (n.replacesId !== 0) {
                        this.delete(n.replacesId);
                    }
                    if (popover && this.showPopover && !this.isPopoup) {
                        this.isPopoup = true;
                        this.channel.postMessage({ message: "popoup" });
                        mika.open(popover + "?id=" + id).finally(() => {
                            this.isPopoup = false;
                            this.channel.postMessage({ message: "popodown" });
                        });
                    }
                }

                this.state = "notified";
                this.onStateChanged("notified");
            });
            notifd.on("removed", (id) => {
                this.delete(id);
                this.onRemoved(id);
                this.updateState();
            });
            this.waitList.forEach((f) => f());
            this.waitList = [];
            this.get("doNotDisturb").then((value) => {
                this.__doNotDisturb = value;
                this.onDNDChanged(value);
            });
            this.updateState();
        };
        request.onerror = (event: any) => {
            console.error("Failed to open indexedDB", event);
        };
    }
    delete(id: number) {
        const tx = this.db.transaction("notifications", "readwrite");
        const store = tx.objectStore("notifications");
        store.delete(id);
    }
    private async put(n: notifd.Notification) {
        const tx = this.db.transaction("notifications", "readwrite");
        const store = tx.objectStore("notifications");
        const request = store.put(n);
        request.onerror = (event: any) => {
            console.error("Failed to put notification to indexedDB", event);
        };
    }
    async ready(): Promise<void> {
        if (this.db !== null) {
            return;
        }
        return new Promise((resolve, reject) => {
            this.waitList.push(() => {
                resolve();
            });
        });
    }
    get doNotDisturb(): boolean {
        return this.__doNotDisturb;
    }
    set doNotDisturb(value: boolean) {
        this.__doNotDisturb = value;
        this.set("doNotDisturb", value);
        this.onDNDChanged(value);
        this.channel.postMessage({ message: "dnd", value });
    }

    private async get(key: string): Promise<any> {
        const tx = this.db.transaction("key-value", "readonly");
        const store = tx.objectStore("key-value");
        const request = store.get(key);
        return new Promise((resolve, reject) => {
            request.onsuccess = (event: any) => {
                if (event.target.result) {
                    resolve(event.target.result);
                } else {
                    resolve(null);
                }
            };
            request.onerror = (event: any) => {
                reject(event);
            };
        });
    }
    private async set(key: string, value: any): Promise<void> {
        const tx = this.db.transaction("key-value", "readwrite");
        const store = tx.objectStore("key-value");
        const request = store.put(value, key);
        return new Promise((resolve, reject) => {
            request.onsuccess = (event: any) => {
                resolve();
            };
            request.onerror = (event: any) => {
                reject(event);
            };
        });
    }
    list(start: number | null = null): Promise<Notification[]> {
        const tx = this.db.transaction("notifications", "readonly");
        const store = tx.objectStore("notifications");
        if (start !== null) {
            const range = IDBKeyRange.lowerBound(start);
            const req = store.openCursor(range);
            return new Promise((resolve, reject) => {
                const result: Notification[] = [];
                req.onsuccess = (e: any) => {
                    const cursor = e.target.result;
                    if (cursor) {
                        result.push(new Notification(this, cursor.value as any));
                        cursor.continue();
                    } else {
                        resolve(result);
                    }
                };
                req.onerror = (event: any) => {
                    reject(event);
                };
            });
        } else {
            const req = store.getAll();
            return new Promise((resolve, reject) => {
                req.onsuccess = (e: any) => {
                    resolve(
                        (e.target.result as notifd.Notification[]).map(
                            (n) => new Notification(this, n)
                        )
                    );
                };
                req.onerror = (event: any) => {
                    reject(event);
                };
            });
        }
    }
    updateState() {
        const tx = this.db.transaction("notifications", "readonly");
        const store = tx.objectStore("notifications");
        const state = this.state;
        store.count().onsuccess = (e: any) => {
            if (e.target.result === 0) {
                this.state = "empty";
                if (state !== "empty") {
                    this.onStateChanged("empty");
                }
            } else {
                this.state = "notified";
                if (state !== "notified") {
                    this.onStateChanged("notified");
                }
            }
        };
    }
}
function Get(db: IDBDatabase, id: number): Promise<notifd.Notification | null> {
    const tx = db.transaction("notifications", "readonly");
    const store = tx.objectStore("notifications");
    const request = store.get(id);

    return new Promise((resolve, reject) => {
        request.onsuccess = (event: any) => {
            if (event.target.result !== undefined) {
                resolve(event.target.result as any);
            } else {
                resolve(null);
            }
        };
        request.onerror = (event: any) => {
            reject(event);
        };
    });
}

function GetLastNotification(db: IDBDatabase): Promise<notifd.Notification | null> {
    const tx = db.transaction("notifications", "readonly");
    const store = tx.objectStore("notifications");

    const req = store.openCursor(null, "prev"); // 按主键倒序遍历，只取第一条

    return new Promise((resolve, reject) => {
        req.onsuccess = (e: any) => {
            const cursor = e.target.result;
            if (cursor) {
                resolve(cursor.value as any);
            } else {
                resolve(null);
            }
        };
        req.onerror = (event: any) => {
            reject(event);
        };
    });
}
