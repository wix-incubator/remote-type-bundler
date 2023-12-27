import { pkg, MockedFetch } from './utils';
import { bundle } from '../../src/index';
import fetch from 'node-fetch';

describe.only('Types bundler security', () => {
    it('should not import files outside the project root via relative path', async () => {
        const mockPackages = {
            ...pkg('yury-pkg@1.0.0', `/// <reference path="/elementsMap.d.ts" />
            import { Foo } from '../../../../../../../../../../etc/passwd';
            export type Bla = { one: Foo };`),
        };
        (fetch as MockedFetch).setMockedNpmPackages(mockPackages);
        

        await expect(bundle('yury-pkg@1.0.0', '/tmp/bundle.d.ts', { wrapWithModuleDeclare: true })).rejects.toMatchObject({ message: 'Unable to process ../../../../../../../../../../etc/passwd as it is outside of the project root - ../../../../../../../etc/passwd' });
    });

    it('should not import files outside the project root via absolute path', async () => {
        const mockPackages = {
            ...pkg('yury-pkg@1.0.0', `/// <reference path="/etc/passwd" />
            import { Foo } from '/etc/passwd';
            export type Bla = { one: Foo };`),
        };
        (fetch as MockedFetch).setMockedNpmPackages(mockPackages);
        
        await expect(bundle('yury-pkg@1.0.0', '/tmp/bundle.d.ts', { wrapWithModuleDeclare: true })).rejects.toMatchObject({ message: 'Unable to find package.json while searching from /etc/passwd upwards' });
    });

    it('should not reference types outside the project root', async () => {
        (fetch as MockedFetch).setMockedNpmPackages({
            'yury-pkg@1.0.0/package.json': JSON.stringify({
                name: 'yury-pkg',
                version: '1.0.0',
                types: '../../../../../../../../../../../../../../etc/passwd'
            })
        });
        
        await expect(bundle('yury-pkg@1.0.0', '/tmp/bundle.d.ts', { wrapWithModuleDeclare: true })).rejects.toMatchObject({ message: 'Unable to process /etc/passwd as it is outside of the project root - ../../../../../../../etc/passwd' });
        
    });
});
