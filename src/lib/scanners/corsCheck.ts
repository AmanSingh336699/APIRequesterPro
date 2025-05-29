import axios from "axios";

export async function corsCheck(
  url: string,
  headers: Record<string, string>
) {
  try {
    const response = await axios.options(url, {
      headers: { ...headers, Origin: "https://example.com" },
      timeout: 10000,
      validateStatus: () => true,
    });

    if (response.status < 200 || response.status >= 300) {
      return {
        name: "CORS Check",
        severity: "high" as const,
        description: `OPTIONS request returned status ${response.status}. This indicates CORS preflight is not handled properly.`,
        recommendation: "Ensure your server correctly handles OPTIONS requests for CORS preflight.",
        fix: `In Express.js, you can use the 'cors' middleware:

const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({
  origin: 'https://your-domain.com',
  methods: ['GET', 'POST', 'OPTIONS'],
}));

app.options('*', cors()); // Enable pre-flight for all routes`,
        fixLanguage: "plaintext",
      };
    }

    const originHeader = response.headers["access-control-allow-origin"];
    const methodsHeader = response.headers["access-control-allow-methods"];

    if (!originHeader) {
      return {
        name: "CORS Check",
        severity: "medium" as const,
        description:
          "No Access-Control-Allow-Origin header found. This may restrict cross-origin API access.",
        recommendation:
          "Configure your server to include Access-Control-Allow-Origin header specifying allowed origins.",
        fix: `Example Express.js config:

const cors = require('cors');
app.use(cors({
  origin: 'https://your-domain.com'
}));`,
        fixLanguage: "plaintext",
      };
    }

    if (originHeader === "*") {
      return {
        name: "CORS Check",
        severity: "high" as const,
        description:
          "Wildcard '*' detected in Access-Control-Allow-Origin header. This may expose your API to requests from any origin.",
        recommendation:
          "Restrict CORS to trusted origins only to enhance security.",
        fix: `Example Express.js config:

app.use(cors({
  origin: ['https://trusted-domain1.com', 'https://trusted-domain2.com']
}));`,
        fixLanguage: "plaintext",
      };
    }

    if (!methodsHeader) {
      return {
        name: "CORS Check",
        severity: "medium" as const,
        description:
          "No Access-Control-Allow-Methods header found. This may limit HTTP methods allowed in cross-origin requests.",
        recommendation:
          "Specify allowed HTTP methods in your CORS configuration.",
        fix: `Example Express.js config:

app.use(cors({
  methods: ['GET', 'POST', 'OPTIONS']
}));`,
        fixLanguage: "plaintext",
      };
    }

    return {
      name: "CORS Check",
      severity: "low" as const,
      description: "CORS headers are properly configured.",
      recommendation: "Maintain strict and secure CORS policies.",
      fix: "",
      fixLanguage: "plaintext",
    };
  } catch (error: any) {
    return {
      name: "CORS Check",
      severity: "error" as const,
      description: `CORS check failed: ${error.message}`,
      recommendation: "Ensure the API supports OPTIONS requests and proper CORS configuration.",
      fix: "",
      fixLanguage: "plaintext",
    };
  }
}
