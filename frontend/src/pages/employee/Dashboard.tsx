import { useAuthStore } from '../../stores/authStore';
import { useNavigate, Link } from 'react-router-dom';

export default function EmployeeDashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Worktime - Employee Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
              <button onClick={handleLogout} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">Logout</button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-600">Total Hours (Month)</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">168.5h</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-600">Days Worked</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">22</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-600">Daily Average</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">7.7h</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Link to="/employee/time-entry" className="block p-4 border-2 border-blue-500 rounded-lg hover:bg-blue-50 transition-colors">
              <h3 className="font-semibold text-blue-900">Log Time Entry</h3>
              <p className="text-sm text-gray-600 mt-1">Add new time tracking entry</p>
            </Link>
            <Link to="/employee/history" className="block p-4 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <h3 className="font-semibold text-gray-900">View History</h3>
              <p className="text-sm text-gray-600 mt-1">See all your time entries</p>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Time Entries</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div>
                <p className="font-medium">Website Redesign - Main Office</p>
                <p className="text-sm text-gray-600">2026-01-15 • 09:00 - 17:30</p>
              </div>
              <span className="text-green-600 font-semibold">8.5h</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div>
                <p className="font-medium">Mobile App Development - Remote</p>
                <p className="text-sm text-gray-600">2026-01-16 • 10:00 - 19:00</p>
              </div>
              <span className="text-green-600 font-semibold">9.0h</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
