"use client";

import NextError from "next/error";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  // You can add any custom error logging here if needed, or just leave it as is

  return (
    <html>
      <body>
        {/* `NextError` is the default Next.js error page component. Its type
            definition requires a `statusCode` prop. However, since the App Router
            does not expose status codes for errors, we simply pass 0 to render a
            generic error message. */}
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
