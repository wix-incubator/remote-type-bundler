import { pkg, MockedFetch } from './utils';
import { bundle } from '../../src/index';
import fetch from 'node-fetch';

const removeAllWhiteSpaces = (str: string) => str.replace(/\s/g, '');

describe('Types bundler', () => {
    it('should work with external package dependency', async () => {
        const mockPackages = {
            ...pkg('yury-pkg@1.0.0', `import { Foo } from 'foo-pkg';
            export type Bla { one: Foo };`, {dependencies: { 'foo-pkg': '1.2.3' }}),
            ...pkg('foo-pkg@1.2.3', `export type Foo { fighters: string };`),
        };
        (fetch as MockedFetch).setMockedNpmPackages(mockPackages);

        const result = await bundle('yury-pkg@1.0.0', '/tmp/bundle.d.ts');

        expect(result).toBeTruthy();

        expect(removeAllWhiteSpaces(result!)).toBe(removeAllWhiteSpaces(`type Foo { fighters: string };
        type Bla { one: Foo };
        
        type yurypkg_Bla = Bla;
        declare namespace yurypkg {
           export type { yurypkg_Bla as Bla}; 
        }
        
        declare module "yury-pkg" {
            export = yurypkg;
        }
        `));
    });

    it('should work with external package dependency with relative .. path import', async () => {
        const mockPackages = {
            ...pkg('yury-pkg@1.0.0', `import { Foo } from 'foo-pkg';
            export type Bla { one: Foo };`, {dependencies: { 'foo-pkg': '1.2.3' }}),
            ...pkg('foo-pkg@1.2.3', `import SomeType from '../some-types';
            export type Foo { fighters: string };`),
            ['foo-pkg@1.2.3/some-types.d.ts']: 'export type SomeType = string;',
        };
        (fetch as MockedFetch).setMockedNpmPackages(mockPackages);

        const result = await bundle('yury-pkg@1.0.0', '/tmp/bundle.d.ts');

        expect(result).toBeTruthy();

        expect(removeAllWhiteSpaces(result!)).toBe(removeAllWhiteSpaces(`type Foo { fighters: string };
        type Bla { one: Foo };
        type yurypkg_Bla = Bla;
        declare namespace yurypkg {
           export type { yurypkg_Bla as Bla}; 
        }
        
        declare module "yury-pkg" {
            export = yurypkg;
        }`));
    });

    it('should work with external package dependency with relative . path import', async () => {
        const mockPackages = {
            ...pkg('yury-pkg@1.0.0', `import { Foo } from 'foo-pkg';
            export type Bla { one: Foo };`, {dependencies: { 'foo-pkg': '1.2.3' }}),
            ...pkg('foo-pkg@1.2.3', `import SomeType from './some-types';
            export type Foo { fighters: string };`),
            ['foo-pkg@1.2.3/lib/some-types.d.ts']: 'export type SomeType = string;',
        };
        (fetch as MockedFetch).setMockedNpmPackages(mockPackages);

        const result = await bundle('yury-pkg@1.0.0', '/tmp/bundle.d.ts');

        expect(result).toBeTruthy();

        expect(removeAllWhiteSpaces(result!)).toBe(removeAllWhiteSpaces(`type Foo { fighters: string };
        type Bla { one: Foo };
        type yurypkg_Bla = Bla;
        declare namespace yurypkg {
           export type { yurypkg_Bla as Bla}; 
        }
        
        declare module "yury-pkg" {
            export = yurypkg;
        }`));
    });

    it('should work with scoped packages dependency', async () => {
        const mockPackages = {
            ...pkg('@wix/yury-pkg@1.0.0', `import { Foo } from '@wix/foo-pkg';
            export type Bla { one: Foo };`, {dependencies: { '@wix/foo-pkg': '1.2.3' }}),
            ...pkg('@wix/foo-pkg@1.2.3', `export type Foo { fighters: string };`),
        };
        (fetch as MockedFetch).setMockedNpmPackages(mockPackages);

        const result = await bundle('@wix/yury-pkg@1.0.0', '/tmp/bundle.d.ts');

        expect(result).toBeTruthy();

        expect(removeAllWhiteSpaces(result!)).toBe(removeAllWhiteSpaces(`type Foo { fighters: string };
        type Bla { one: Foo };
        type wixYurypkg_Bla = Bla;
        declare namespace wixYurypkg {
           export type { wixYurypkg_Bla as Bla}; 
        }
        
        declare module "@wix/yury-pkg" {
            export = wixYurypkg;
        }`));
    });

    it('should support additional type definition paths in package.json', async () => {
        const mockPackages = {
            ...pkg('@wix/yury-pkg@1.0.0', `import { Foo } from '@wix/foo-pkg';
            export type Bla { one: Foo };`, {dependencies: { '@wix/foo-pkg': '1.2.3' }, typesName: 'typesBundle'}),
            ...pkg('@wix/foo-pkg@1.2.3', `export type Foo { fighters: string };`, { typesName: 'typings' }),
        };
        (fetch as MockedFetch).setMockedNpmPackages(mockPackages);

        const result = await bundle('@wix/yury-pkg@1.0.0', '/tmp/bundle.d.ts');

        expect(result).toBeTruthy();

        expect(removeAllWhiteSpaces(result!)).toBe(removeAllWhiteSpaces(`type Foo { fighters: string };
        type Bla { one: Foo };
        type wixYurypkg_Bla = Bla;
        declare namespace wixYurypkg {
           export type { wixYurypkg_Bla as Bla}; 
        }
        
        declare module "@wix/yury-pkg" {
            export = wixYurypkg;
        }`));
    });

    it('should not touch absolute references', async () => {
        const mockPackages = {
            ...pkg('@wix/yury-pkg@1.0.0', `/// <reference path="/elementsMap.d.ts" />
            /// <reference path="/types/pages/$w.d.ts" />
            export type Bla { one: Foo };`),
        };
        (fetch as MockedFetch).setMockedNpmPackages(mockPackages);

        const result = await bundle('@wix/yury-pkg@1.0.0', '/tmp/bundle.d.ts');

        expect(result).toBeTruthy();

        expect(removeAllWhiteSpaces(result!)).toBe(removeAllWhiteSpaces(`/// <reference path="/elementsMap.d.ts" />
        /// <reference path="/types/pages/$w.d.ts" />
        type Bla { one: Foo };
        type wixYurypkg_Bla = Bla;
        declare namespace wixYurypkg {
           export type { wixYurypkg_Bla as Bla}; 
        }
        
        declare module "@wix/yury-pkg" {
            export = wixYurypkg;
        }`));
    });

    it('should allow retries', async () => {
        const mockPackages = {
            ...pkg('@wix/yury-pkg@1.0.0', `/// <reference path="/elementsMap.d.ts" />
            /// <reference path="/types/pages/$w.d.ts" />
            export type Bla { one: Foo };`),
        };
        (fetch as MockedFetch).setMockedNpmPackages(mockPackages);
        (fetch as MockedFetch).forceErrorOnce('error fetching 1');
        (fetch as MockedFetch).forceErrorOnce('error fetching 2');

        const result = await bundle('@wix/yury-pkg@1.0.0', '/tmp/bundle.d.ts', { retries: 2 });

        expect(result).toBeTruthy();
    });

    it('should fail if retries exceeded', async () => {
        const mockPackages = {
            ...pkg('@wix/yury-pkg@1.0.0', `/// <reference path="/elementsMap.d.ts" />
            /// <reference path="/types/pages/$w.d.ts" />
            export type Bla { one: Foo };`),
        };
        (fetch as MockedFetch).setMockedNpmPackages(mockPackages);
        (fetch as MockedFetch).forceErrorOnce('error fetching 1');
        (fetch as MockedFetch).forceErrorOnce('error fetching 2');
        (fetch as MockedFetch).forceErrorOnce('error fetching 3');

        const result = await bundle('@wix/yury-pkg@1.0.0', '/tmp/bundle.d.ts', { retries: 2 });

        expect(result).toBeFalsy();
    });
});
