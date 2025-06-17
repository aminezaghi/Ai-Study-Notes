import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Define protected routes that require authentication
const protectedRoutes = [
  "/dashboard",
  "/documents",
  "/flashcards",
  "/quizzes",
  "/profile",
]

// Define authentication routes (login/register)
const authRoutes = ["/login", "/register"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isAuthenticated = request.cookies.has("auth_token")

  // Always allow access to the landing page
  if (pathname === "/landing") {
    return NextResponse.next()
  }

  // Redirect root to landing page if not authenticated
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/landing", request.url))
  }

  // Handle protected routes
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/landing", request.url))
    }
  }

  // Handle auth routes (login/register)
  if (authRoutes.includes(pathname)) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|images).*)",
  ],
}
