import axios from 'axios';

export async function headerCheck(url: string, headers: Record<string, string>, body: Record<string, any>) {
  try {
    const response = await axios.get(url, { headers, timeout: 5000 });
    const responseHeaders = response.headers;

    const missingHeaders = [];
    if (!responseHeaders['strict-transport-security']) {
      missingHeaders.push('Strict-Transport-Security');
    }
    if (!responseHeaders['content-security-policy']) {
      missingHeaders.push('Content-Security-Policy');
    }

    if (missingHeaders.length > 0) {
      return {
        name: 'Header Check',
        severity: 'medium' as const,
        description: `Missing critical security headers: ${missingHeaders.join(', ')}.`,
        recommendation: 'Add security headers to enhance API security and protect against common vulnerabilities.',
        fix: `Add the following security headers on your server:

Example using Express.js with Helmet middleware:

const express = require('express');
const helmet = require('helmet');
const app = express();

app.use(helmet({
  hsts: { maxAge: 31536000, includeSubDomains: true },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // Add other directives as needed
    },
  },
}));

For other frameworks:

- **Django:** https://django-extensions.readthedocs.io/en/latest/security.html#security-middleware
- **Flask:** https://flask-talisman.readthedocs.io/en/latest/
- **ASP.NET Core:** https://learn.microsoft.com/en-us/aspnet/core/security/headers/
- **Spring Boot:** https://www.baeldung.com/spring-security-headers

Always test your security headers using tools like [securityheaders.com](https://securityheaders.com) to verify correct implementation.`,
        fixLanguage: 'plaintext',
      };
    }

    return {
      name: 'Header Check',
      severity: 'low' as const,
      description: 'All critical security headers are present.',
      recommendation: 'Continue maintaining and regularly auditing security headers.',
      fix: '',
      fixLanguage: 'plaintext',
    };
  } catch (error: any) {
    return {
      name: 'Header Check',
      severity: 'error' as const,
      description: `Header check failed: ${error.message}`,
      recommendation: 'Ensure the API is accessible and correctly returns security headers.',
      fix: '',
      fixLanguage: 'plaintext',
    };
  }
}
