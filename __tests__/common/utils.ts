import path from 'path';

import tempy from 'tempy';
import * as ts from 'typescript';
import latestVersion from 'latest-version';
import { CDN, CdnType } from '../../src';
import { CdnFileIdentifier } from '../../src/cdn-impl/cdn-base';

const createKey = (fileIdentifier: CdnFileIdentifier) => `${fileIdentifier.packageName}@${fileIdentifier.packageVersion}/${fileIdentifier.filePath}`

export const pkg = (pkgIdentifier: string, typesContents: string, {
  dependencies = {},
  typesName = 'types'
} = {}) => {
  const types = 'lib/types.d.ts';
  const packageIdentifierParts = pkgIdentifier.split('@');
  const packageName = packageIdentifierParts.slice(0, -1).join('@');
  const packageVersion = packageIdentifierParts[packageIdentifierParts.length - 1];

  const pkgJson = {
    [createKey({
      packageName,
      packageVersion,
      filePath: 'package.json',
    })]: JSON.stringify({
      name: packageName,
      version: packageVersion,
      [typesName]: types,
      dependencies: {
        ...dependencies
      },
    })
  };

  const typesFile = {
    [createKey({
      packageName,
      packageVersion,
      filePath: types,
    })]: typesContents,
  };

  return {
    ...pkgJson,
    ...typesFile,
  };
};

export const getTestCdnImpl: () => CDN & {
  setMockedNpmPackages: (pkgs: { [key: string]: string }) => void;
  forceErrorOnce: (error: string) => void;
} = () => {

  let packagesInfo: { [key: string]: string } = {};
  const errorsQueue: string[] = [];

  return {
    name: 'test' as CdnType,
    getPackageJsonPaths: async () => ['/package.json'],
    getFileUniqueIdentifier: createKey,
    fetchFromCdn: async (fileIdentifier: CdnFileIdentifier) => {
      const forcedError = errorsQueue.pop();

      if (forcedError) {
        throw new Error(forcedError);
      }

      const cacheKey = createKey(fileIdentifier);
      const content = packagesInfo[cacheKey];
      if (content) {
        return content;
      }
      else {
        throw new Error(`File not found: ${cacheKey}`);
      }
    },
    setMockedNpmPackages: (pkgs: { [key: string]: string }) => {
      packagesInfo = {
        ...packagesInfo,
        ...pkgs,
      }
    },
    forceErrorOnce: (error: string) => {
      errorsQueue.push(error);
    }
  };
}


export async function getLatestVersionName(packageName: string): Promise<string> {
  try {
    const version = await latestVersion(packageName);
    console.log(`Latest version of ${packageName}: ${version}`);
    return `${packageName}@${version}`;
  } catch (error) {
    console.error(`Error fetching latest version for ${packageName}:`, error);
    throw error;
  }
}

export function validateTypescript(code: string, baseDir: string): {
  isValid: boolean;
  messages?: string[]
} {
  const mainFilePath = path.join(baseDir, tempy.file({extension: 'ts'}));
  ts.sys.writeFile(mainFilePath, code);

  const program = ts.createProgram([mainFilePath], {});
  const emitResult = program.emit();

  // Check for diagnostics (errors)
  const allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);
  const diagnosticsCurrentFile = allDiagnostics.filter(diagnostic => diagnostic?.file?.fileName === mainFilePath);
  return {
    isValid: diagnosticsCurrentFile.length === 0,
    messages: diagnosticsCurrentFile.map(diagnostic => diagnostic.messageText.toString()),
  };
}
