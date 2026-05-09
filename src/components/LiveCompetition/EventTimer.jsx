import React, { useState, useEffect } from 'react';
import { FaClock } from 'react-icons/fa';
import { MdWarning } from 'react-icons/md';
import { useLiveEvent } from '../../contexts/LiveEventContext';
import './CompetitionTimer.css';

const EventTimer = () => {
  const { event, getTimeRemaining, isEventActive } = useLiveEvent();
  const [timeLeft, setTimeLeft] = useState(0);
  const [isWarning, setIsWarning] = useState(false);
  const [isCritical, setIsCritical] = useState(false);

  useEffect(() => {
    if (!event) return;

    const updateTimer = () => {
      const remaining = getTimeRemaining ? getTimeRemaining() : 0;
      setTimeLeft(remaining);

      const minutes = Math.floor(remaining / (1000 * 60));
      setIsWarning(minutes <= 10 && minutes > 5);
      setIsCritical(minutes <= 5);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [event, getTimeRemaining]);

  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    if (!event) return 0;
    
    const start = new Date(event.startTime).getTime();
    const end = new Date(event.endTime).getTime();
    const now = Date.now();
    
    const total = end - start;
    const elapsed = now - start;
    
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  };

  const getStatusMessage = () => {
    if (!event) return 'No event';
    
    const now = new Date();
    const startTime = new Date(event.startTime);
    const endTime = new Date(event.endTime);
    
    if (now < startTime) {
      return 'Event starts soon';
    } else if (now > endTime) {
      return 'Event ended';
    } else {
      return 'Event in progress';
    }
  };

  if (!event) {
    return null;
  }

  const progress = getProgress();
  const statusMessage = getStatusMessage();

  return (
    <div className={`competition-timer ${isWarning ? 'warning' : ''} ${isCritical ? 'critical' : ''}`}>
      <div className="timer-header">
        <h4 className="timer-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FaClock /> {event.name}</h4>
        <span className={`status-badge ${isEventActive && isEventActive() ? 'active' : 'inactive'}`}>
          {statusMessage}
        </span>
      </div>

      <div className="timer-display">
        <div className="time-remaining">
          <span className="time-value">{formatTime(timeLeft)}</span>
          <span className="time-label">remaining</span>
        </div>
        
        {isCritical && (
          <div className="critical-warning" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MdWarning /> Hurry up!
          </div>
        )}
      </div>

      <div className="progress-container">
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="progress-text">
          {Math.round(progress)}% complete
        </div>
      </div>

      <div className="timer-details">
        <div className="detail-item">
          <span className="detail-label">Started:</span>
          <span className="detail-value">
            {new Date(event.startTime).toLocaleTimeString()}
          </span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Ends:</span>
          <span className="detail-value">
            {new Date(event.endTime).toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default EventTimer;
