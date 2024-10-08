import { getTestCdnImpl, pkg } from '../common/utils';
import { bundle } from '../../src';
import fs from 'fs';
import path from 'path';

const removeAllWhiteSpaces = (str: string) => str.replace(/\s/g, '');

describe('Types bundler fixtures', () => {
    it('should work with react-velo', async () => {
        const cdnImpl = getTestCdnImpl();
        const packageIdentifier = '@wix/react-velo@6.6.6';
        const inputFilePath = path.join(__dirname, 'fixtures', 'react-velo.d.ts');
        const typeDefinitions = await fs.promises.readFile(inputFilePath, 'utf8');
        const mockPackages = {
            ...pkg(packageIdentifier, typeDefinitions),
        };
        cdnImpl.setMockedNpmPackages(mockPackages);

        const result = await bundle(packageIdentifier, '/tmp/bundle.d.ts', { wrapWithModuleDeclare: true, cdnImpl });

        expect(result).toBeTruthy();

        const expectedFilePath = inputFilePath + '-result';
        const expectedResult = await fs.promises.readFile(expectedFilePath, 'utf8');

        expect(removeAllWhiteSpaces(result!)).toBe(removeAllWhiteSpaces(expectedResult));
    });
});
