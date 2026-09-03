import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AnimeDetails from "./pages/AnimeDetails";
import Watch from "./pages/Watch";
import Genres from "./pages/Genres";
import GenreAnime from "./pages/GenreAnime";
import History from "./pages/History";
import Watchlist from "./pages/Watchlist";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Search from "./pages/Search";

export default function App() {
  return (
    <div className="min-h-screen bg-dark-900 flex flex-col">
      <Navbar />
      <main className="flex-1 pb-20 md:pb-0">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/search" element={<Search />} />
          <Route path="/anime/:id" element={<AnimeDetails />} />
          <Route path="/genres" element={<Genres />} />
          <Route path="/genres/:genre" element={<GenreAnime />} />

          {/* Protected Routes */}
          <Route
            path="/watch/:animeId/:episodeId"
            element={
              <ProtectedRoute>
                <Watch />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            }
          />
          <Route
            path="/watchlist"
            element={
              <ProtectedRoute>
                <Watchlist />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />

          {/* Catch All - Redirect to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
