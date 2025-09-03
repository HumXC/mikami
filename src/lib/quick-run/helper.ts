import { os } from "@mika-shell/core";

export type Payload = {
    type: "shell-alias" | "shell-function";
    name: string;
};
export const shellData: Payload[] = JSON.parse(
    localStorage.getItem("quick-run-shell-data") || "[]"
);
export const shell = localStorage.getItem("quick-run-shell") || "bash";
const shellParser = {
    fish: {
        alias: {
            cmd: ["fish", "-i", "-c", "alias"],
            parse: (data: string): Payload[] => {
                const start = data.lastIndexOf("\\");
                const lines = data.slice(start + 1).split("\n");
                const result: Payload[] = lines.map((line) => {
                    const [_, name, __] = line.split(" ");
                    return { type: "shell-alias", name };
                });
                return result.filter((item) => item.name && item.name.length > 0);
            },
        },
        functions: {
            cmd: ["fish", "-i", "-c", "functions"],
            parse: (data: string): Payload[] => {
                const start = data.lastIndexOf("\\");
                const lines = data.slice(start + 1).split("\n");
                const result: Payload[] = lines.map((line) => {
                    const [name] = line.split(", ");
                    return { type: "shell-function", name };
                });
                return result.filter(
                    (item) => item.name && !item.name.startsWith("fish_") && item.name.length > 0
                );
            },
        },
    },
    bash: {
        alias: {
            cmd: ["bash", "-i", "-c", "alias"],
            parse: (data: string): Payload[] => {
                const lines = data.split("\n");
                const result: Payload[] = lines.map((line) => {
                    const [name, _] = line.split("=");
                    return { type: "shell-alias", name: name.replace("alias ", "") };
                });
                return result.filter((item) => item.name && item.name.length > 0);
            },
        },
        functions: {
            cmd: ["bash", "-i", "-c", "declare -F"],
            parse: (data: string): Payload[] => {
                const lines = data.split("\n");
                const result: Payload[] = lines.map((line) => {
                    const [_, __, name] = line.split(" ");
                    return { type: "shell-function", name };
                });
                return result.filter(
                    (item) => item.name && !item.name.startsWith("_") && item.name.length > 0
                );
            },
        },
    },
};
async function parseShellData(shell: string): Promise<Payload[]> {
    const shell_ = shell.split("/").pop() || "";
    if (!["bash", "fish"].includes(shell_)) return [];
    const parser = (shellParser as any)[shell_];
    const aliases = await os.exec(parser.alias.cmd, "string");

    const functions = await os.exec(parser.functions.cmd, "string");
    return [...parser.alias.parse(aliases), ...parser.functions.parse(functions)];
}
const _ = null;
(async () => {
    const lastUpdateTime = Number(localStorage.getItem("quick-run-last-update-time") || "0");
    const currentTime = new Date().getTime();
    if (currentTime - lastUpdateTime <= 1000 * 60 * 10) return;
    localStorage.setItem("quick-run-last-update-time", String(currentTime));
    const shell = (await os.getEnv("SHELL")) || "bash";
    localStorage.setItem("quick-run-shell", shell);
    localStorage.setItem("quick-run-shell-data", JSON.stringify(await parseShellData(shell)));
})();
