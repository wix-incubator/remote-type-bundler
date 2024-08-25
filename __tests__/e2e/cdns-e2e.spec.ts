import tempy from 'tempy';
import { bundle, CdnType } from '../../src';
import fs from 'fs';

describe('Site SDK - Fixed versions', () => {
  jest.setTimeout(60000);
  let tempDir: string;
  let siteBookingsDtsPathUnpkg: string;
  let siteBookingsDtsPathJsDelivr: string;
  let sdkBookingsDtsPathUnpkg: string;
  let sdkBookingsDtsPathJsDelivr: string;

  beforeAll(async () => {
    tempDir = tempy.directory({ prefix: 'my_temp_dir_' });
    siteBookingsDtsPathUnpkg = `${tempDir}/generated/site-bookings-unpkg.d.ts`;
    siteBookingsDtsPathJsDelivr = `${tempDir}/generated/site-bookings-jsdelivr.d.ts`;
    sdkBookingsDtsPathUnpkg = `${tempDir}/generated/sdk-bookings-unpkg.d.ts`;
    sdkBookingsDtsPathJsDelivr = `${tempDir}/generated/sdk-bookings-jsdelivr.d.ts`;
    await Promise.all([
      bundle('@wix/site-bookings@1.10.0', siteBookingsDtsPathUnpkg, { cdn: CdnType.UNPKG }),
      bundle('@wix/site-bookings@1.10.0', siteBookingsDtsPathJsDelivr, { cdn: CdnType.JSDELIVR }),
      bundle('@wix/bookings@1.0.396', sdkBookingsDtsPathUnpkg, { cdn: CdnType.UNPKG }),
      bundle('@wix/bookings@1.0.396', sdkBookingsDtsPathJsDelivr, { cdn: CdnType.JSDELIVR }),
    ]);
  });

  afterAll(async () => {
    await fs.promises.rm(tempDir, { recursive: true });
  });

  it('site sdk packages should be identical between both unpkg and jsdelivr CDNs', () => {
    expect(fs.readFileSync(siteBookingsDtsPathUnpkg, 'utf8')).toEqual(fs.readFileSync(siteBookingsDtsPathJsDelivr, 'utf8'));
  });

  it('backend sdk packages should be identical between both unpkg and jsdelivr CDNs', () => {
    expect(fs.readFileSync(sdkBookingsDtsPathUnpkg, 'utf8')).toEqual(fs.readFileSync(sdkBookingsDtsPathJsDelivr, 'utf8'));
  });
});
