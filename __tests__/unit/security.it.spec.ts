import { getTestCdnImpl, pkg } from '../common/utils';
import { bundle } from '../../src';

describe.only('Types bundler security', () => {
    it('should not import files outside the project root via relative path', async () => {
        const cdnImpl = getTestCdnImpl();
        const mockPackages = {
            ...pkg('yury-pkg@1.0.0', `/// <reference path="/elementsMap.d.ts" />
            import { Foo } from '../../../../../../../../../../etc/passwd';
            export type Bla = { one: Foo };`),
        };
        cdnImpl.setMockedNpmPackages(mockPackages);

        const result = await bundle('yury-pkg@1.0.0', '/tmp/bundle.d.ts', { wrapWithModuleDeclare: true, cdnImpl });

        expect(result).toBeUndefined();
    });

    it('should not import files outside the project root via absolute path', async () => {
        const cdnImpl = getTestCdnImpl();
        const mockPackages = {
            ...pkg('yury-pkg@1.0.0', `/// <reference path="/etc/passwd" />
            import { Foo } from '/private/etc/passwd';
            export type Bla = { one: Foo };`),
        };
        cdnImpl.setMockedNpmPackages(mockPackages);

        const result = await bundle('yury-pkg@1.0.0', '/tmp/bundle.d.ts', { wrapWithModuleDeclare: true, cdnImpl });

        expect(result).toBeUndefined();
    });

    it('should not reference types outside the project root', async () => {
        const cdnImpl = getTestCdnImpl();
        cdnImpl.setMockedNpmPackages({
            'yury-pkg@1.0.0/package.json': JSON.stringify({
                name: 'yury-pkg',
                version: '1.0.0',
                types: '../../../../../../../../../../../../../../etc/passwd'
            })
        });

        const result = await bundle('yury-pkg@1.0.0', '/tmp/bundle.d.ts', { wrapWithModuleDeclare: true, cdnImpl });

        expect(result).toBeUndefined();
    });
});
