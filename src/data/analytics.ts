/** Where the Cloudflare Web Analytics beacon loads from; the Home page's policy allows this origin for scripts. */
export const beaconOrigin = 'https://static.cloudflareinsights.com';

/** Where the beacon reports: a snippet that carries only a token posts here, so the Home page's policy allows it for connections. */
export const beaconReportOrigin = 'https://cloudflareinsights.com';

/** The site token from Cloudflare > Web Analytics > Manage site. It is public: it sits in the page source. */
export const beaconToken = '5d90764a2a49403fb6aa046886353095';
