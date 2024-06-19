import path from 'path';

const UNPKG_BASE = 'https://unpkg.com/';
import type fetch from 'node-fetch';
import tempy from 'tempy';
import * as ts from 'typescript';
import latestVersion from 'latest-version';

export const pkg = (pkgIdentifier: string, typesContents: string, {
  dependencies = {},
  typesName = 'types'
} = {}) => {
  const types = 'lib/types.d.ts';
  const packageIdentifierParts = pkgIdentifier.split('@');
  const packageName = packageIdentifierParts.slice(0, -1).join('@');
  const packageVersion = packageIdentifierParts[packageIdentifierParts.length - 1];

  const pkgJson = {
    [`${pkgIdentifier}/package.json`]: JSON.stringify({
      name: packageName,
      version: packageVersion,
      [typesName]: types,
      dependencies: {
        ...dependencies
      },
    })
  };

  const typesFile = {
    [`${pkgIdentifier}/${types}`]: typesContents,
  };

  const metaDef = {
    [`${pkgIdentifier}/?meta`]: JSON.stringify({
      'path': '/',
      'type': 'directory',
      'files': [
        {
          'path': '/package.json',
          'type': 'file',
          'contentType': 'application/json',
          'integrity': 'sha384-BDckYkrFmAimtif2O2Tik7OOOHeto1EXRJz7WqzJNvNXYGQD1m+NH1Iz+OBiOF+r',
          'lastModified': 'Sat, 26 Oct 1985 08:15:00 GMT',
          'size': 3145
        }
      ]
    }),
  };

  return {
    ...pkgJson,
    ...typesFile,
    ...metaDef,
  };
};

type Fetch = typeof fetch;

export interface MockedFetch extends Fetch {
  setMockedNpmPackages: (pkgs: { [key: string]: string }) => void;
  forceErrorOnce: (error: string) => void;
}

jest.mock('node-fetch', () => {
  let mockPackages: { [key: string]: any } = {};
  const errorQueue: string[] = [];
  const fn = jest.fn((url: string) => {
    const urlWithoutBase = url.replace(UNPKG_BASE, '');
    const file = mockPackages[urlWithoutBase];
    const forcedError = errorQueue.pop();

    if (forcedError) {
      return {
        ok: false,
        text: jest.fn(() => Promise.resolve(forcedError)),
        json: jest.fn(() => Promise.reject(forcedError)),
      }
    }

    if (file) {
      return {
        ok: true,
        text: jest.fn(() => Promise.resolve(file)),
        json: jest.fn(() => Promise.resolve(JSON.parse(file))),
      };
    }

    console.warn(`No mock defined for ${url}`);

    return {
      ok: false,
      text: jest.fn(() => Promise.resolve('Error')),
      json: jest.fn(() => Promise.reject('Error, no data returned')),
    };
  }) as unknown as MockedFetch;

  fn.setMockedNpmPackages = (pkgs: any) => {
    mockPackages = pkgs;
  };
  fn.forceErrorOnce = (error: string) => {
    errorQueue.push(error);
  }

  return fn;
});


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
  const mainFilePath = path.join(baseDir, tempy.file({extension: 'ts'})); // Construct file path inside the directory
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
