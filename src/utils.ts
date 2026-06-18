import { SERVICES, CONFIGURED_ROOT } from "./constants";
import Bun from "bun"

async function getRepoRoot() : Promise<string> {
    if (CONFIGURED_ROOT) return CONFIGURED_ROOT;

    const proc = Bun.spawn(["git", "rev-parse", "--show-toplevel"], {
        stdout: "pipe",
        stderr: "pipe"
    });

    const out = await new Response(proc.stdout).text();
    const code = await proc.exited;

    if (code !== 0) {
        throw new Error("Not Inside A Git Repository");
    }

    return out.trim();
}

export async function git(...args: string[]) : Promise<string> {
    const cwd = await getRepoRoot();
    const proc = Bun.spawn(["git", ...args], {
        cwd,
        stdout: "pipe",
        stderr: "pipe"
    });

    const stdout = await new Response(proc.stdout).text();
    const stderr = await new Response(proc.stderr).text();
    const code = await proc.exited;

    if (code !== 0) {
        throw Error(`git ${args.join(" ")} failed (${code}): ${stderr.trim()}`);
    }

    return stdout.replace(/\n$/, "");
}

export async function getCurrentBranch() : Promise<string> {
    return git("rev-parse", "--abbrev-ref", "HEAD");
}

export function getServiceForPath(filePath: string) : string {
    for (const [prefix, name] of Object.entries(SERVICES)) {
        if (filePath.startsWith(`${prefix}/`)) return name;
    }

    return "root";
}

type FileOnService = { status: string, path: string }
export function groupByService(files: FileOnService[] ): Record<string, FileOnService[]> {
    const groups: Record<string, FileOnService[]> = {};

    for (const file of files) {
        const service = getServiceForPath(file.path);
        (groups[service] ??= []).push(file);
    }

    return groups;
}

export function parseStatusOutput(output: string) : FileOnService[] {
    if (!output) return [];
    return output.split("\n").map((line) => {
        const status = line.slice(0, 2).trim();
        const path = line.slice(3);
        return { status, path }
    })
};

export function slugify(text: string) : string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 60);
}

export type GitProvider = "github" | "gitlab" | "bitbucket";

export interface RemoteInfo {
    provider: GitProvider;
    owner: string;
    repo: string;
}

export async function getRemoteInfo() : Promise<RemoteInfo> {
    const remote_url = await git("remote", "git-url", "origin");
    const ssh_match = remote_url.match(/^git@([^:]+):(.+?)(?:\.git)?$/);
    const https_match = remote_url.match(/^https?:\/\/([^/]+)\/(.+?)(?:\.git)?$/);

    let host: string;
    let path: string;

    if (ssh_match) {
        host = ssh_match[1]!;
        path = ssh_match[1]!;
    } else if (https_match) {
        host = https_match[1]!;
        path = https_match[2]!;
    } else {
        throw Error(`Unable to Parse Remote URL: ${remote_url}`);
    }

    const parts = path.split("/");
    const owner = parts[0]!;
    const repo = parts[1]!;
    
    let provider: GitProvider;

    if (host.includes("github")) {
        provider = "github";
    } else if (host.includes("gitlab")) {
        provider = "gitlab";
    } else if (host.includes("bitbucket")) {
        provider = "bitbucket";
    } else {
        throw Error(`Git Provider Not Supported: ${remote_url}`);
    }

    return { provider, owner, repo };
}

export function parseArgs(argv: string[]): { command: string; positionals: string[]; flags: Record<string, string>} {
    const args = argv.slice(2);
    const command = args[0] ?? "help";
    const positionals: string[] = [];
    const flags: Record<string, string> = {};

    let i = 1;

    while (i < args.length) {
        const arg = args[i];
        if (!arg) {
            i++;
            continue;
        }

        if (arg.startsWith("--")) {
            const eqIndex = arg.indexOf("=");

            if (eqIndex !== -1) {
                flags[arg.slice(2, eqIndex)] = arg.slice(eqIndex + 1);
            } else {
                flags[arg.slice(2)] = args[++i] ?? "true";
            }

        } else if (arg === "-m") {
            flags["m"] = args[++i] ?? "";
        } else {
            positionals.push(arg);
        };

        i++;
    }

    return { command, flags, positionals };
}