const DEFAULT_TIMEOUT = 3000;

const DEFAULT_INTERVAL = 100;

export async function sleep(ms: number) {
    await new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

export async function tryWaitUntilTimeout(
    condition: () => Promise<boolean>,
    timeout: number = DEFAULT_TIMEOUT,
    interval: number = DEFAULT_INTERVAL,
) {
    const start = Date.now();
    while (!await condition()) {
        if (Date.now() - start > timeout) {
            throw new Error("Timeout");
        }
        await sleep(interval);
    }
}
