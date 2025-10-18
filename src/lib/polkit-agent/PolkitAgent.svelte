<script lang="ts">
    import { onMount } from "svelte";
    import { getHashSearchParams } from "../../utils";
    import { os, window, polkitAgent } from "@mika-shell/core";
    import { UserCircleIcon } from "lucide-svelte";

    const parmas = getHashSearchParams();
    const data = JSON.parse(parmas.get("data") || "{}") as polkitAgent.Context;
    let user: os.UserInfo | null = null;
    onMount(async () => {
        for (const identity of data.identities) {
            if (identity["unixUser"]) {
                user = await os.getUserInfo(identity["unixUser"]);
                break;
            }
        }
    });

    window.init({
        height: 280,
        width: 600,
        title: "Polkit Agent",
        resizable: false,
        backgroundTransparent: true,
    });

    let isCanceled = false;
    window.on("close-request", () => {
        if (!isCanceled) {
            polkitAgent.cancel(data.cookie);
        }
        return true;
    });
    polkitAgent.on("cancel", () => {
        window.close();
    });

    let password = "";
    let message = "";
    let passwordInput: HTMLInputElement = null as any;
    const handleKeyPress = (event: KeyboardEvent) => {
        if (event.key === "Enter") {
            message = "Authenticating...";
            polkitAgent.auth(data.cookie, user!.name, password).then((result) => {
                if (result.ok) {
                    isCanceled = true;
                    window.close();
                } else {
                    message = result.err!.replace("polkit-agent-helper-1: ", "");
                    passwordInput.select();
                }
            });
        }
        if (event.key === "Escape") {
            polkitAgent.cancel(data.cookie);
            isCanceled = true;
            window.close();
        }
    };
</script>

<!-- svelte-ignore a11y_autofocus -->
<!-- svelte-ignore a11y_missing_attribute -->
<div class="polkit-agent h-full w-full flex p-4 flex-col items-start">
    <h1 class="text-center text-2xl font-bold">Authentication Required</h1>
    <p class="text-lg mb-4 mt-2">{data.message}</p>
    <div class="flex w-full items-start justify-start mb-4 p-4 gap-4 bg-[var(--bg2)] rounded-2xl">
        {#if user}
            {#if user.avatar}
                <img class="rounded-full h-24 w-24 m-1" src={user.avatar} alt={user.name} />
            {:else}
                <UserCircleIcon class="mx-auto text-gray-400" size={96} />
            {/if}
            <div class="flex flex-col gap-2 items-start w-full">
                <span class="text-center text-lg font-bold">{user?.name}</span>
                <input
                    bind:this={passwordInput}
                    onkeypress={handleKeyPress}
                    autofocus={true}
                    type="password"
                    placeholder="Enter Password"
                    class="w-full p-2 border rounded-md"
                    bind:value={password}
                />
                <span class="text-center text-xs">{message}</span>
            </div>
        {:else}
            <span class="text-center text-lg font-bold">Unknown User</span>
        {/if}
    </div>
</div>

<style>
    .polkit-agent {
        background-color: var(--bg);
    }
</style>
