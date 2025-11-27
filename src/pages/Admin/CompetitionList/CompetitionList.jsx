import { useState } from 'react';
import { FaTrophy, FaPlus, FaEye, FaEdit, FaTrash, FaUsers, FaClock } from 'react-icons/fa';
import { PageHeader, Button, DataTable, Badge, IconButton } from '../../../components/Admin';
import styles from './CompetitionList.module.css';

function CompetitionList() {
  const [activeTab, setActiveTab] = useState('all');

  const competitions = [
    { id: 1, name: 'Spring Championship', status: 'Live', startTime: '2024-11-27 10:00', duration: '2 hours', players: 128, maxPlayers: 150 },
    { id: 2, name: 'Rapid Blitz', status: 'Upcoming', startTime: '2024-11-28 14:00', duration: '1 hour', players: 64, maxPlayers: 100 },
    { id: 3, name: 'Weekly Puzzle Rush', status: 'Completed', startTime: '2024-11-20 09:00', duration: '3 hours', players: 256, maxPlayers: 256 },
    { id: 4, name: 'Beginner Tournament', status: 'Upcoming', startTime: '2024-11-29 16:00', duration: '1.5 hours', players: 45, maxPlayers: 80 },
  ];

  const filteredCompetitions = activeTab === 'all' 
    ? competitions 
    : competitions.filter(c => c.status.toLowerCase() === activeTab);

  const columns = [
    { key: 'name', label: 'Name' },
    { 
      key: 'status', 
      label: 'Status',
      render: (status) => {
        const variantMap = {
          Live: 'live',
          Upcoming: 'warning',
          Completed: 'info'
        };
        return <Badge variant={variantMap[status]}>{status}</Badge>;
      }
    },
    { key: 'startTime', label: 'Start Time' },
    { 
      key: 'duration', 
      label: 'Duration',
      render: (duration) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <FaClock /> {duration}
        </span>
      )
    },
    { 
      key: 'players', 
      label: 'Players',
      render: (players, row) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <FaUsers /> {players}/{row.maxPlayers}
        </span>
      )
    },
  ];

  return (
    <div className={styles.competitionList}>
      <PageHeader
        icon={FaTrophy}
        title="Competition Management"
        subtitle="Manage all competitions and tournaments"
        action={
          <Button to="/admin/competitions/create" icon={FaPlus}>
            Create Competition
          </Button>
        }
      />

      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'all' ? styles.active : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'upcoming' ? styles.active : ''}`}
          onClick={() => setActiveTab('upcoming')}
        >
          Upcoming
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'live' ? styles.active : ''}`}
          onClick={() => setActiveTab('live')}
        >
          Live
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'completed' ? styles.active : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          Completed
        </button>
      </div>

      <DataTable
        columns={columns}
        data={filteredCompetitions}
        actions={(comp) => (
          <>
            <IconButton
              icon={FaEye}
              to={`/admin/competitions/${comp.id}`}
              title="View Details"
              variant="primary"
            />
            <IconButton
              icon={FaEdit}
              to={`/admin/competitions/edit/${comp.id}`}
              title="Edit"
              variant="primary"
            />
            <IconButton
              icon={FaTrash}
              onClick={() => confirm('Delete this competition?')}
              title="Delete"
              variant="danger"
            />
          </>
        )}
        emptyMessage="No competitions found"
      />
    </div>
  );
}

export default CompetitionList;
