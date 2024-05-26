import { rollup } from 'rollup';
// @ts-ignore
import dts from "rollup-plugin-dts";
import { createFetcher } from './fetch-unpkg';
import { tsResolvePlugin } from './ts-resolve';
import tempy from 'tempy';
import path from 'path';
import { cacheFactoryFactory } from './cache';
import {createPackageTypes} from "./create-entry-file";
import typesFixerPostprocess from "./rollup-plugin-postprocess";

interface BundleOptions {
    wrapWithModuleDeclare?: boolean;
}

const entryFilePath = '__tmp-type-bundle__index.d.ts';

export async function bundle(packageIdentifier: string, outputFilePath: string, options: BundleOptions = {}) {
    try {
        const cache = cacheFactoryFactory();
        const packageIdentifierParts = packageIdentifier.split('@');
        const packageName = packageIdentifierParts.slice(0, -1).join('@');
        const packageVersion = packageIdentifierParts[packageIdentifierParts.length - 1];
        console.log(`Trying to bundle package: ${packageName} version:${packageVersion} to ${outputFilePath}`);
        let resultCode = undefined;
        await tempy.directory.task(async tempDirectory => {
            const saveFileFromPackage = createFetcher(cache.cacheFactory);
            const loadFileForPackage = (filePath: string, content?: string) => saveFileFromPackage(tempDirectory, packageName, packageVersion, filePath, content);
            const typesEntryContent = await createPackageTypes(packageName, packageVersion, loadFileForPackage);
            // load the generated file to the cache so it is
            await loadFileForPackage(entryFilePath, typesEntryContent);
            const pkgPath = tempDirectory;

            const inputOptions = {
                input: path.join(pkgPath, entryFilePath),
                plugins: [
                    tsResolvePlugin({
                        projectRootPath: pkgPath,
                        saveFileFromPackage,
                    }),
                    dts(),
                    typesFixerPostprocess()

                ],
            };

            const bundle = await rollup(inputOptions);
            const result = await bundle.write({ file: outputFilePath });

            const outputCode = result.output[0].code;
            resultCode = outputCode;
		});

        await cache.clearCache();
        return resultCode;
    } catch(ex) {
        console.error(ex);
    }
}
