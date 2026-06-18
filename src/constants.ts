import { existsSync, readFileSync } from "fs";
import { join } from "path";

type ServiceEntry = string | {
    name: string;
    paths: string[]
}

export interface NormalizedService {
    name: string;
    paths: string[]
}

interface WxConfig {
    root?: string;
    services: ServiceEntry[];
    protectedBranches?: string[];
}

function normalizedEntry(entry: ServiceEntry): NormalizedService {
    return typeof entry === "string" ? { name: entry, paths: [entry] } : entry;
}

// Config lives in the user's project, not next to the installed CLI.
export const CONFIG_PATH = join(process.cwd(), "wx.json");

function loadConfig() : WxConfig {
    // Missing config is fine — the CLI is still usable for `wx help` and
    // `wx service add` (which bootstraps the file). Only malformed JSON throws.
    if (!existsSync(CONFIG_PATH)) {
        return { services: [] };
    }

    return JSON.parse(readFileSync(CONFIG_PATH, "utf-8")) as WxConfig
}

const config = loadConfig();
const normalized_services = config.services.map(normalizedEntry);

export const SERVICES = Object.fromEntries(
    normalized_services.flatMap(({ name, paths }) => paths.map((p) => [ p, name ]))
)

export const CONFIGURED_ROOT: string | undefined = config.root;
export const NORMALIZED_SERVICES: NormalizedService[] = normalized_services;
export const ALL_SERVICES: string[] = ["root", ...normalized_services.map((e) => e.name)];
export const PROTECTED_BRANCHES : string[] = config.protectedBranches ?? [ "main", "master", "staging" ];
export type CommitType = (typeof COMMIT_TYPES)[number];
export const COMMIT_TYPES = [
  "feat",
  "fix",
  "refactor",
  "test",
  "docs",
  "chore",
  "ci",
  "perf",
] as const;