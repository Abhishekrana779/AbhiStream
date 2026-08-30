import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-dark-800 border-t border-dark-600 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="text-white font-bold text-lg">AbhiStream</span>
            </div>
            <p className="text-gray-400 text-sm">
              Your gateway to the best anime streaming experience. Watch your favorite anime for free.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Browse</h3>
            <ul className="space-y-2">
              <li><Link to="/search" className="text-gray-400 text-sm hover:text-primary transition">Search Anime</Link></li>
              <li><Link to="/genres" className="text-gray-400 text-sm hover:text-primary transition">Genres</Link></li>
              <li><Link to="/search?q=trending" className="text-gray-400 text-sm hover:text-primary transition">Trending</Link></li>
              <li><Link to="/search?q=popular" className="text-gray-400 text-sm hover:text-primary transition">Popular</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Account</h3>
            <ul className="space-y-2">
              <li><Link to="/watchlist" className="text-gray-400 text-sm hover:text-primary transition">Watchlist</Link></li>
              <li><Link to="/history" className="text-gray-400 text-sm hover:text-primary transition">History</Link></li>
              <li><Link to="/profile" className="text-gray-400 text-sm hover:text-primary transition">Profile</Link></li>
              <li><Link to="/settings" className="text-gray-400 text-sm hover:text-primary transition">Settings</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><span className="text-gray-400 text-sm">Terms of Service</span></li>
              <li><span className="text-gray-400 text-sm">Privacy Policy</span></li>
              <li><span className="text-gray-400 text-sm">DMCA</span></li>
              <li><span className="text-gray-400 text-sm">Contact</span></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-dark-600 mt-8 pt-6 text-center">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} AbhiStream. All rights reserved. This site does not store any files on its server.
          </p>
        </div>
      </div>
    </footer>
  );
}