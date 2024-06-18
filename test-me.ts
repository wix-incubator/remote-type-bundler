import { bundle } from './src';

// this is a testing file you can run in order to create packages' types for local testing using test-types.ts

(async function main() {
    await bundle('@wix/react-velo@1.0.51', './test-me-results/test-me-bundle-react-velo.d.ts');
    await bundle('@wix/sdk@1.9.5', './test-me-results/test-me-bundle-sdk.d.ts');
    await bundle('@wix/ecom@1.0.602', './test-me-results/test-me-bundle-ecom.d.ts');
    await bundle('@wix/bookings@1.0.396', './test-me-results/test-me-bundle-bookings.d.ts');
    // await bundle('puppeteer@13.5.1', './test-me-results/test-me-bundle-puppeteer.d.ts');
    // await bundle('@wix/dashboard@1.3.14', './test-me-results/test-me-bundle-dashboard.d.ts');
    // await bundle('@wix/ecom_order-invoices@1.0.20', './test-me-results/test-me-bundle-ecom-invoices.d.ts');
    // await bundle('@wix/redirects-api@1.0.29', './test-me-results/test-me-bundle-redirects.d.ts');
})();
