import { performance } from 'perf_hooks';

export interface LogMethodOptions {
    logArgs?: boolean;
    logResult?: boolean;
    logDuration?: boolean;
    maxArgLength?: number;
}

export function LogMethod(options: LogMethodOptions = {}) {
    const {
        logArgs = true,
        logResult = false,
        logDuration = true,
        maxArgLength = 100
    } = options;

    return function (
        _target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            const logger = (this as any).logger;

            if (!logger) {
                return originalMethod.apply(this, args);
            }

            const callId = Math.random().toString(36).substring(2, 9);
            const methodLogger = logger.child({
                method: propertyKey,
                callId
            });

            const logMeta: any = {};
            if (logArgs) {
                // Truncate large arguments to avoid log bloat
                logMeta.args = args.map(arg => {
                    const str = JSON.stringify(arg);
                    return str && str.length > maxArgLength
                        ? str.substring(0, maxArgLength) + '...'
                        : arg;
                });
            }

            methodLogger.trace(`→ ${propertyKey}`, logMeta);
            const start = performance.now();

            try {
                const result = await Promise.resolve(originalMethod.apply(this, args));

                const completeMeta: any = {};
                if (logDuration) {
                    completeMeta.durationMs = Math.round(performance.now() - start);
                }
                if (logResult && result !== undefined) {
                    const resultStr = JSON.stringify(result);
                    completeMeta.result = resultStr && resultStr.length > maxArgLength
                        ? resultStr.substring(0, maxArgLength) + '...'
                        : result;
                }

                methodLogger.debug(`← ${propertyKey}`, completeMeta);
                return result;
            } catch (error) {
                const errorMeta: any = {
                    durationMs: Math.round(performance.now() - start)
                };

                methodLogger.error(`✗ ${propertyKey}`, error, errorMeta);
                throw error;
            }
        };

        return descriptor;
    };
}