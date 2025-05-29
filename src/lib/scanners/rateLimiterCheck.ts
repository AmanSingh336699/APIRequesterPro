import axios from 'axios';

export async function rateLimiterCheck(url: string, headers: Record<string, string>) {
  try {
    const requests = Array(5).fill(null).map(() =>
      axios.get(url, { headers, timeout: 5000 })
    );
    const responses = await Promise.allSettled(requests);

    const rateLimited = responses.some(
      (res) => res.status === 'rejected' || res.value?.status === 429
    );

    if (rateLimited) {
      return {
        name: 'Rate Limiter Check',
        severity: 'low' as const,
        description: 'Rate limiting is enforced, preventing abuse and excessive requests.',
        recommendation: 'Continue to maintain and monitor rate limiting to ensure API stability and security.',
        fix: '',
        fixLanguage: 'plaintext',
      };
    }

    return {
      name: 'Rate Limiter Check',
      severity: 'medium' as const,
      description: 'No rate limiting detected. This may allow abuse such as DoS or brute force attacks.',
      recommendation: 'Implement rate limiting to protect your API from excessive or malicious requests.',
      fix: `Implement rate limiting in your API. Example using Express.js:

const express = require('express');
const rateLimit = require('express-rate-limit');
const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

app.use(limiter);

Other options and tools:

- Use reverse proxies like Nginx to enforce rate limits.
- For distributed systems, consider API gateways or services like AWS API Gateway, Kong, or Envoy.
- Monitor rate limit logs to tune thresholds appropriately.`,

      fixLanguage: 'plaintext',
    };
  } catch (error: any) {
    return {
      name: 'Rate Limiter Check',
      severity: 'error' as const,
      description: `Rate limiter check failed: ${error.message}`,
      recommendation: 'Ensure the API is accessible and test the rate limiting mechanism again.',
      fix: '',
      fixLanguage: 'plaintext',
    };
  }
}
