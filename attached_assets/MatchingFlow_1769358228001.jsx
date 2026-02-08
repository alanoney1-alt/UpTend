import React, { useState } from 'react';
import PyckerSwiper from './PyckerSwiper';
import QuickMatch from './QuickMatch';
import ShortlistReview from './ShortlistReview';
import './MatchingFlow.css';

const MatchingFlow = ({ 
  availablePyckers, 
  jobDetails, 
  onPyckerSelected,
  onCancel 
}) => {
  const [view, setView] = useState('selection'); // 'selection', 'browse', 'quickMatch', 'review'
  const [shortlist, setShortlist] = useState([]);

  // Get top 3 recommended pyckers based on criteria
  const getRecommendedPyckers = () => {
    return availablePyckers
      .sort((a, b) => {
        // Sort by: availability > rating > proximity
        if (a.available !== b.available) return a.available ? -1 : 1;
        if (Math.abs(a.rating - b.rating) > 0.3) return b.rating - a.rating;
        return a.distance - b.distance;
      })
      .slice(0, 3);
  };

  const handleBrowseClick = () => {
    setView('browse');
  };

  const handleQuickMatchClick = () => {
    setView('quickMatch');
  };

  const handleSwipeComplete = (shortlistedPyckers) => {
    setShortlist(shortlistedPyckers);
    setView('review');
  };

  const handleSkipToBrowse = () => {
    setView('quickMatch');
  };

  const handleSelectPycker = (pycker) => {
    onPyckerSelected(pycker);
  };

  const handleBack = () => {
    if (view === 'review') {
      setView('browse');
    } else {
      setView('selection');
    }
  };

  if (view === 'browse') {
    return (
      <PyckerSwiper
        availablePyckers={availablePyckers}
        onComplete={handleSwipeComplete}
        onSkip={handleSkipToBrowse}
      />
    );
  }

  if (view === 'quickMatch') {
    return (
      <QuickMatch
        recommendedPyckers={getRecommendedPyckers()}
        onSelectPycker={handleSelectPycker}
        onBrowseAll={handleBrowseClick}
        onBack={handleBack}
      />
    );
  }

  if (view === 'review') {
    return (
      <ShortlistReview
        shortlist={shortlist}
        onSelectPycker={handleSelectPycker}
        onBack={handleBack}
      />
    );
  }

  // Initial selection view
  return (
    <div className="matching-flow-container">
      <div className="matching-header">
        <h2>Find Your Perfect Pycker</h2>
        <p>We found {availablePyckers.length} available pyckers for your job</p>
      </div>

      <div className="job-summary">
        <h3>Job Details</h3>
        <div className="job-info">
          <div className="info-item">
            <span className="info-icon">📦</span>
            <span>{jobDetails.serviceType}</span>
          </div>
          <div className="info-item">
            <span className="info-icon">📍</span>
            <span>{jobDetails.location}</span>
          </div>
          <div className="info-item">
            <span className="info-icon">📅</span>
            <span>{jobDetails.date} at {jobDetails.time}</span>
          </div>
        </div>
      </div>

      <div className="selection-options">
        <div className="option-card quick-match-card" onClick={handleQuickMatchClick}>
          <div className="option-icon">⚡</div>
          <h3>Quick Match</h3>
          <p>Get matched with our top 3 recommended pyckers instantly</p>
          <div className="option-features">
            <span className="feature">✓ AI-powered matching</span>
            <span className="feature">✓ Fastest booking</span>
            <span className="feature">✓ Based on availability & ratings</span>
          </div>
          <button className="option-btn primary-btn">
            Get Quick Match
          </button>
        </div>

        <div className="divider">
          <span>or</span>
        </div>

        <div className="option-card browse-card" onClick={handleBrowseClick}>
          <div className="option-icon">👥</div>
          <h3>Browse All Pyckers</h3>
          <p>Swipe through all available pyckers and build your shortlist</p>
          <div className="option-features">
            <span className="feature">✓ See all profiles</span>
            <span className="feature">✓ Swipe to shortlist</span>
            <span className="feature">✓ Full control over selection</span>
          </div>
          <button className="option-btn secondary-btn">
            Start Browsing
          </button>
        </div>
      </div>

      <div className="preview-section">
        <h4>Top Rated Pyckers Available</h4>
        <div className="pycker-preview-grid">
          {getRecommendedPyckers().map((pycker) => (
            <div key={pycker.id} className="pycker-preview">
              <img src={pycker.photo || '/default-avatar.png'} alt={pycker.name} />
              <div className="preview-info">
                <strong>{pycker.name}</strong>
                <span>⭐ {pycker.rating.toFixed(1)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {onCancel && (
        <button className="cancel-btn" onClick={onCancel}>
          Cancel
        </button>
      )}
    </div>
  );
};

export default MatchingFlow;
