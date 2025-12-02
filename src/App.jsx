import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home/Home";
import Dashboard from "./pages/Dashboard/Dashboard";
import PuzzlePage from "./pages/PuzzlePage/PuzzlePage";

import AdminLogin from "./pages/Admin/AdminLogin/AdminLogin";
import AdminLayout from "./layouts/AdminLayout/AdminLayout";
import AdminDashboard from "./pages/Admin/AdminDashboard/AdminDashboard";

import CategoryList from "./pages/Admin/CategoryList/CategoryList";
import PuzzleList from "./pages/Admin/PuzzleList/PuzzleList";
import CreatePuzzle from "./pages/Admin/CreatePuzzle/CreatePuzzle";
import EditPuzzle from "./pages/Admin/EditPuzzle/EditPuzzle";
import CompetitionList from "./pages/Admin/CompetitionList/CompetitionList";
import CreateCompetition from "./pages/Admin/CreateCompetition/CreateCompetition";
import CompetitionHistory from "./pages/Admin/CompetitionHistory/CompetitionHistory";
import LiveTournament from "./pages/Admin/LiveTournament/LiveTournament";
import StudentList from "./pages/Admin/StudentList/StudentList";
import AdminManagement from "./pages/Admin/AdminManagement/AdminManagement";
import Leaderboard from "./pages/Admin/Leaderboard/Leaderboard";
import Reports from "./pages/Admin/Reports/Reports";
import SystemMonitor from "./pages/Admin/SystemMonitor/SystemMonitor";
import Settings from "./pages/Admin/Settings/Settings";

import UserProtectedRoute from "./components/ProtectedRoute/UserProtectedRoute";
import AdminProtectedRoute from "./components/ProtectedRoute/AdminProtectedRoute";
import AdminRedirect from "./components/AdminRedirect";   // NEW

function App() {
  return (
    <Router>
      <Routes>

        {/* Public */}
        <Route path="/" element={<Home />} />

        {/* User protected */}
        <Route
          path="/dashboard"
          element={
            <UserProtectedRoute>
              <Dashboard />
            </UserProtectedRoute>
          }
        />
        <Route
          path="/puzzle"
          element={
            <UserProtectedRoute>
              <PuzzlePage />
            </UserProtectedRoute>
          }
        />

        {/* Admin login */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Automatic admin redirect */}
        <Route path="/admin" element={<AdminRedirect />} />

        {/* Admin protected pages */}
        <Route
          path="/admin"
          element={
            <AdminProtectedRoute>
              <AdminLayout />
            </AdminProtectedRoute>
          }
        >
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="categories" element={<CategoryList />} />
          <Route path="puzzles" element={<PuzzleList />} />
          <Route path="puzzles/create" element={<CreatePuzzle />} />
          <Route path="puzzles/edit/:id" element={<EditPuzzle />} />
          <Route path="competitions" element={<CompetitionList />} />
          <Route path="competitions/create" element={<CreateCompetition />} />
          <Route path="competitions/live" element={<LiveTournament />} />
          <Route path="competitions/history" element={<CompetitionHistory />} />
          <Route path="students" element={<StudentList />} />
          <Route path="admins" element={<AdminManagement />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="reports" element={<Reports />} />
          <Route path="monitoring" element={<SystemMonitor />} />
          <Route path="settings" element={<Settings />} />
        </Route>

      </Routes>
    </Router>
  );
}

export default App;
