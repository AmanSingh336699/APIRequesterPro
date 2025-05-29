import axios from 'axios';

export async function httpsCheck(url: string, headers: Record<string, string>, body: Record<string, any>) {
  try {
    if (!url.startsWith('https://')) {
      return {
        name: 'HTTPS Check',
        severity: 'high' as const,
        description: 'API does not use HTTPS. Data may be intercepted in transit.',
        recommendation: 'Enforce HTTPS for all API requests to ensure data confidentiality and integrity.',
        fix: `Ensure your API is served over HTTPS. Example for Node.js/Express:

const https = require('https');
const fs = require('fs');
const express = require('express');
const app = express();

const options = {
  key: fs.readFileSync('path/to/your/server.key'),
  cert: fs.readFileSync('path/to/your/server.cert'),
};

https.createServer(options, app).listen(443, () => {
  console.log('HTTPS server running on port 443');
});

If you use a reverse proxy (like Nginx or Apache), configure SSL termination there.

For SSL certificates, consider:

- Using free certificates from Let's Encrypt (https://letsencrypt.org/)
- Automate renewal with certbot (https://certbot.eff.org/)
- Regularly test your SSL configuration with SSL Labs: https://www.ssllabs.com/ssltest/`,
        fixLanguage: 'plaintext',
      };
    }

    try {
      await axios.get(url, { headers, timeout: 5000 });
    } catch (getError: any) {
      if (Object.keys(body).length > 0) {
        try {
          await axios.post(url, body, { headers, timeout: 5000 });
        } catch (postError: any) {
          return {
            name: 'HTTPS Check',
            severity: 'medium' as const,
            description: `HTTPS is used but POST request failed: ${postError.message}`,
            recommendation: 'Verify HTTPS setup, including certificates and server configuration.',
            fix: `Check your SSL certificate and server configuration:

- Use tools like OpenSSL to verify certificates:
  openssl s_client -connect yourdomain.com:443
- Use Let's Encrypt for free SSL certificates
- Configure web server/proxy to use the correct cert and key files
- Ensure certificate chain is complete and valid`,
            fixLanguage: 'plaintext',
          };
        }
      } else {
        return {
          name: 'HTTPS Check',
          severity: 'medium' as const,
          description: `HTTPS is used but GET request failed: ${getError.message}`,
          recommendation: 'Verify HTTPS setup and server availability.',
          fix: `Check your SSL certificate and server configuration:

- Use tools like OpenSSL to verify certificates:
  openssl s_client -connect yourdomain.com:443
- Use Let's Encrypt for free SSL certificates
- Ensure your server is reachable over HTTPS
- Confirm firewall or security groups allow port 443`,
          fixLanguage: 'plaintext',
        };
      }
    }

    return {
      name: 'HTTPS Check',
      severity: 'low' as const,
      description: 'API uses HTTPS correctly.',
      recommendation: 'Continue enforcing HTTPS and regularly audit your SSL configuration.',
      fix: '',
      fixLanguage: 'plaintext',
    };
  } catch (error: any) {
    return {
      name: 'HTTPS Check',
      severity: 'error' as const,
      description: `HTTPS check failed: ${error.message}`,
      recommendation: 'Ensure the API is accessible over HTTPS and retry the check.',
      fix: '',
      fixLanguage: 'plaintext',
    };
  }
}
