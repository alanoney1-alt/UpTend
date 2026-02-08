import React, { useState } from 'react';
import './ShortlistReview.css';

const ShortlistReview = ({ shortlist, onSelectPycker, onBack }) => {
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
    <div className="shortlist-review-container">
      <div className="review-header">
        <button className="back-btn" onClick={onBack}>← Back to browsing</button>
        <h2>Your Shortlist</h2>
        <p>You shortlisted {shortlist.length} pycker{shortlist.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="shortlist-cards">
        {shortlist.map((pycker) => (
          <div 
            key={pycker.id}
            className={`shortlist-card ${selectedPycker?.id === pycker.id ? 'selected' : ''}`}
            onClick={() => handleSelectPycker(pycker)}
          >
            <div className="card-layout">
              <div className="card-left">
                <div className="photo-section">
                  <img 
                    src={pycker.photo || '/default-avatar.png'} 
                    alt={pycker.name}
                    className="pycker-photo"
                  />
                  {pycker.verified && (
                    <div className="verified-badge-small">✓</div>
                  )}
                </div>
                
                <div className="pycker-details">
                  <h3>{pycker.name}</h3>
                  <div className="rating-row">
                    <span className="stars">⭐ {pycker.rating.toFixed(1)}</span>
                    <span className="jobs-count">{pycker.completedJobs} jobs</span>
                  </div>
                </div>
              </div>

              <div className="card-right">
                <div className="quick-stats">
                  <div className="quick-stat">
                    <span className="stat-icon-small">🚚</span>
                    <span className="stat-text">{pycker.specialty}</span>
                  </div>
                  <div className="quick-stat">
                    <span className="stat-icon-small">📍</span>
                    <span className="stat-text">{pycker.distance} mi</span>
                  </div>
                  <div className="quick-stat">
                    <span className="stat-icon-small">💰</span>
                    <span className="stat-text">${pycker.hourlyRate}/hr</span>
                  </div>
                </div>

                {pycker.badges && pycker.badges.length > 0 && (
                  <div className="mini-badges">
                    {pycker.badges.slice(0, 2).map((badge, i) => (
                      <span key={i} className="mini-badge">{badge}</span>
                    ))}
                    {pycker.badges.length > 2 && (
                      <span className="mini-badge">+{pycker.badges.length - 2}</span>
                    )}
                  </div>
                )}

                <div className="availability-indicator">
                  <span className={pycker.available ? 'available' : 'soon'}>
                    {pycker.available ? '🟢 Available Now' : '🟡 Tomorrow'}
                  </span>
                </div>
              </div>
            </div>

            <button 
              className={`select-btn ${selectedPycker?.id === pycker.id ? 'selected' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                handleSelectPycker(pycker);
              }}
            >
              {selectedPycker?.id === pycker.id ? '✓ Selected' : 'Select'}
            </button>
          </div>
        ))}
      </div>

      <div className="review-actions">
        {selectedPycker ? (
          <>
            <div className="selected-info">
              <img 
                src={selectedPycker.photo || '/default-avatar.png'} 
                alt={selectedPycker.name}
              />
              <div>
                <strong>You selected {selectedPycker.name}</strong>
                <span>⭐ {selectedPycker.rating.toFixed(1)} • ${selectedPycker.hourlyRate}/hr</span>
              </div>
            </div>
            <button className="confirm-selection-btn" onClick={handleConfirm}>
              Book {selectedPycker.name}
            </button>
          </>
        ) : (
          <p className="selection-prompt">Select a pycker from your shortlist to continue</p>
        )}
      </div>
    </div>
  );
};

export default ShortlistReview;
