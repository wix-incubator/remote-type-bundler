/// <reference path="./test-me-results/test-me-bundle-bookings.d.ts" />
/// <reference path="./test-me-results/test-me-bundle-ecom.d.ts" />
/// <reference path="./test-me-results/test-me-bundle-sdk.d.ts" />
/// <reference path="./test-me-results/test-me-bundle-react-velo.d.ts" />
/// <reference path="./test-me-results/test-me-bundle-sdk.d.ts" />
/// <reference path="./test-me-results/test-me-bundle-site-location.d.ts" />
/// <reference path="./test-me-results/test-me-bundle-site-seo.d.ts" />
/// <reference path="./test-me-results/test-me-bundle-site-members.d.ts" />
/// <reference path="./test-me-results/test-me-bundle-site-bookings.d.ts" />
/// <reference path="./test-me-results/test-me-bundle-puppeteer.d.ts" />
import { W, V, render } from '@wix/react-velo';
import { queryParams } from '@wix/site-location/context';
import { seo } from '@wix/site-seo/context';
import { currentMember } from '@wix/site-members/context';
import { bookings as siteBookings  } from '@wix/site-bookings';
import { createClient } from '@wix/sdk/client';
import { bookings } from '@wix/bookings';
import { orders } from '@wix/ecom';
import { Accessibility } from 'puppeteer';

const a = new Accessibility({} as any);

console.log(a);

queryParams.add({key: 'value'}).then(console.log);
seo.title().then(console.log);
currentMember.getMember().then(console.log);
siteBookings.getServiceAvailability('id').then(console.log);
siteBookings.getCheckoutOptions({
  slotId: 'da',
  userId: 'da',
}).then(console.log);
render(
  {}, // rootElement
  () => {}, // $w
  {}, // react
);
const client = createClient({
  modules: { bookings , orders }
})


