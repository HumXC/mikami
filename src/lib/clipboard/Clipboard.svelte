<script lang="ts">
    import { os, window } from "@mika-shell/core";
    import { hyprland } from "@mika-shell/extra";
    import { onMount } from "svelte";
    import { Search } from "lucide-svelte";
    import hotkeys from "hotkeys-js";
    import Fuse from "fuse.js";
    import { ensureVisible, KeyController, passControlKey } from "../../utils";
    let selected: number = -1;
    type Record = {
        id: number;
        content: string;
    };
    let fuse: Fuse<Record>;
    let allRecords: Record[] = [];
    let records: Record[] = [];
    let input: HTMLInputElement;
    onMount(async () => {
        const payload = await os.exec(["cliphist", "list"], "string");
        payload?.split("\n").forEach((line) => {
            if (line.length === 0) return;
            const [id, content] = line.split("\t");
            allRecords.push({ id: Number(id), content });
        });
        records = allRecords;
        if (records.length > 0) {
            selected = 0;
        }
        fuse = new Fuse(allRecords, {
            keys: ["content"],
            includeScore: true,
            threshold: 0.4,
        });
        input.focus();
    });
    window.init({
        class: "mika-shell-clipboard",
        height: 500,
        width: 320,
        resizable: false,
        backgroundTransparent: true,
    });
    const hyprlandHelper = async (w: hyprland.event.EventMap["activewindow"]) => {
        if (w.windowClass !== "mika-shell-clipboard") return;
        const clipboard = (await hyprland.command.clients()).find(
            (c) => c.class === "mika-shell-clipboard"
        ) as hyprland.types.Client;
        const cursor = await hyprland.command.cursorpos();
        let x = cursor.x - clipboard.at[0];
        let y = cursor.y - clipboard.at[1];
        const monitor = (await hyprland.command.monitors()).find((m) => m.focused)!;
        const gapsOption = JSON.parse(await hyprland.command.getoption("general:gaps_out")).custom;
        let gapx = 0;
        let gapy = 0;
        if (gapsOption) {
            const gaps = gapsOption.split(" ").map(Number);
            gapx = gaps[0];
            gapy = gaps[2];
        }
        const mWidth = monitor.width / monitor.scale;
        const mHeight = monitor.height / monitor.scale;
        if (x + clipboard.at[0] + clipboard.size[0] > mWidth) {
            x = mWidth - clipboard.size[0] - clipboard.at[0] - gapx;
        }
        if (y + clipboard.at[1] + clipboard.size[1] > mHeight) {
            y = mHeight - clipboard.size[1] - clipboard.at[1] - gapy;
        }
        hyprland.command.dispatch("movewindowpixel", `${x} ${y},class:${clipboard.class}`);
        hyprland.event.off("activewindow", hyprlandHelper);
    };
    hyprland.event.on("activewindow", hyprlandHelper);
    const onMousemove = (e: MouseEvent) => {
        if (keyControl.isInControl()) return;
        const target = e.target as HTMLElement;
        selected = Number(target.dataset.index!);
    };
    const isFileUrl = async (id: number) => {
        const payload = await os.exec(["cliphist", "decode", id.toString()], "string");
        if (payload) {
            return payload!.startsWith("file://");
        }
        return false;
    };
    const selectedId = () => {
        if (selected < 0) return -1;
        return records[selected].id;
    };
    const copy = async () => {
        let cmd = `cliphist decode ${selectedId()} | wl-copy`;
        if (await isFileUrl(selectedId())) {
            cmd += " -t text/uri-list";
        }
        await os.exec(["sh", "-c", cmd]);
    };
    const copyAndPaste = async () => {
        let cmd = `cliphist decode ${selectedId()} | wl-copy`;
        if (await isFileUrl(selectedId())) {
            cmd += " -t text/uri-list";
        }
        await os.exec(["sh", "-c", cmd + " && wtype -M ctrl -M shift v"]);
    };
    hotkeys("ctrl+c,space", () => {
        copy();
        window.close();
    });
    hotkeys("esc", () => {
        window.close();
    });
    let keyControl = new KeyController();
    hotkeys("up,left,shift+tab", (e) => {
        e.preventDefault();
        keyControl.control();
        if (selected < 0) return;
        selected = selected - 1 < 0 ? records.length - 1 : selected - 1;
        ensureVisible(containerRef, document.querySelector(`[data-index="${selected}"]`)!);
    });
    hotkeys("shift+up,shift+left", (e) => {
        e.preventDefault();
        keyControl.control();
        if (selected < 0) return;
        selected = 0;
        const container = document.querySelector(".container") as HTMLElement;
        container.scrollTo({ top: 0, behavior: "smooth" });
    });
    hotkeys("down,right,tab", (e) => {
        e.preventDefault();
        keyControl.control();
        if (selected < 0) return;
        selected = selected + 1 >= records.length ? 0 : selected + 1;
        ensureVisible(containerRef, document.querySelector(`[data-index="${selected}"]`)!);
    });
    hotkeys("enter", () => {
        copyAndPaste();
        window.close();
    });

    const onInputChange = async (e: Event) => {
        const value = input.value.trim();
        if (value.length === 0) {
            records = allRecords;
        } else {
            const result = fuse.search(value);
            records = result.map((r) => r.item);
        }

        selected = -1;
        if (records.length > 0) {
            selected = 0;
        }
        ensureVisible(containerRef, document.querySelector(`[data-index="${selected}"]`)!);
    };
    let containerRef: HTMLDivElement;
    document.addEventListener("keydown", (e) => {
        input.focus();
    });
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div class="backgorund w-full h-full flex flex-col p-3">
    <div class="input-box p-3 rounded-xl flex items-center w-full mb-3">
        <Search />
        <input
            bind:this={input}
            class="ml-2 w-full"
            placeholder="Search"
            oninput={onInputChange}
            use:passControlKey={["Enter", "ArrowDown", "ArrowUp", "Tab", "Space"]}
        />
    </div>
    <div
        bind:this={containerRef}
        class="container gap-3 flex flex-col overflow-y-auto overflow-x-hidden"
    >
        {#each records as { id, content }, i}
            <div
                class="content p-2 rounded-md"
                data-index={i}
                onmousemove={onMousemove}
                class:selected={id === (selected >= 0 ? records[selected].id : -1)}
                onclick={copy}
            >
                {content}
            </div>
        {/each}
    </div>
</div>

<style>
    .input-box {
        background-color: var(--bg2);
    }
    .backgorund {
        background-color: var(--bg);
    }
    .content {
        box-sizing: border-box;
        background-color: var(--bg2);
        border: 2px solid rgb(83, 87, 94);
        transition:
            background-color 0.1s ease-in-out,
            border 0.1s ease-in-out;
    }
    .selected {
        background-color: var(--selected);
    }
</style>
