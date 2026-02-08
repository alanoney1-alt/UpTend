import React, { useState, useMemo } from 'react';
import TinderCard from 'react-tinder-card';
import './PyckerSwiper.css';

const PyckerSwiper = ({ availablePyckers, onComplete, onSkip }) => {
  const [currentIndex, setCurrentIndex] = useState(availablePyckers.length - 1);
  const [shortlist, setShortlist] = useState([]);
  const [lastDirection, setLastDirection] = useState();

  const currentIndexRef = React.useRef(currentIndex);
  
  const childRefs = useMemo(
    () =>
      Array(availablePyckers.length)
        .fill(0)
        .map((i) => React.createRef()),
    [availablePyckers.length]
  );

  const updateCurrentIndex = (val) => {
    setCurrentIndex(val);
    currentIndexRef.current = val;
  };

  const canSwipe = currentIndex >= 0;

  const swiped = (direction, pycker, index) => {
    setLastDirection(direction);
    updateCurrentIndex(index - 1);
    
    if (direction === 'right') {
      setShortlist(prev => [...prev, pycker]);
    }
  };

  const outOfFrame = (name, idx) => {
    console.log(`${name} (${idx}) left the screen!`);
    if (currentIndexRef.current >= idx && childRefs[idx].current) {
      childRefs[idx].current.restoreCard();
    }
  };

  const swipe = async (dir) => {
    if (canSwipe && currentIndex < availablePyckers.length) {
      await childRefs[currentIndex].current.swipe(dir);
    }
  };

  const handleComplete = () => {
    if (shortlist.length > 0) {
      onComplete(shortlist);
    }
  };

  const handleSkipAll = () => {
    onSkip();
  };

  return (
    <div className="pycker-swiper-container">
      <div className="swiper-header">
        <h2>Browse Available Pyckers</h2>
        <p>Swipe right to shortlist • Swipe left to pass</p>
        <div className="shortlist-counter">
          {shortlist.length} pycker{shortlist.length !== 1 ? 's' : ''} shortlisted
        </div>
      </div>

      <div className="swipe-area">
        <div className="card-container">
          {availablePyckers.map((pycker, index) => (
            <TinderCard
              ref={childRefs[index]}
              className="swipe"
              key={pycker.id}
              onSwipe={(dir) => swiped(dir, pycker, index)}
              onCardLeftScreen={() => outOfFrame(pycker.name, index)}
              preventSwipe={['up', 'down']}
            >
              <div className="pycker-card">
                <div className="card-image-container">
                  <img 
                    src={pycker.photo || '/default-avatar.png'} 
                    alt={pycker.name}
                    className="pycker-photo"
                  />
                  <div className="verified-badge">
                    {pycker.verified && (
                      <span className="verified-icon">✓ Verified</span>
                    )}
                  </div>
                </div>
                
                <div className="card-content">
                  <div className="pycker-header">
                    <h3>{pycker.name}</h3>
                    <div className="rating">
                      <span className="stars">⭐ {pycker.rating.toFixed(1)}</span>
                      <span className="job-count">({pycker.completedJobs} jobs)</span>
                    </div>
                  </div>

                  <div className="pycker-stats">
                    <div className="stat-item">
                      <span className="stat-icon">🚚</span>
                      <span>{pycker.specialty || 'General Services'}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-icon">📍</span>
                      <span>{pycker.distance} miles away</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-icon">💰</span>
                      <span>${pycker.hourlyRate}/hr</span>
                    </div>
                  </div>

                  {pycker.badges && pycker.badges.length > 0 && (
                    <div className="badges">
                      {pycker.badges.map((badge, i) => (
                        <span key={i} className="badge">{badge}</span>
                      ))}
                    </div>
                  )}

                  {pycker.bio && (
                    <p className="bio">{pycker.bio}</p>
                  )}

                  <div className="availability">
                    <span className={`status ${pycker.available ? 'available' : 'busy'}`}>
                      {pycker.available ? '🟢 Available Today' : '🟡 Available Tomorrow'}
                    </span>
                  </div>
                </div>
              </div>
            </TinderCard>
          ))}
        </div>

        {!canSwipe && (
          <div className="end-of-cards">
            <h3>That's everyone!</h3>
            <p>
              {shortlist.length > 0 
                ? `Review your ${shortlist.length} shortlisted pycker${shortlist.length !== 1 ? 's' : ''} below`
                : 'No pyckers shortlisted. Try quick match instead?'
              }
            </p>
          </div>
        )}
      </div>

      <div className="swipe-buttons">
        <button 
          className="swipe-btn pass-btn"
          onClick={() => swipe('left')}
          disabled={!canSwipe}
        >
          <span className="btn-icon">✕</span>
          Pass
        </button>
        <button 
          className="swipe-btn like-btn"
          onClick={() => swipe('right')}
          disabled={!canSwipe}
        >
          <span className="btn-icon">♥</span>
          Shortlist
        </button>
      </div>

      <div className="action-buttons">
        {shortlist.length > 0 && (
          <button className="btn-primary" onClick={handleComplete}>
            Review Shortlist ({shortlist.length})
          </button>
        )}
        <button className="btn-secondary" onClick={handleSkipAll}>
          Skip to Quick Match
        </button>
      </div>

      {shortlist.length > 0 && (
        <div className="shortlist-preview">
          <h4>Your Shortlist</h4>
          <div className="shortlist-items">
            {shortlist.map((pycker) => (
              <div key={pycker.id} className="shortlist-item">
                <img src={pycker.photo || '/default-avatar.png'} alt={pycker.name} />
                <div className="shortlist-info">
                  <strong>{pycker.name}</strong>
                  <span>⭐ {pycker.rating.toFixed(1)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PyckerSwiper;
