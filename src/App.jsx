import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from './contexts/ThemeContext';
import Home from "./pages/Home/Home";
import Dashboard from "./pages/Dashboard/Dashboard";
import CasualPuzzlePage from "./pages/PuzzlePage/CasualPuzzlePage"; // Sidebar puzzles - no timer
import PuzzlePage from "./pages/PuzzlePage/PuzzlePage"; // Tournament puzzles - with timer
import Profile from "./pages/Profile/Profile";
import EditProfile from "./pages/Profile/EditProfile";
import UserSettings from "./pages/Settings/Settings";
import About from "./pages/About/About";
import Courses from "./pages/Courses/Courses";
import Coaching from "./pages/Coaching/Coaching";
import Pricing from "./pages/Pricing/Pricing";
import Contact from "./pages/Contact/Contact";

import AdminLogin from "./pages/Admin/AdminLogin/AdminLogin";
import AdminLayout from "./layouts/AdminLayout/AdminLayout";
import AdminDashboard from "./pages/Admin/AdminDashboard/AdminDashboard";
import MainLayout from "./layouts/MainLayout/MainLayout";

import CategoryList from "./pages/Admin/CategoryList/CategoryList";
import PuzzleList from "./pages/Admin/PuzzleList/PuzzleList";
import PuzzleLibrary from "./pages/Admin/PuzzleLibrary/PuzzleLibrary";
import CreatePuzzle from "./pages/Admin/CreatePuzzle/CreatePuzzle";
import EditPuzzle from "./pages/Admin/EditPuzzle/EditPuzzle";
import CompetitionList from "./pages/Admin/CompetitionList/CompetitionList";
import CreateCompetition from "./pages/Admin/CreateCompetition/CreateCompetition";
import EditCompetition from "./pages/Admin/EditCompetition/EditCompetition";
import CompetitionHistory from "./pages/Admin/CompetitionHistory/CompetitionHistory";
import LiveTournament from "./pages/Admin/LiveTournament/LiveTournament";
import CompetitionParticipants from "./pages/Admin/CompetitionParticipants/CompetitionParticipants";
import StudentList from "./pages/Admin/StudentList/StudentList";
import AdminManagement from "./pages/Admin/AdminManagement/AdminManagement";
import Leaderboard from "./pages/Admin/Leaderboard/Leaderboard";
import Reports from "./pages/Admin/Reports/Reports";
import SystemMonitor from "./pages/Admin/SystemMonitor/SystemMonitor";
import AdminSettings from "./pages/Admin/Settings/Settings";
import Competitions from "./pages/Competitions/Competitions";


import UserProtectedRoute from "./components/ProtectedRoute/UserProtectedRoute";
import AdminProtectedRoute from "./components/ProtectedRoute/AdminProtectedRoute";
import AdminRedirect from "./components/AdminRedirect";   // NEW
import { AuthProvider } from "./contexts/AuthContext";

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <Routes>

            {/* User Layout w/ Sidebar & Bottom Nav */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/coaching" element={<Coaching />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/competitions" element={<Competitions />} />

              <Route
                path="/dashboard"
                element={
                  <UserProtectedRoute>
                    <Dashboard />
                  </UserProtectedRoute>
                }
              />
              <Route path="/profile" element={<Profile />} />
              <Route
                path="/profile/edit"
                element={
                  <UserProtectedRoute>
                    <EditProfile />
                  </UserProtectedRoute>
                }
              />
              <Route path="/settings" element={<UserSettings />} />
              {/* Casual Puzzles - No Timer (Sidebar Link) */}
              <Route
                path="/puzzles"
                element={
                  <UserProtectedRoute>
                    <CasualPuzzlePage />
                  </UserProtectedRoute>
                }
              />

              {/* Tournament/Competition Puzzles - With Timer */}
              <Route
                path="/puzzle"
                element={
                  <UserProtectedRoute>
                    <PuzzlePage />
                  </UserProtectedRoute>
                }
              />
              <Route
                path="/competition/:id/puzzle"
                element={
                  <UserProtectedRoute>
                    <PuzzlePage />
                  </UserProtectedRoute>
                }
              />
              <Route
                path="/tournament/:id/puzzle"
                element={
                  <UserProtectedRoute>
                    <PuzzlePage />
                  </UserProtectedRoute>
                }
              />
            </Route>

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
              <Route path="puzzle-library" element={<PuzzleLibrary />} />
              <Route path="puzzles/create" element={<CreatePuzzle />} />
              <Route path="puzzles/edit/:id" element={<EditPuzzle />} />
              <Route path="competitions" element={<CompetitionList />} />
              <Route path="competitions/create" element={<CreateCompetition />} />
              <Route path="competitions/edit/:id" element={<EditCompetition />} />
              <Route
                path="competitions/:id/participants"
                element={<CompetitionParticipants />}
              />
              <Route path="competitions/live" element={<LiveTournament />} />
              <Route path="competitions/history" element={<CompetitionHistory />} />
              <Route path="students" element={<StudentList />} />
              <Route path="admins" element={<AdminManagement />} />
              <Route path="leaderboard" element={<Leaderboard />} />
              <Route path="reports" element={<Reports />} />
              <Route path="monitoring" element={<SystemMonitor />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

          </Routes>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
