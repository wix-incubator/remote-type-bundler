import tempy from 'tempy';
import { bundle } from '../../src';
import fs from 'fs';
import { validateTypescript } from '../common/utils';

describe('Site SDK - Fixed versions', () => {
  jest.setTimeout(60000);
  let tempDir: string;
  let siteBookingsDtsPath: string;
  let siteMemberDtsPath: string;
  let siteLocationDtsPath: string;

  beforeAll(async () => {
    tempDir = tempy.directory({ prefix: 'my_temp_dir_' });
    siteBookingsDtsPath = `${tempDir}/generated/site-bookings.d.ts`;
    siteLocationDtsPath = `${tempDir}/generated/site-location.d.ts`;
    siteMemberDtsPath = `${tempDir}/generated/site-members.d.ts`;
    await Promise.all([
      bundle('@wix/site-bookings@1.10.0', siteBookingsDtsPath),
      bundle('@wix/site-location@1.9.0', siteLocationDtsPath),
      bundle('@wix/site-members@1.12.0', siteMemberDtsPath),
    ]);
  });

  afterAll(async () => {
    await fs.promises.rm(tempDir, { recursive: true });
  });

  it('Verify bookings output against snapshot', () => {
    expect(fs.readFileSync(siteBookingsDtsPath, 'utf8')).toMatchSnapshot();
  });

  it('Verify site-location output against snapshot', () => {
    expect(fs.readFileSync(siteLocationDtsPath, 'utf8')).toMatchSnapshot();
  });

  it('Verify site-members against snapshot', () => {
    expect(fs.readFileSync(siteMemberDtsPath, 'utf8')).toMatchSnapshot();
  });

  it('should generate valid d.ts files which can be used to create ts code', async () => {
    // 1. Generate the .ts File Content (same as before)
    const fileContent = `
      /// <reference path="${siteBookingsDtsPath}" />
      /// <reference path="${siteLocationDtsPath}" /> 
      /// <reference path="${siteMemberDtsPath}" /> 
      
      import { queryParams } from '@wix/site-location/context';
      import { currentMember } from '@wix/site-members/context';
      import { bookings as siteBookings  } from '@wix/site-bookings';
      
      queryParams.add({key: 'value'}).then(console.log);
      currentMember.getMember().then(console.log);
      siteBookings.getServiceAvailability('id').then(console.log);
    `;

    expect(validateTypescript(fileContent, tempDir).isValid).toBe(true);
  });

  it('should create typescript error when the code is not valid', async () => {
    // 1. Generate the .ts File Content (same as before)
    const fileContent = `
      /// <reference path="${siteBookingsDtsPath}" />
      /// <reference path="${siteLocationDtsPath}" /> 
      /// <reference path="${siteMemberDtsPath}" /> 
      
      import { queryParams } from '@wix/site-location/context';
      import { currentMember } from '@wix/site-members/context';
      import { bookings as siteBookings  } from '@wix/site-bookings';
      
      
      siteBookings.bookingsShekerKolsheu();
      currentMember.getMemberShekerKolsheu();
      queryParams.paramsShekerKolsheu();
    `;

    const validationResult = validateTypescript(fileContent, tempDir);
    expect(validationResult.isValid).toBe(false);
    expect(validationResult.messages!.some(msg => msg.startsWith(`Property 'bookingsShekerKolsheu' does not exist`))).toBe(true);
    expect(validationResult.messages!.some(msg => msg.startsWith(`Property 'getMemberShekerKolsheu' does not exist`))).toBe(true);
    expect(validationResult.messages!.some(msg => msg.startsWith(`Property 'paramsShekerKolsheu' does not exist`))).toBe(true);
  });
});
