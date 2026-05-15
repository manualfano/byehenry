export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/eerr/:path*",
    "/cc/:path*",
    "/config/:path*",
    "/api/sheets/:path*",
    "/api/cc/:path*",
  ],
};
