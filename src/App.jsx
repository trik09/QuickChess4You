import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Home from './pages/Home/Home';
import Dashboard from './pages/Dashboard/Dashboard';
import PuzzlePage from './pages/PuzzlePage/PuzzlePage';
import AdminLogin from './pages/Admin/AdminLogin/AdminLogin';
import AdminLayout from './layouts/AdminLayout/AdminLayout';
import AdminDashboard from './pages/Admin/AdminDashboard/AdminDashboard';
import CategoryList from './pages/Admin/CategoryList/CategoryList';
import PuzzleList from './pages/Admin/PuzzleList/PuzzleList';
import CompetitionList from './pages/Admin/CompetitionList/CompetitionList';
import CreateCompetition from './pages/Admin/CreateCompetition/CreateCompetition';
import CompetitionHistory from './pages/Admin/CompetitionHistory/CompetitionHistory';
import LiveTournament from './pages/Admin/LiveTournament/LiveTournament';
import StudentList from './pages/Admin/StudentList/StudentList';
import AdminManagement from './pages/Admin/AdminManagement/AdminManagement';
import CreatePuzzle from './pages/Admin/CreatePuzzle/CreatePuzzle';
import EditPuzzle from './pages/Admin/EditPuzzle/EditPuzzle';
import Leaderboard from './pages/Admin/Leaderboard/Leaderboard';
import Reports from './pages/Admin/Reports/Reports';
import SystemMonitor from './pages/Admin/SystemMonitor/SystemMonitor';
import Settings from './pages/Admin/Settings/Settings';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        {/* Temporarily removed login requirement for tournaments */}
        <Route 
          path="/dashboard" 
          element={<Dashboard />}
          // element={
          //   <ProtectedRoute>
          //     <Dashboard />
          //   </ProtectedRoute>
          // } 
        />
        {/* Temporarily removed login requirement for puzzle play */}
        <Route 
          path="/puzzle" 
          element={<PuzzlePage />}
          // element={
          //   <ProtectedRoute>
          //     <PuzzlePage />
          //   </ProtectedRoute>
          // } 
        />
        
        {/* Admin Login Route */}
        <Route path="/admin/login" element={<AdminLogin />} />
        
        {/* Redirect /admin to /admin/login or dashboard based on auth */}
        <Route 
          path="/admin" 
          element={
            localStorage.getItem('adminAuth') === 'true' 
              ? <Navigate to="/admin/dashboard" replace /> 
              : <Navigate to="/admin/login" replace />
          } 
        />
        
        {/* Protected Admin Routes */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute requireAdmin={true}>
              <AdminLayout />
            </ProtectedRoute>
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
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
