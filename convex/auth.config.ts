import { AuthConfig } from "convex/server";

export default {
  providers: [
    {
      // Clerk JWT issuer domain for token validation
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
