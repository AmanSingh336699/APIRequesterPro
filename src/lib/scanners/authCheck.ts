import axios from 'axios';

export async function authCheck(url: string, headers: Record<string, string>, body: Record<string, any>) {
    try {
        const response = body ? await axios.post(url, body, { headers, timeout: 10000 }) : await axios.get(url, { headers, timeout: 10000 })

        if (response.status === 401 || response.status === 403) {
            return {
                name: 'Authentication Check',
                severity: 'low' as const,
                description: 'API requires authentication, which is enforced correctly.',
                recommendation: 'Ensure all sensitive endpoints require authentication.',
                fix: `Implement authentication on your server to protect sensitive endpoints.

Example (Express.js using JWT):

const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();

app.use((req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).send('Access denied');
  try {
    const verified = jwt.verify(token, 'your-secret-key');
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).send('Invalid token');
  }
});

For other frameworks:

- **Django:** https://www.django-rest-framework.org/api-guide/authentication/
- **Flask:** https://flask-jwt-extended.readthedocs.io/en/stable/
- **ASP.NET Core:** https://learn.microsoft.com/en-us/aspnet/core/security/authentication/
- **Spring Boot:** https://spring.io/guides/tutorials/spring-boot-oauth2/

Refer to your framework's documentation for detailed implementation steps.`,
                fixLanguage: 'plaintext',
            };
        }

        return {
            name: 'Authentication Check',
            severity: 'high' as const,
            description: 'API allows access without authentication. This may expose sensitive data.',
            recommendation: 'Implement authentication for all sensitive endpoints.',
            fix: `Protect your API endpoints by implementing authentication.

Example (Express.js using JWT):

const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();

app.use((req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).send('Access denied');
  try {
    const verified = jwt.verify(token, 'your-secret-key');
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).send('Invalid token');
  }
});

For other frameworks:

- **Django:** https://www.django-rest-framework.org/api-guide/authentication/
- **Flask:** https://flask-jwt-extended.readthedocs.io/en/stable/
- **ASP.NET Core:** https://learn.microsoft.com/en-us/aspnet/core/security/authentication/
- **Spring Boot:** https://spring.io/guides/tutorials/spring-boot-oauth2/

Refer to your framework's documentation for detailed implementation steps.`,
            fixLanguage: 'plaintext',
        };
    } catch (error: any) {
        return {
            name: 'Authentication Check',
            severity: 'error' as const,
            description: `Authentication check failed: ${error.message}`,
            recommendation: 'Ensure the API is accessible and check authentication requirements.',
            fix: '',
            fixLanguage: 'plaintext',
        };
    }
}
