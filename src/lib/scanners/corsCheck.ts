import axios from "axios";

export async function corsCheck(url: string, headers: Record<string, string>, body: Record<string, any>) {
  try {
    const response = await axios.options(url, {
      headers: { ...headers, Origin: 'https://example.com' },
      timeout: 5000,
    });

    const corsHeaders = response.headers['access-control-allow-origin'];
    if (!corsHeaders) {
      return {
        name: 'CORS Check',
        severity: 'medium' as const,
        description: 'No CORS headers found. This may restrict API access.',
        recommendation: 'Configure CORS headers to allow specific origins and methods.',
        fix: `Configure your server to properly handle CORS by specifying allowed origins and HTTP methods.

Example (Express.js):

const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({
  origin: 'https://your-domain.com',
  methods: ['GET', 'POST', 'OPTIONS'],
}));

For other frameworks:

- **Django:** https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#how_to_enable_cors_in_django
- **Flask:** https://flask-cors.readthedocs.io/en/latest/
- **ASP.NET Core:** https://learn.microsoft.com/en-us/aspnet/core/security/cors
- **Spring Boot:** https://spring.io/guides/gs/rest-service-cors/

Refer to your framework's documentation for specific configuration steps.`,
        fixLanguage: 'plaintext',
      };
    }

    if (corsHeaders === '*') {
      return {
        name: 'CORS Check',
        severity: 'high' as const,
        description: 'Wildcard CORS policy detected. This may expose the API to unauthorized origins.',
        recommendation: 'Restrict CORS to specific trusted origins.',
        fix: `Configure your server to restrict CORS to trusted origins.

Example (Express.js):

const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({
  origin: ['https://trusted-domain.com'],
}));

For other frameworks:

- **Django:** https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#how_to_enable_cors_in_django
- **Flask:** https://flask-cors.readthedocs.io/en/latest/
- **ASP.NET Core:** https://learn.microsoft.com/en-us/aspnet/core/security/cors
- **Spring Boot:** https://spring.io/guides/gs/rest-service-cors

Refer to your framework's documentation for specific configuration steps.`,
        fixLanguage: 'plaintext',
      };
    }

    return {
      name: 'CORS Check',
      severity: 'low' as const,
      description: 'CORS headers are properly configured.',
      recommendation: 'Continue to maintain strict CORS policies.',
      fix: '',
      fixLanguage: 'plaintext',
    };
  } catch (error: any) {
    return {
      name: 'CORS Check',
      severity: 'error' as const,
      description: `CORS check failed: ${error.message}`,
      recommendation: 'Ensure the API supports OPTIONS requests.',
      fix: '',
      fixLanguage: 'plaintext',
    };
  }
}
