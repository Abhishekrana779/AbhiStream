import { useState, useEffect } from "react";
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
  FiChevronDown,
} from "react-icons/fi";
import { useAuth } from "../hooks/useAuth";
import SearchBar from "./SearchBar";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navLinks = [
    {
      label: "Home",
      path: "/",
      icon: <FiHome className="w-[18px] h-[18px]" />,
    },
    {
      label: "Anime",
      path: "/search",
      icon: <FiSearch className="w-[18px] h-[18px]" />,
    },
    {
      label: "Genres",
      path: "/genres",
      icon: <FiGrid className="w-[18px] h-[18px]" />,
    },
  ];

  const userLinks = user
    ? [
        {
          label: "Watchlist",
          path: "/watchlist",
          icon: <FiBookmark className="w-[18px] h-[18px]" />,
        },
        {
          label: "History",
          path: "/history",
          icon: <FiClock className="w-[18px] h-[18px]" />,
        },
        {
          label: "Profile",
          path: "/profile",
          icon: <FiUser className="w-[18px] h-[18px]" />,
        },
        {
          label: "Settings",
          path: "/settings",
          icon: <FiSettings className="w-[18px] h-[18px]" />,
        },
      ]
    : [];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      {/* Main navbar */}
      <div className="relative bg-[#08080d]/95 backdrop-blur-2xl border-b border-purple-500/10 shadow-[0_4px_30px_rgba(0,0,0,0.45)]">

        {/* Color glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 left-[15%] w-72 h-48 bg-purple-600/10 blur-3xl rounded-full" />
          <div className="absolute -top-24 right-[20%] w-64 h-48 bg-pink-600/10 blur-3xl rounded-full" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[70px]">

            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-3 shrink-0 group"
            >
              <div className="relative">
                <div className="absolute inset-[-5px] rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 blur-md opacity-30 group-hover:opacity-70 transition duration-300" />

                <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 via-fuchsia-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-900/40 group-hover:scale-105 transition-transform duration-300">
                  <span className="text-white font-black text-xl">
                    A
                  </span>
                </div>
              </div>

              <div className="hidden sm:block">
                <div className="text-white font-extrabold text-xl tracking-tight leading-none">
                  Abhi<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400">Stream</span>
                </div>

                <div className="text-[9px] text-gray-500 font-medium tracking-[0.22em] uppercase mt-1">
                  Anime Streaming
                </div>
              </div>
            </Link>

            {/* Desktop navigation */}
            <div className="hidden md:flex items-center gap-1 ml-8">

              {navLinks.map((link) => {
                const active = isActive(link.path);

                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`relative group flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      active
                        ? "text-white"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {active && (
                      <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600/20 to-pink-500/10 border border-purple-500/20" />
                    )}

                    {!active && (
                      <span className="absolute inset-0 rounded-xl bg-white/[0.03] opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}

                    <span
                      className={`relative transition-colors ${
                        active
                          ? "text-purple-400"
                          : "text-gray-500 group-hover:text-purple-400"
                      }`}
                    >
                      {link.icon}
                    </span>

                    <span className="relative">
                      {link.label}
                    </span>

                    {active && (
                      <span className="absolute -bottom-[5px] left-1/2 -translate-x-1/2 w-5 h-[2px] rounded-full bg-gradient-to-r from-purple-400 to-pink-400 shadow-[0_0_10px_rgba(168,85,247,0.9)]" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Desktop right side */}
            <div className="hidden md:flex items-center gap-3 ml-auto">

              {/* Search */}
              <div className="w-64 lg:w-72">
                <SearchBar />
              </div>

              {user ? (
                <div className="flex items-center gap-1 pl-3 border-l border-white/[0.08]">

                  {userLinks.map((link) => {
                    const active = isActive(link.path);

                    return (
                      <Link
                        key={link.path}
                        to={link.path}
                        title={link.label}
                        className={`relative p-2.5 rounded-xl transition-all duration-200 ${
                          active
                            ? "text-purple-300 bg-purple-500/15"
                            : "text-gray-400 hover:text-white hover:bg-white/[0.06]"
                        }`}
                      >
                        {link.icon}

                        {active && (
                          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-pink-400 shadow-[0_0_7px_rgba(236,72,153,0.9)]" />
                        )}
                      </Link>
                    );
                  })}

                  <button
                    onClick={handleLogout}
                    title="Logout"
                    className="p-2.5 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                  >
                    <FiLogOut className="w-[18px] h-[18px]" />
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="relative overflow-hidden flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-500 shadow-lg shadow-purple-900/30 hover:shadow-purple-700/40 hover:scale-[1.03] transition-all duration-200"
                >
                  <span className="relative z-10">
                    Sign In
                  </span>

                  <FiChevronDown className="relative z-10 rotate-[-90deg] w-4 h-4" />

                  <span className="absolute inset-0 bg-gradient-to-r from-pink-500 via-fuchsia-600 to-purple-600 opacity-0 hover:opacity-100 transition-opacity duration-300" />
                </Link>
              )}
            </div>

            {/* Mobile buttons */}
            <div className="flex md:hidden items-center gap-1">

              <button
                onClick={() => setSearchOpen(!searchOpen)}
                aria-label="Search"
                className={`p-2.5 rounded-xl transition-all ${
                  searchOpen
                    ? "text-purple-300 bg-purple-500/15"
                    : "text-gray-300 hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                <FiSearch className="w-5 h-5" />
              </button>

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Menu"
                className={`p-2.5 rounded-xl transition-all ${
                  mobileOpen
                    ? "text-pink-300 bg-pink-500/10"
                    : "text-gray-300 hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                {mobileOpen ? (
                  <FiX className="w-5 h-5" />
                ) : (
                  <FiMenu className="w-5 h-5" />
                )}
              </button>

            </div>
          </div>

          {/* Mobile search */}
          {searchOpen && (
            <div className="md:hidden pb-4 pt-1">
              <div className="relative">
                <div className="absolute inset-0 bg-purple-600/10 blur-xl rounded-xl pointer-events-none" />

                <div className="relative">
                  <SearchBar
                    onSearch={(q) => {
                      if (q) {
                        navigate(
                          `/search?q=${encodeURIComponent(q)}`
                        );
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="relative md:hidden border-t border-purple-500/10 bg-[#08080d]/98 backdrop-blur-2xl shadow-2xl">

            <div className="px-4 py-4 space-y-1">

              {navLinks.map((link) => {
                const active = isActive(link.path);

                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`relative flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold overflow-hidden transition-all ${
                      active
                        ? "text-white"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {active && (
                      <>
                        <span className="absolute inset-0 bg-gradient-to-r from-purple-600/15 to-pink-500/5" />
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 rounded-r-full bg-gradient-to-b from-purple-400 to-pink-400" />
                      </>
                    )}

                    <span
                      className={`relative ${
                        active
                          ? "text-purple-400"
                          : "text-gray-500"
                      }`}
                    >
                      {link.icon}
                    </span>

                    <span className="relative">
                      {link.label}
                    </span>

                    {active && (
                      <span className="relative ml-auto w-1.5 h-1.5 rounded-full bg-pink-400 shadow-[0_0_8px_rgba(236,72,153,0.9)]" />
                    )}
                  </Link>
                );
              })}

              {user ? (
                <>
                  <div className="flex items-center gap-3 px-2 py-3 mt-3 mb-2">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-purple-500/20" />

                    <span className="text-[10px] text-gray-600 uppercase tracking-[0.2em] font-bold">
                      Account
                    </span>

                    <div className="h-px flex-1 bg-gradient-to-l from-transparent to-pink-500/20" />
                  </div>

                  {userLinks.map((link) => {
                    const active = isActive(link.path);

                    return (
                      <Link
                        key={link.path}
                        to={link.path}
                        className={`relative flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all ${
                          active
                            ? "bg-gradient-to-r from-purple-600/15 to-pink-500/5 text-white"
                            : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
                        }`}
                      >
                        <span
                          className={
                            active
                              ? "text-purple-400"
                              : "text-gray-500"
                          }
                        >
                          {link.icon}
                        </span>

                        {link.label}

                        {active && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-pink-400" />
                        )}
                      </Link>
                    );
                  })}

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-3.5 mt-1 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <FiLogOut className="w-[18px] h-[18px]" />
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="relative flex items-center justify-center w-full mt-3 py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-500 shadow-lg shadow-purple-900/30 overflow-hidden"
                >
                  <span className="relative z-10">
                    Sign In
                  </span>

                  <span className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-600 opacity-0 hover:opacity-100 transition-opacity" />
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom colorful accent */}
      <div className="h-[2px] bg-gradient-to-r from-purple-600 via-fuchsia-500 to-pink-500 opacity-70" />
    </nav>
  );
}