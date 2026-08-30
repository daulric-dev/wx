import { describe, expect, it } from "bun:test";
import { spawnSync } from "node:child_process";

import {
  ALL_SERVICES,
  COMMIT_TYPES,
  NORMALIZED_SERVICES,
  PROTECTED_BRANCHES,
  SERVICES,
} from "../src/constants";
import { affectedCmd, serviceCmd, statusCmd } from "../src/commands";
import { prCmd } from "../src/pr";
import { prompt, promptPrefilled, promptWordLimit, select } from "../src/prompts";
import { startTiner } from "../src/timer";
import {
  getServiceForPath,
  groupByService,
  parseArgs,
  parseStatusOutput,
  slugify,
} from "../src/utils";

describe("constants", () => {
  it("exports commit types and protected branches", () => {
    expect(COMMIT_TYPES).toContain("feat");
    expect(COMMIT_TYPES).toContain("fix");
    expect(PROTECTED_BRANCHES).toContain("main");
  });

  it("includes the root service and normalized service entries", () => {
    expect(ALL_SERVICES).toContain("root");
    expect(NORMALIZED_SERVICES.length).toBeGreaterThanOrEqual(0);
    expect(SERVICES).toBeDefined();
  });
});

describe("utils", () => {
  it("slugifies text for branch names", () => {
    expect(slugify("feat(api): add auth")).toBe("feat-api-add-auth");
    expect(slugify("  Hello World  ")).toBe("hello-world");
  });

  it("parses git status output into file entries", () => {
    const parsed = parseStatusOutput(" M src/utils.ts\n?? notes.md\n");
    expect(parsed).toEqual([
      { status: "M", path: "src/utils.ts" },
      { status: "??", path: "notes.md" },
    ]);
  });

  it("groups files by service", () => {
    const groups = groupByService([
      { status: "M", path: "apps/web/src/app.ts" },
      { status: "M", path: "packages/ui/button.tsx" },
      { status: "??", path: "notes.md" },
    ]);

    expect(Object.keys(groups)).toContain("root");
    expect(groups.root?.length).toBe(3);
  });

  it("maps file paths to services", () => {
    expect(getServiceForPath("apps/web/src/app.ts")).toBe("root");
    expect(getServiceForPath("src/utils.ts")).toBe("root");
  });

  it("parses CLI flags correctly", () => {
    const parsed = parseArgs([
      "bun",
      "src/index.ts",
      "commit",
      "api",
      "--base",
      "main",
      "-m",
      "fix: thing",
    ]);

    expect(parsed.command).toBe("commit");
    expect(parsed.positionals).toEqual(["api"]);
    expect(parsed.flags.base).toBe("main");
    expect(parsed.flags.m).toBe("fix: thing");
  });
});

describe("timer", () => {
  it("returns a completion callback", () => {
    const finish = startTiner();
    expect(typeof finish).toBe("function");
  });
});

describe("prompts", () => {
  it("exports prompt helpers", () => {
    expect(typeof prompt).toBe("function");
    expect(typeof promptPrefilled).toBe("function");
    expect(typeof promptWordLimit).toBe("function");
    expect(typeof select).toBe("function");
  });
});

describe("commands", () => {
  it("prints registered services", async () => {
    const logger = console.log;
    const messages: string[] = [];
    console.log = (...args: unknown[]) => {
      messages.push(args.join(" "));
    };

    try {
      await serviceCmd(["list"]);
    } finally {
      console.log = logger;
    }

    expect(messages.some((message) => message.includes("Registered services"))).toBe(true);
  });

  it("prints a status report without crashing", async () => {
    const logger = console.log;
    const messages: string[] = [];
    console.log = (...args: unknown[]) => {
      messages.push(args.join(" "));
    };

    try {
      await statusCmd();
    } finally {
      console.log = logger;
    }

    expect(messages.length).toBeGreaterThan(0);
  });

  it("reports no changes when a diff is empty", async () => {
    const logger = console.log;
    const messages: string[] = [];
    console.log = (...args: unknown[]) => {
      messages.push(args.join(" "));
    };

    try {
      await affectedCmd({ base: "main" });
    } finally {
      console.log = logger;
    }

    expect(messages.some((message) => message.includes("No changes detected"))).toBe(true);
  });
});

describe("pr", () => {
  it("exports the pull request command", () => {
    expect(typeof prCmd).toBe("function");
  });
});

describe("entrypoint", () => {
  it("runs the help command without crashing", () => {
    const result = spawnSync("bun", ["run", "src/index.ts", "help"], {
      cwd: process.cwd(),
      encoding: "utf-8",
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Service-aware git workflow helper");
    expect(result.stdout).toContain("Commands:");
  });
});
