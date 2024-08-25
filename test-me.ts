import { bundle, CDN } from './src';

// this is a testing file you can run in order to create packages' types for local testing using test-types.ts

(async function main() {
    await bundle('@wix/react-velo@1.0.51', './test-me-results/test-me-bundle-react-velo.d.ts');
    await bundle('@wix/sdk@1.12.12', './test-me-results/test-me-bundle-sdk.d.ts');
    await bundle('@wix/site-members@1.12.0', './test-me-results/test-me-bundle-site-members.d.ts', {cdn: CDN.JSDELIVR});
    await bundle('@wix/sdk-runtime@0.3.14', './test-me-results/test-me-bundle-sdk-runtime.d.ts');
    await bundle('@wix/bookings@1.0.396', './test-me-results/test-me-bundle-bookings.d.ts');
    await bundle('@wix/site-bookings@1.10.0', './test-me-results/test-me-bundle-site-bookings.d.ts', {cdn: CDN.JSDELIVR});
    await bundle('@wix/site-location@1.9.0', './test-me-results/test-me-bundle-site-location.d.ts');
    await bundle('@wix/site-seo@1.7.0', './test-me-results/test-me-bundle-site-seo.d.ts');
    await bundle('@wix/ecom@1.0.700', './test-me-results/test-me-bundle-ecom.d.ts');
    await bundle('puppeteer@13.5.1', './test-me-results/test-me-bundle-puppeteer.d.ts');
    await bundle('@wix/dashboard@1.3.14', './test-me-results/test-me-bundle-dashboard.d.ts');
    await bundle('@wix/ecom_order-invoices@1.0.20', './test-me-results/test-me-bundle-ecom-invoices.d.ts');
    await bundle('@wix/redirects-api@1.0.29', './test-me-results/test-me-bundle-redirects.d.ts');
})();
