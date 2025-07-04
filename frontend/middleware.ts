import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value || request.headers.get("authorization")?.replace("Bearer ", "")

  // Protected routes
  const protectedPaths = ["/dashboard", "/documents"]
  const isProtectedPath = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path))

  // Auth routes
  const authPaths = ["/login", "/register"]
  const isAuthPath = authPaths.includes(request.nextUrl.pathname)

  // If accessing protected route without token, redirect to login
  if (isProtectedPath && !token) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // If accessing auth routes with token, redirect to dashboard
  if (isAuthPath && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/documents/:path*", "/login", "/register"],
}
