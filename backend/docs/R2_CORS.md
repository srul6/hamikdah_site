# R2 bucket CORS configuration (presigned uploads)

For **browser → R2** presigned PUT uploads to work, the Cloudflare R2 bucket must have CORS configured.

## Do not use wildcard origins in production

Use your application’s exact origins only.

## Steps (Cloudflare Dashboard)

1. Go to **Cloudflare Dashboard** → **R2** → select your bucket.
2. Open **Settings** → **CORS policy**.
3. Add a policy like the following (replace origins with your real domains):

```json
[
  {
    "AllowedOrigins": [
      "https://hamikdah-site.onrender.com",
      "https://bmikdash.com",
      "https://hamikdash.onrender.com",
      "http://localhost:3000"
    ],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": []
  }
]
```

- **AllowedOrigins**: Only your frontend/app domains. No `"*"` in production.
- **AllowedMethods**: `PUT` for uploads, `GET` (and `HEAD`) for reading objects.
- **AllowedHeaders**: `["*"]` is acceptable so the browser can send `Content-Type` and other headers required for the presigned PUT.

Save the policy. Presigned uploads from the browser will then be allowed by CORS.
