import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiHome,
  FiSearch,
  FiGrid,
  FiBookmark,
  FiClock,
  FiUser,
  FiMenu,
  FiX,
  FiLogOut,
  FiSettings,
} from "react-icons/fi";

import { useAuth } from "../hooks/useAuth";
import SearchBar from "./SearchBar";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Close menus when page changes
  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    if (!window.confirm("Are you sure you want to logout?")) {
      return;
    }
    logout();
    navigate("/");
  };

  const navLinks = [
    {
      label: "Home",
      path: "/",
      icon: <FiHome />,
    },
    {
      label: "Anime",
      path: "/search",
      icon: <FiSearch />,
    },
    {
      label: "Genres",
      path: "/genres",
      icon: <FiGrid />,
    },
  ];

  const userLinks = [
    {
      label: "Watchlist",
      path: "/watchlist",
      icon: <FiBookmark />,
    },
    {
      label: "History",
      path: "/history",
      icon: <FiClock />,
    },
    {
      label: "Profile",
      path: "/profile",
      icon: <FiUser />,
    },
    {
      label: "Settings",
      path: "/settings",
      icon: <FiSettings />,
    },
  ];

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }

    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* ================= NAVBAR ================= */}

      <nav className="relative z-50 w-full overflow-visible border-b border-white/10 bg-gradient-to-r from-[#17152e] via-[#30204f] to-[#251733]">
        {/* ================= BACKGROUND GLOW ================= */}

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Purple Glow */}

          <div className="absolute -top-16 left-[5%] h-32 w-72 rounded-full bg-purple-500/25 blur-3xl" />

          {/* Blue Glow */}

          <div className="absolute -top-16 left-[40%] h-32 w-80 rounded-full bg-blue-500/15 blur-3xl" />

          {/* Pink Glow */}

          <div className="absolute -top-16 right-[5%] h-32 w-72 rounded-full bg-pink-500/25 blur-3xl" />

          {/* Top Highlight */}

          <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-300/40 to-transparent" />

          {/* Bottom Glow */}

          <div className="absolute bottom-0 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-pink-400/50 to-transparent" />
        </div>

        {/* ================= NAVBAR CONTENT ================= */}

        <div className="relative w-full px-3 sm:px-5 lg:px-8">
          <div className="flex h-[48px] items-center gap-3 sm:h-[52px]">

            {/* ================= MOBILE MENU BUTTON ================= */}

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex items-center justify-center text-white/70 transition hover:text-white lg:hidden"
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <FiX className="h-5 w-5" />
              ) : (
                <FiMenu className="h-5 w-5" />
              )}
            </button>

            {/* ================= LOGO ================= */}

            <Link
              to="/"
              className="group flex shrink-0 items-center text-lg font-extrabold tracking-tight sm:text-xl"
            >
              <span className="text-white transition group-hover:text-white/90">
                Abhi
              </span>

              <span className="bg-gradient-to-r from-pink-400 via-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
                Stream
              </span>
            </Link>

            {/* ================= DESKTOP NAVIGATION ================= */}

            <div className="ml-5 hidden items-center gap-1 lg:flex">
              {navLinks.map((link) => {
                const active = isActive(link.path);

                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`relative flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-300 ${
                      active
                        ? "border border-white/10 bg-white/10 text-white shadow-lg shadow-purple-950/20"
                        : "text-white/60 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {active && (
                      <span className="absolute inset-x-2 bottom-0 h-[2px] rounded-full bg-gradient-to-r from-purple-400 to-pink-400" />
                    )}

                    <span
                      className={`text-base ${
                        active ? "text-pink-400" : ""
                      }`}
                    >
                      {link.icon}
                    </span>

                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* ================= DESKTOP SEARCH ================= */}

            <div className="ml-auto hidden max-w-xl flex-1 md:flex">
              <SearchBar />
            </div>

            {/* ================= MOBILE SEARCH ================= */}

            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="ml-auto text-white/70 transition hover:text-pink-300 md:hidden"
              aria-label="Search"
            >
              <FiSearch className="h-5 w-5" />
            </button>

            {/* ================= USER AREA ================= */}

            <div className="flex shrink-0 items-center gap-2">

              {user ? (
                <>
                  {/* ================= DESKTOP USER LINKS ================= */}

                  <div className="hidden items-center gap-1 md:flex">

                    {userLinks.map((link) => {
                      const active = isActive(link.path);

                      return (
                        <Link
                          key={link.path}
                          to={link.path}
                          title={link.label}
                          aria-label={link.label}
                          className={`rounded-lg p-2 transition-all duration-300 ${
                            active
                              ? "bg-white/10 text-pink-400"
                              : "text-white/60 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          <span className="text-lg">
                            {link.icon}
                          </span>
                        </Link>
                      );
                    })}

                    {/* Logout */}

                    <button
                      onClick={handleLogout}
                      title="Logout"
                      aria-label="Logout"
                      className="rounded-lg p-2 text-white/60 transition hover:bg-red-500/10 hover:text-red-400"
                    >
                      <FiLogOut className="text-lg" />
                    </button>

                  </div>

                  {/* ================= MOBILE PROFILE ================= */}

                  <Link
                    to="/profile"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/10 text-pink-400 transition hover:bg-white/20 md:hidden"
                  >
                    <FiUser className="h-4 w-4" />
                  </Link>
                </>
              ) : (
                /* ================= LOGIN BUTTON ================= */

                <Link
                  to="/login"
                  className="relative overflow-hidden rounded-lg bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-500 px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-purple-950/40 transition-all duration-300 hover:scale-[1.03] hover:shadow-pink-500/20 sm:px-4 sm:text-sm"
                >
                  <span className="relative z-10">
                    Login
                  </span>

                  <span className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 opacity-0 transition-opacity duration-300 hover:opacity-100" />
                </Link>
              )}

            </div>
          </div>
        </div>

        {/* ================= MOBILE SEARCH ================= */}

        {searchOpen && (
          <div className="relative border-t border-white/10 bg-gradient-to-r from-[#17152e] via-[#30204f] to-[#251733] px-3 py-3 md:hidden">

            <div className="absolute inset-0 pointer-events-none bg-purple-500/5" />

            <div className="relative">
              <SearchBar
                onSearch={(query) => {
                  const value = query.trim();

                  if (!value) return;

                  setSearchOpen(false);

                  navigate(
                    `/search?q=${encodeURIComponent(value)}`
                  );
                }}
              />
            </div>

          </div>
        )}
      </nav>

      {/* ================= MOBILE MENU ================= */}

      {mobileOpen && (
        <>
          {/* ================= OVERLAY ================= */}

          <div
            className="fixed inset-0 top-[48px] z-40 bg-black/60 backdrop-blur-[2px] lg:hidden sm:top-[52px]"
            onClick={() => setMobileOpen(false)}
          />

          {/* ================= MOBILE MENU ================= */}

          <div className="absolute left-0 right-0 top-[48px] z-[60] overflow-hidden border-b border-white/10 bg-gradient-to-br from-[#211b3d] via-[#2d2149] to-[#1c1830] shadow-2xl lg:hidden sm:top-[52px]">

            {/* Background Glow */}

            <div className="absolute inset-0 overflow-hidden pointer-events-none">

              <div className="absolute -top-20 left-0 h-40 w-64 rounded-full bg-purple-500/20 blur-3xl" />

              <div className="absolute -top-20 right-0 h-40 w-64 rounded-full bg-pink-500/15 blur-3xl" />

            </div>

            <div className="relative space-y-1 px-3 py-3">

              {/* ================= MAIN NAV LINKS ================= */}

              {navLinks.map((link) => {
                const active = isActive(link.path);

                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition ${
                      active
                        ? "border border-white/10 bg-white/10 text-pink-400"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span className="text-lg">
                      {link.icon}
                    </span>

                    <span>
                      {link.label}
                    </span>

                    {active && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-pink-400 shadow-[0_0_8px_rgba(244,114,182,0.8)]" />
                    )}

                  </Link>
                );
              })}

              {/* ================= USER LINKS ================= */}

              {user && (
                <>
                  <div className="my-3 border-t border-white/10" />

                  <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-white/40">
                    Account
                  </p>

                  {userLinks.map((link) => {
                    const active = isActive(link.path);

                    return (
                      <Link
                        key={link.path}
                        to={link.path}
                        className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition ${
                          active
                            ? "border border-white/10 bg-white/10 text-pink-400"
                            : "text-white/70 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <span className="text-lg">
                          {link.icon}
                        </span>

                        <span>
                          {link.label}
                        </span>
                      </Link>
                    );
                  })}

                  {/* Logout */}

                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-red-400 transition hover:bg-red-500/10"
                  >
                    <FiLogOut className="text-lg" />

                    <span>
                      Logout
                    </span>
                  </button>
                </>
              )}

            </div>
          </div>
        </>
      )}

      {/* ================= MOBILE BOTTOM NAV ================= */}

      <div className="fixed bottom-0 left-0 right-0 z-40 overflow-hidden border-t border-white/10 bg-gradient-to-r from-[#17152e] via-[#30204f] to-[#251733] md:hidden">

        {/* Background Glow */}

        <div className="absolute inset-0 pointer-events-none">

          <div className="absolute -bottom-10 left-[20%] h-16 w-40 rounded-full bg-purple-500/20 blur-3xl" />

          <div className="absolute -bottom-10 right-[20%] h-16 w-40 rounded-full bg-pink-500/20 blur-3xl" />

          <div className="absolute left-[15%] right-[15%] top-0 h-px bg-gradient-to-r from-transparent via-purple-300/30 to-transparent" />

        </div>

        <div className="relative grid h-[56px] grid-cols-5">

          {[
            {
              to: "/",
              icon: <FiHome />,
              label: "Home",
              match: "/",
            },
            {
              to: "/search",
              icon: <FiSearch />,
              label: "Search",
              match: "/search",
            },
            {
              to: "/genres",
              icon: <FiGrid />,
              label: "Genres",
              match: "/genres",
            },
            {
              to: "/watchlist",
              icon: <FiBookmark />,
              label: "Saved",
              match: "/watchlist",
            },
            {
              to: user ? "/profile" : "/login",
              icon: <FiUser />,
              label: user ? "Profile" : "Login",
              match: user ? "/profile" : "/login",
            },
          ].map((item) => {
            const active = isActive(item.match);

            return (
              <Link
                key={item.to}
                to={item.to}
                className={`relative flex flex-col items-center justify-center gap-1 text-xs transition-all duration-300 ${
                  active
                    ? "text-pink-400"
                    : "text-white/50 hover:text-white"
                }`}
              >
                <span
                  className={`text-lg ${
                    active
                      ? "drop-shadow-[0_0_8px_rgba(244,114,182,0.7)]"
                      : ""
                  }`}
                >
                  {item.icon}
                </span>

                <span className="text-[10px] font-medium">
                  {item.label}
                </span>

                {active && (
                  <span className="absolute bottom-1 h-1 w-1 rounded-full bg-pink-400 shadow-[0_0_8px_rgba(244,114,182,0.9)]" />
                )}

              </Link>
            );
          })}

        </div>
      </div>
    </>
  );
}