import React, { useState } from 'react';
import './QuickMatch.css';

const QuickMatch = ({ recommendedPyckers, onSelectPycker, onBrowseAll, onBack }) => {
  const [selectedPycker, setSelectedPycker] = useState(null);

  const handleSelectPycker = (pycker) => {
    setSelectedPycker(pycker);
  };

  const handleConfirm = () => {
    if (selectedPycker) {
      onSelectPycker(selectedPycker);
    }
  };

  return (
    <div className="quick-match-container">
      <div className="quick-match-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <div className="header-content">
          <h2>Quick Match Results</h2>
          <p>Our top 3 recommended pyckers for your job</p>
        </div>
      </div>

      <div className="match-badge">
        <span className="badge-icon">⚡</span>
        <span>AI-Powered Matching</span>
      </div>

      <div className="recommended-pyckers">
        {recommendedPyckers.map((pycker, index) => (
          <div 
            key={pycker.id} 
            className={`pycker-card-detailed ${selectedPycker?.id === pycker.id ? 'selected' : ''}`}
            onClick={() => handleSelectPycker(pycker)}
          >
            {index === 0 && (
              <div className="best-match-ribbon">
                <span>🏆 Best Match</span>
              </div>
            )}
            
            <div className="card-header">
              <div className="pycker-photo-container">
                <img 
                  src={pycker.photo || '/default-avatar.png'} 
                  alt={pycker.name}
                  className="pycker-photo-large"
                />
                {pycker.verified && (
                  <div className="verified-checkmark">✓</div>
                )}
              </div>
              
              <div className="pycker-info">
                <h3>{pycker.name}</h3>
                <div className="rating-large">
                  <span className="stars">⭐ {pycker.rating.toFixed(1)}</span>
                  <span className="reviews">({pycker.completedJobs} jobs)</span>
                </div>
              </div>
            </div>

            <div className="card-body">
              <div className="stats-grid">
                <div className="stat-box">
                  <span className="stat-icon">🚚</span>
                  <div className="stat-content">
                    <span className="stat-label">Specialty</span>
                    <span className="stat-value">{pycker.specialty || 'General'}</span>
                  </div>
                </div>

                <div className="stat-box">
                  <span className="stat-icon">📍</span>
                  <div className="stat-content">
                    <span className="stat-label">Distance</span>
                    <span className="stat-value">{pycker.distance} mi</span>
                  </div>
                </div>

                <div className="stat-box">
                  <span className="stat-icon">💰</span>
                  <div className="stat-content">
                    <span className="stat-label">Rate</span>
                    <span className="stat-value">${pycker.hourlyRate}/hr</span>
                  </div>
                </div>

                <div className="stat-box">
                  <span className="stat-icon">
                    {pycker.available ? '🟢' : '🟡'}
                  </span>
                  <div className="stat-content">
                    <span className="stat-label">Status</span>
                    <span className="stat-value">
                      {pycker.available ? 'Today' : 'Tomorrow'}
                    </span>
                  </div>
                </div>
              </div>

              {pycker.badges && pycker.badges.length > 0 && (
                <div className="badges-row">
                  {pycker.badges.map((badge, i) => (
                    <span key={i} className="badge-chip">{badge}</span>
                  ))}
                </div>
              )}

              {pycker.bio && (
                <div className="bio-section">
                  <p>{pycker.bio}</p>
                </div>
              )}

              <div className="why-recommended">
                <h4>Why this pycker?</h4>
                <ul>
                  {index === 0 && <li>Highest rating in your area</li>}
                  {pycker.available && <li>Available immediately</li>}
                  {pycker.distance < 5 && <li>Closest to your location</li>}
                  {pycker.specialty && <li>Specializes in {pycker.specialty.toLowerCase()}</li>}
                  {pycker.completedJobs > 50 && <li>Experienced professional ({pycker.completedJobs}+ jobs)</li>}
                </ul>
              </div>
            </div>

            <button 
              className={`select-pycker-btn ${selectedPycker?.id === pycker.id ? 'selected' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                handleSelectPycker(pycker);
              }}
            >
              {selectedPycker?.id === pycker.id ? '✓ Selected' : 'Select This Pycker'}
            </button>
          </div>
        ))}
      </div>

      <div className="action-section">
        {selectedPycker ? (
          <button className="confirm-btn" onClick={handleConfirm}>
            Book {selectedPycker.name}
          </button>
        ) : (
          <p className="select-prompt">Select a pycker to continue</p>
        )}
        
        <button className="browse-all-btn" onClick={onBrowseAll}>
          Not satisfied? Browse all pyckers
        </button>
      </div>
    </div>
  );
};

export default QuickMatch;
