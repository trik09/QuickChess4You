import { useState } from 'react';
import { FaUserGraduate, FaEye, FaEdit, FaUser, FaFilter } from 'react-icons/fa';
import { PageHeader, SearchBar, FilterSelect, DataTable, Badge, IconButton } from '../../../components/Admin';
import styles from './StudentList.module.css';

function StudentList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const students = [
    { id: 1, name: 'John Doe', email: 'john@example.com', phone: '+1234567890', totalScore: 1250, status: 'Active', joined: '2024-01-15' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', phone: '+1234567891', totalScore: 980, status: 'Active', joined: '2024-02-20' },
    { id: 3, name: 'Mike Johnson', email: 'mike@example.com', phone: '+1234567892', totalScore: 1450, status: 'Active', joined: '2024-03-10' },
    { id: 4, name: 'Sarah Williams', email: 'sarah@example.com', phone: '+1234567893', totalScore: 750, status: 'Inactive', joined: '2024-04-05' },
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  const columns = [
    { 
      key: 'name', 
      label: 'Name',
      render: (name) => (
        <div className={styles.studentInfo}>
          <div className={styles.avatar}><FaUser /></div>
          <span>{name}</span>
        </div>
      )
    },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { 
      key: 'totalScore', 
      label: 'Total Score',
      render: (score) => <strong>{score}</strong>
    },
    { 
      key: 'status', 
      label: 'Status',
      render: (status) => (
        <Badge variant={status === 'Active' ? 'success' : 'danger'}>
          {status}
        </Badge>
      )
    },
    { key: 'joined', label: 'Joined' },
  ];

  return (
    <div className={styles.studentList}>
      <PageHeader
        icon={FaUserGraduate}
        title="Student Management"
        subtitle="Manage all registered students"
      />

      <div className={styles.filters}>
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search students by name or email..."
        />
        <FilterSelect
          value={filterStatus}
          onChange={setFilterStatus}
          options={statusOptions}
          icon={FaFilter}
          label="Status"
        />
      </div>

      <DataTable
        columns={columns}
        data={students}
        actions={(student) => (
          <>
            <IconButton
              icon={FaEye}
              to={`/admin/students/${student.id}`}
              title="View Details"
              variant="primary"
            />
            <IconButton
              icon={FaEdit}
              onClick={() => alert('Edit student')}
              title="Edit"
              variant="primary"
            />
          </>
        )}
        emptyMessage="No students found"
      />
    </div>
  );
}

export default StudentList;
