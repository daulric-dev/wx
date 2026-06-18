#!/usr/bin/env bun
import { parseArgs } from "./utils";
import {
  serviceCmd,
  statusCmd,
  affectedCmd,
  commitCmd,
  branchCmd,
  diffCmd,
  runCmd,
  checkoutCmd,
  syncCmd,
  rebaseCmd,
  resetCmd,
  pushCmd,
  helpCmd,
} from "./commands";
import { prCmd } from "./pr";

async function main() {
  const { command, positionals, flags } = parseArgs(process.argv);

  switch (command) {
    case "service":
    case "services":
      return serviceCmd(positionals);
    case "status":
    case "st":
      return statusCmd();
    case "affected":
      return affectedCmd(flags);
    case "commit":
    case "ci":
      return commitCmd(positionals, flags);
    case "branch":
    case "br":
      return branchCmd(positionals, flags);
    case "diff":
      return diffCmd(positionals);
    case "run":
      return runCmd(positionals);
    case "checkout":
    case "co":
      return checkoutCmd(positionals);
    case "sync":
      return syncCmd();
    case "rebase":
      return rebaseCmd(flags);
    case "reset":
      return resetCmd();
    case "push":
      return pushCmd(flags);
    case "pr":
      return prCmd(flags);
    case "help":
    case "--help":
    case "-h":
      return helpCmd();
    default:
      console.error(`\x1b[31mUnknown command:\x1b[0m ${command}\n`);
      helpCmd();
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(`\x1b[31mError:\x1b[0m ${err?.message ?? err}`);
  process.exit(1);
});
