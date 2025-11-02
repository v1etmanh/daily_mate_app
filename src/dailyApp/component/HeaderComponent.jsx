import { Link } from "react-router-dom";
import { useAuth } from "../security/Authentication";
import { logOutkeycloak } from "../api/KeycloakService";

export default function HeaderComponent({ isOpen, onClose }) {
  const auth = useAuth();

  const handleLinkClick = () => {
    onClose(); // Đóng sidebar khi click vào link
  };

  const handleLogout = () => {
    logOutkeycloak();
    auth.setAuthentication(false);
    onClose(); // Đóng sidebar sau khi logout
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`font-grotesk fixed top-0 left-0 h-full bg-white shadow-2xl transform transition-transform duration-300 ease-out z-50 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } w-80`}>
        
        {/* Header của sidebar */}
        <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-slate-800">DailyMate</h1>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200"
            >
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation menu */}
        <nav className="p-4 flex-1 overflow-y-auto">
          <ul className="space-y-2">
            <li>
              <Link
                to="/"
                onClick={handleLinkClick}
                className="flex items-center p-3 text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-all duration-200 no-underline rounded-xl group"
              >
                <div className="w-10 h-10 mr-3 flex items-center justify-center bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <span className="font-medium">Home</span>
              </Link>
            </li>

            {!auth.isAuthentication && (
              <li>
                <Link
                  to="/login"
                  onClick={handleLinkClick}
                  className="flex items-center p-3 text-slate-700 hover:text-slate-900 hover:bg-emerald-50 transition-all duration-200 no-underline rounded-xl group"
                >
                  <div className="w-10 h-10 mr-3 flex items-center justify-center bg-emerald-50 rounded-xl group-hover:bg-emerald-100 transition-colors">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                  </div>
                  <span className="font-medium">Login</span>
                </Link>
              </li>
            )}

            {auth.isAuthentication && (
              <>
                <li>
                  <Link
                    to="/createDish"
                    onClick={handleLinkClick}
                    className="flex items-center p-3 text-slate-700 hover:text-slate-900 hover:bg-violet-50 transition-all duration-200 no-underline rounded-xl group"
                  >
                    <div className="w-10 h-10 mr-3 flex items-center justify-center bg-violet-50 rounded-xl group-hover:bg-violet-100 transition-colors">
                      <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <span className="font-medium">Find Dishes</span>
                  </Link>
                </li>
                
                <li>
                  <Link
                    to="/memberInfor"
                    onClick={handleLinkClick}
                    className="flex items-center p-3 text-slate-700 hover:text-slate-900 hover:bg-amber-50 transition-all duration-200 no-underline rounded-xl group"
                  >
                    <div className="w-10 h-10 mr-3 flex items-center justify-center bg-amber-50 rounded-xl group-hover:bg-amber-100 transition-colors">
                      <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <span className="font-medium">Member Info</span>
                  </Link>
                </li>
                
                <li>
                  <Link
                    to="/history"
                    onClick={handleLinkClick}
                    className="flex items-center p-3 text-slate-700 hover:text-slate-900 hover:bg-orange-50 transition-all duration-200 no-underline rounded-xl group"
                  >
                    <div className="w-10 h-10 mr-3 flex items-center justify-center bg-orange-50 rounded-xl group-hover:bg-orange-100 transition-colors">
                      <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="font-medium">Meal History</span>
                  </Link>
                </li>

                <li>
                  <Link
                    to="/healthyNew"
                    onClick={handleLinkClick}
                    className="flex items-center p-3 text-slate-700 hover:text-slate-900 hover:bg-rose-50 transition-all duration-200 no-underline rounded-xl group"
                  >
                    <div className="w-10 h-10 mr-3 flex items-center justify-center bg-rose-50 rounded-xl group-hover:bg-rose-100 transition-colors">
                      <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                      </svg>
                    </div>
                    <span className="font-medium">Health News</span>
                  </Link>
                </li>

                <li>
                  <Link
                    to="/defineDisease"
                    onClick={handleLinkClick}
                    className="flex items-center p-3 text-slate-700 hover:text-slate-900 hover:bg-red-50 transition-all duration-200 no-underline rounded-xl group"
                  >
                    <div className="w-10 h-10 mr-3 flex items-center justify-center bg-red-50 rounded-xl group-hover:bg-red-100 transition-colors">
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <span className="font-medium">Health Assessment</span>
                  </Link>
                </li>

                <li>
                  <Link
                    to="/Todo"
                    onClick={handleLinkClick}
                    className="flex items-center p-3 text-slate-700 hover:text-slate-900 hover:bg-indigo-50 transition-all duration-200 no-underline rounded-xl group"
                  >
                    <div className="w-10 h-10 mr-3 flex items-center justify-center bg-indigo-50 rounded-xl group-hover:bg-indigo-100 transition-colors">
                      <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 8l2 2 4-4" />
                      </svg>
                    </div>
                    <span className="font-medium">Todo List</span>
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>

        {/* Footer với logout button */}
        {auth.isAuthentication && (
          <div className="p-4 border-t border-slate-100 bg-slate-50">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center p-3 bg-slate-800 hover:bg-slate-900 text-white transition-all duration-200 rounded-xl group"
            >
              <div className="w-8 h-8 mr-3 flex items-center justify-center bg-slate-700 rounded-lg group-hover:bg-slate-600 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
}