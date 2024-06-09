/// <reference path="./test-me-results/test-me-bundle-bookings.d.ts" />
/// <reference path="./test-me-results/test-me-bundle-ecom.d.ts" />
/// <reference path="./test-me-results/test-me-bundle-sdk.d.ts" />
/// <reference path="./test-me-results/test-me-bundle-react-velo.d.ts" />
import { W, V, render } from '@wix/react-velo';
import { createClient } from '@wix/sdk/client';
import { bookings } from '@wix/bookings';
import { orders } from '@wix/ecom';

const client = createClient({
  modules: { bookings , orders }
})

