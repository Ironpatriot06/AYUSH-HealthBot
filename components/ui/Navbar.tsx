"use client";

import Link from "next/link";
import { Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth"; // ✅ bring in auth context
import { useCallback, useState } from "react";

/**
 * Full fixed Navbar component.
 *
 * Fixes applied:
 * - Use common Google avatar field names (avatar_url, photoURL, picture).
 * - Provide a secure fallback image.
 * - Add an onError handler so if the remote image fails, we replace it with fallback.
 * - Keep structure and styles unchanged.
 *
 * Note: If you switch to `next/image` later, you'll need to add Google host to next.config.js.
 */

export default function Navbar() {
  const { user, loginWithGoogle, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  console.log("USER:", user);
  // Prefer common avatar fields returned by different auth flows.
  const avatarSrc = user?.avatar_url || "/avatar-fallback.png";

  // onError handler for <img> to gracefully fallback to a local image if remote fails
  const handleAvatarError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.src && !img.src.includes("/avatar-fallback.png")) {
      img.src = "/avatar-fallback.png";
      // Remove onerror after fallback to avoid infinite loop if fallback also fails
      img.onerror = null;
    }
  }, []);

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    try {
      console.log("Navbar: Attempting to log out...");
      await logout();
      console.log("Navbar: Logout successful");
    } catch (error) {
      console.error("Navbar: Logout failed:", error);
      // Force a page reload even if logout failed
      window.location.href = "/";
    } finally {
      setIsLoggingOut(false);
    }
  }, [logout, isLoggingOut]);

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Left side: Logo + title -> clickable to home */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Leaf className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Ayush Herbal Garden</h1>
              <p className="text-sm text-muted-foreground">
                Traditional Ayurvedic Medicine Reference
              </p>
            </div>
          </Link>

          {/* Right side: Nav */}
          <nav className="flex items-center gap-4">
            <Link
              href="/admin"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Admin
            </Link>

            {user ? (
              <div className="flex items-center gap-3">
                {avatarSrc ? (
                  // plain <img> used to avoid requiring next.config.js changes
                  <img
                    src={avatarSrc}
                    alt={user?.name ?? "avatar"}
                    className="h-8 w-8 rounded-full object-cover"
                    onError={handleAvatarError}
                    // referrerPolicy helps with some profile image hosts blocking referers
                    referrerPolicy="no-referrer"
                    // crossOrigin can help in some CORS scenarios (optional)
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-muted" />
                )}

                <span className="text-sm font-medium text-foreground">
                {user?.name || user?.email}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="hover:bg-transparent hover:text-inherit"
                >
                  {isLoggingOut ? "Signing out..." : "Sign Out"}
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={loginWithGoogle}
                className="hover:bg-transparent hover:text-inherit"
              >
                {/* Sign In with Google */}
              </Button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
