export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/eerr/:path*",
    "/config/:path*",
    "/api/sheets/:path*",
  ],
};
