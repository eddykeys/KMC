export { auth as proxy } from "@/lib/auth";

export const config = {
  matcher: [
    // Match all routes except static files, api, and auth pages
    "/((?!api|_next/static|_next/image|favicon.ico|models|login).*)",
  ],
};
