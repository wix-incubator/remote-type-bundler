import tempy from 'tempy';
import { bundle } from '../../src';
import fs from 'fs';

describe('Common Libs - Fixed versions', () => {
  jest.setTimeout(60000);
  let tempDir: string;
  let puppeteerPath: string;
  let sdkDtsPath: string;
  let reactVeloPath: string;

  beforeAll(async () => {
    tempDir = tempy.directory({ prefix: 'my_temp_dir_' });
    puppeteerPath = `${tempDir}/generated/puppeteer.d.ts`;
    reactVeloPath = `${tempDir}/generated/react-velo.d.ts`;
    await Promise.all([
      bundle('@wix/react-velo@1.0.51', reactVeloPath),
      bundle('puppeteer@13.5.1', puppeteerPath),
    ]);
  });

  afterAll(async () => {
    await fs.promises.rm(tempDir, { recursive: true });
  });

  it('Verify puppeteer@13.5.1 output against snapshot', () => {
    expect(fs.readFileSync(puppeteerPath, 'utf8')).toMatchSnapshot();
  });

  it('Verify @wix/react-velo@1.0.51 output against snapshot', () => {
    expect(fs.readFileSync(reactVeloPath, 'utf8')).toMatchSnapshot();
  });
});
