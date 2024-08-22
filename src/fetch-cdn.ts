import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import createDebug from 'debug';
import type { CacheFactory } from './cache';
import { CDN, JSDELIVR_BASE, UNPKG_BASE } from './consts';

const debug = createDebug('fetch-cdn');

function createDataFetcher(cacheFactory: CacheFactory<string, Promise<string>>) {
    const cache = cacheFactory('url-fetch-cache');

    return async function getData(url: string): Promise<string> {
        debug(`Fetching ${url}`);
        if (await cache.has(url)) {
            debug(`Cache hit for ${url}`);
            const cacheResult = await cache.get(url);
            return cacheResult as string;
        }

        const promise: Promise<string> = new Promise(async (resolve, reject) => {
            try {
                const response = await fetch(url);

                if (!response.ok) {
                    throw new Error(`Failed to fetch ${url}`);
                }

                const data = await response.text();

                resolve(data);
            } catch(ex) {
                reject(ex);
            }
        });

        await cache.set(url, promise);

        return promise;
    }
}

export type FetcherFunction = (rootDir: string, packageName: string, packageVersion: string, filePath: string, fileContent?: string) => Promise<string>;
export function createFetcher(cacheFactory: CacheFactory<string, Promise<string>>, cdn: CDN) : FetcherFunction {
    const overallCache = cacheFactory('final-result-save-file-from-package');
    const getData = createDataFetcher(cacheFactory);

    return async function saveFileFromPackage(rootDir, packageName, packageVersion, filePath, fileContent) : Promise<string> {
        // remove leading '/'
        const adjustedFilePath = filePath.replace(rootDir, '').replace(/^\/+/, '');
        if (/^(\.ts|\.d\.ts|.*\/\.ts|.*\/\.d\.ts)$/.test(adjustedFilePath)) {
            return Promise.reject(new Error('Non typescript files should not be saved'));
        }
        const cdnUrl = cdn === CDN.JSDELIVR ? JSDELIVR_BASE : UNPKG_BASE;
        const url = `${cdnUrl}${packageName}@${packageVersion}/${adjustedFilePath}`;
        const overallCacheKey = `${url}|${adjustedFilePath}`;

        if (!await overallCache.has(overallCacheKey)) {
            await overallCache.set(overallCacheKey, new Promise(async (resolve, reject) => {
                try {
                    const data = fileContent || await getData(url);
                    const saveFilePath = path.join(rootDir, adjustedFilePath);
                    await fs.promises.mkdir(path.dirname(saveFilePath), { recursive: true });
                    await fs.promises.writeFile(saveFilePath, data);
                    debug(`Wrote ${saveFilePath}`);
                    resolve(data);
                } catch(ex) {
                    reject(`failed to fetch: ${url}`);
                }
            }));
        } else {
            debug(`Using cached ${overallCacheKey}`);
        }

        return (await overallCache.get(overallCacheKey)) as string;
    };
}
