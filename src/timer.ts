export function startTiner() {
    const start = performance.now();

    return function() {
        const ms = performance.now() - start;
        if (ms < 1000) {
            console.log(`\n\x1b[90mDone in ${Math.round(ms)}ms\x1b[0m`);
        } else {
            console.log(`\n\x1b[90mDone in ${(ms / 1000).toFixed(2)}s\x1b[0m`);
        }
    }
}