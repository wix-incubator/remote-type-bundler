const UNPKG_BASE = 'https://unpkg.com/';
import type fetch from 'node-fetch';

export const pkg = (pkgIdentifier, typesContents, dependencies = {}) => {
    const types = 'lib/types.d.ts';
    const packageIdentifierParts = pkgIdentifier.split('@');
    const packageName = packageIdentifierParts.slice(0, -1).join('@');
    const packageVersion = packageIdentifierParts[packageIdentifierParts.length - 1];

    const pkgJson = {
        [`${pkgIdentifier}/package.json`]: JSON.stringify({
            name: packageName,
            version: packageVersion,
            types,
            dependencies: {
                ...dependencies
            },
        })
    };

    const typesFile = {
        [`${pkgIdentifier}/${types}`]: typesContents,
    }

    const metaDef = {
        [`${pkgIdentifier}/?meta`]: JSON.stringify({
            "path": "/",
            "type": "directory",
            "files": [
                {
                    "path": "/package.json",
                    "type": "file",
                    "contentType": "application/json",
                    "integrity": "sha384-BDckYkrFmAimtif2O2Tik7OOOHeto1EXRJz7WqzJNvNXYGQD1m+NH1Iz+OBiOF+r",
                    "lastModified": "Sat, 26 Oct 1985 08:15:00 GMT",
                    "size": 3145
                }
            ]
        }),
    }

    return {
        ...pkgJson,
        ...typesFile,
        ...metaDef,
    };
}

type Fetch = typeof fetch;
export interface MockedFetch extends Fetch {
    setMockedNpmPackages: (pkgs: { [key: string]: string }) => void;
}

jest.mock('node-fetch', () => {
    let mockPackages = {};
    const fn = jest.fn((url: string) => {
        const urlWithoutBase = url.replace(UNPKG_BASE, '');
        const file = mockPackages[urlWithoutBase];

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

    return fn;
});
