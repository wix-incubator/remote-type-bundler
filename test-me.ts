import { bundle } from './src';

(async function main() {
    // await bundle('@wix/react-velo@1.0.51', './test-me-results/test-me-bundle-react-velo.d.ts', {wrapWithModuleDeclare: true});
    // await bundle('puppeteer@13.5.1', './test-me-results/test-me-bundle-puppeteer.d.ts');
    await bundle('@wix/sdk@1.9.5', './test-me-results/test-me-bundle-sdk.d.ts');
    // await bundle('@wix/dashboard@1.3.14', './test-me-results/test-me-bundle-dashboard.d.ts');
    // await bundle('@wix/ecom@1.0.554', './test-me-results/test-me-bundle-ecom.d.ts');
    // await bundle('@wix/bookings@1.0.366', './test-me-results/test-me-bundle-bookings.d.ts');
})();
