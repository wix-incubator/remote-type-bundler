import tmp from 'tmp';
import { bundle } from '../../src';
import fs from 'fs';
import { validateTypescript } from './utils';

describe('Fixed versions', () => {
  jest.setTimeout(60000);
  let tempDir: tmp.DirResult;
  let bookingsDtsPath: string;
  let sdkDtsPath: string;
  let ecomDtsPath: string;

  beforeAll(async () => {
    tempDir = tmp.dirSync({ unsafeCleanup: true });
    bookingsDtsPath = `${tempDir.name}/generated/bookings.d.ts`;
    ecomDtsPath = `${tempDir.name}/generated/ecom.d.ts`;
    sdkDtsPath = `${tempDir.name}/generated/wix-sdk.d.ts`;
    await Promise.all([
      bundle('@wix/bookings@1.0.396', bookingsDtsPath),
      bundle('@wix/ecom@1.0.602', ecomDtsPath),
      bundle('@wix/sdk@1.9.5', sdkDtsPath),
    ]);
  });

  afterAll(() => {
    tempDir.removeCallback();
  });

  it('Verify bookings output against snapshot', () => {
    expect(fs.readFileSync(bookingsDtsPath, 'utf8')).toMatchSnapshot();
  });

  it('Verify ecom output against snapshot', () => {
    expect(fs.readFileSync(ecomDtsPath, 'utf8')).toMatchSnapshot();
  });

  it('Verify sdk output against snapshot', () => {
    expect(fs.readFileSync(sdkDtsPath, 'utf8')).toMatchSnapshot();
  });

  it('should generate valid d.ts files which can be used to create ts code', async () => {
    // 1. Generate the .ts File Content (same as before)
    const fileContent = `
      /// <reference path="${bookingsDtsPath}" />
      /// <reference path="${ecomDtsPath}" /> 
      /// <reference path="${sdkDtsPath}" /> 
      
      import { createClient } from '@wix/sdk/client';
      import { bookings, services } from '@wix/bookings';
      import { orders } from '@wix/ecom';
      
      const wixClient = createClient({
        modules: {orders, bookings, services}
      });
      
      wixClient.services.deleteService('service-id');
      wixClient.bookings.cancelBooking('booking-id');
      wixClient.orders.cancelOrder('order-id');
    `;

    expect(validateTypescript(fileContent, tempDir.name).isValid).toBe(true);
  });

  it('should create typescript error when the code is not valid', async () => {
    // 1. Generate the .ts File Content (same as before)
    const fileContent = `
      /// <reference path="${bookingsDtsPath}" />
      /// <reference path="${ecomDtsPath}" /> 
      /// <reference path="${sdkDtsPath}" /> 
      
      import { createClient } from '@wix/sdk/client';
      import { bookings, services } from '@wix/bookings';
      import { orders } from '@wix/ecom';
      
      const wixClient = createClient({
        modules: {orders, bookings, services}
      });
      
      wixClient.services.servicesShekerKolsheu('service-id');
      wixClient.bookings.bookingsShekerKolsheu('booking-id');
      wixClient.orders.ordersShekerKolsheu('order-id');
    `;

    const validationResult = validateTypescript(fileContent, tempDir.name);
    expect(validationResult.isValid).toBe(false);
    expect(validationResult.messages!.some(msg => msg.startsWith(`Property 'servicesShekerKolsheu' does not exist`))).toBe(true);
    expect(validationResult.messages!.some(msg => msg.startsWith(`Property 'bookingsShekerKolsheu' does not exist`))).toBe(true);
    expect(validationResult.messages!.some(msg => msg.startsWith(`Property 'ordersShekerKolsheu' does not exist`))).toBe(true);
  });
});