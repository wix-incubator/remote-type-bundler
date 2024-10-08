import { rollup } from 'rollup';
// @ts-ignore
import dts from 'rollup-plugin-dts';
import { createFetcher } from './fetch-cdn';
import { tsResolvePlugin } from './ts-resolve';
import tempy from 'tempy';
import path from 'path';
import { cacheFactoryFactory } from './cache';
import { createPackageTypes } from './create-entry-file';
import { typesFixerPostprocess, importsFixer } from './rollup-plugin-postprocess';
import fs from 'fs-extra';
import { CdnType } from './consts';
import { CDN } from './cdn-impl/cdn-base';
import { cdnFactory } from './cdn-factory';
import { isCodeValid } from './validate-output';

export { CdnType, CDN };

export interface BundleOptions {
  wrapWithModuleDeclare?: boolean;
  retries?: number,
  retryDelayMs?: number,
  cdn?: CdnType,
  cdnImpl?: CDN,
}

const entryFilePath = '__tmp-type-bundle__index.d.ts';

export async function bundleOnce(packageName: string, packageVersion: string, outputFilePath: string, { cdnImpl }: { cdnImpl: CDN }) {
  const cache = cacheFactoryFactory();
  console.log(`Trying to bundle package: ${packageName} version:${packageVersion} to ${outputFilePath} using cdn ${cdnImpl.name}`);
  let resultCode: string = '';

  await tempy.directory.task(async tempyDirectory => {
    let tempDirectory = tempyDirectory;
    if (process.env.PERSIST_OUTPUT === 'true') {
      const backupDir = './test-me-results/bundler-temp';
      fs.removeSync(backupDir);

      fs.ensureDirSync(backupDir);
      tempDirectory = backupDir;
    }

    const saveFileFromPackage = createFetcher(cache.cacheFactory, cdnImpl);
    const loadFileForPackage = (filePath: string, content?: string) => saveFileFromPackage(tempDirectory, packageName, packageVersion, filePath, content);
    const typesEntryContent = await createPackageTypes(packageName, packageVersion, loadFileForPackage, cdnImpl);
    // load the generated file to the cache so it will start the process of generating the d.ts definitions to all package entries
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
        typesFixerPostprocess(),
        importsFixer(),
      ],
    };

    const bundle = await rollup(inputOptions);
    const result = await bundle.write({file: outputFilePath});

    const outputCode = result.output[0].code;
    const { isValid, match } = isCodeValid(outputCode);
    if (!isValid) {
      console.error(`Invalid output code for ${packageName}@${packageVersion}`, match?.[0]);
      throw new Error(`Invalid output code for ${packageName}@${packageVersion}`);
    }
    resultCode = outputCode;
  });

  await cache.clearCache();
  return resultCode;
}

export async function bundle(
  packageIdentifier: string,
  outputFilePath: string,
  { retries = 2, retryDelayMs = 1, cdn = CdnType.JSDELIVR, cdnImpl }: BundleOptions = {},
): Promise<string | undefined> {
  const packageIdentifierParts = packageIdentifier.split('@');
  const packageName = packageIdentifierParts.slice(0, -1).join('@');
  const packageVersion = packageIdentifierParts[packageIdentifierParts.length - 1];
  cdnImpl = cdnImpl || cdnFactory(cdn);
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await bundleOnce(packageName, packageVersion,outputFilePath, { cdnImpl });
      if (!result) {
        throw new Error(`failed to get valid response for ${packageIdentifier}, result is empty`)
      }
      return result;
    } catch (error) {
      console.warn(`Bundle attempt ${attempt + 1} failed:`, error);
      if (attempt < retries) {
        console.log(`Retrying in ${retryDelayMs} millis...`);
        await new Promise(resolve => setTimeout(resolve, retryDelayMs));
      } else {
        console.error(error);
        return undefined;
      }
    }
  }
}
