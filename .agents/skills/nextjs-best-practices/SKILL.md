---
name: Next.js Best Practices
description: Best practices for Next.js Pages router, API route handling with external resolver, and disabling body parser.
---

# Next.js API Routes Best Practices with Express Middleware

When using Express or other custom Node.js middleware within Next.js API routes (especially in Pages router):

## Disabling Body Parser
- Standard Express middleware (or custom body parsers) may need to parse the raw body themselves. Next.js automatically parses JSON/urlencoded/etc., which can consume the request stream and make it unreadable for downstream Express middleware.
- To avoid this, export a `config` object from the API page:
  ```typescript
  export const config = {
    api: {
      bodyParser: false,
    },
  };
  ```

## Avoiding External Resolver Warnings
- Next.js expects API route handlers to return a response directly. If they forward the request to an external router (like an Express instance or middleware) that sends the response asynchronously, Next.js might complain with:
  `API resolved without sending a response for /api/..., this may result in stalled requests.`
- To prevent this, mark the resolver as external:
  ```typescript
  export const config = {
    api: {
      externalResolver: true,
    },
  };
  ```

## Routing Integrity
- Ensure correct typing of `NextApiRequest` and `NextApiResponse`.
- Ensure Express middleware routes match the path Next.js is serving (e.g. `/api/market-data`).
