import React, { useState } from 'react';
import MatchingFlow from './MatchingFlow';
import './App.css';

// Sample pycker data - replace with your actual API data
const samplePyckers = [
  {
    id: '1',
    name: 'Marcus Thompson',
    photo: 'https://i.pravatar.cc/300?img=12',
    rating: 4.9,
    completedJobs: 127,
    specialty: 'Junk Removal',
    distance: 2.3,
    hourlyRate: 75,
    available: true,
    verified: true,
    badges: ['Top Rated', 'Fast Response'],
    bio: 'Professional junk removal specialist with over 5 years of experience. Known for efficiency and careful handling.'
  },
  {
    id: '2',
    name: 'Sarah Martinez',
    photo: 'https://i.pravatar.cc/300?img=47',
    rating: 4.8,
    completedJobs: 98,
    specialty: 'Moving Services',
    distance: 3.1,
    hourlyRate: 80,
    available: true,
    verified: true,
    badges: ['Reliable', 'Heavy Lifting'],
    bio: 'Experienced mover specializing in residential moves. Strong, reliable, and always on time.'
  },
  {
    id: '3',
    name: 'David Chen',
    photo: 'https://i.pravatar.cc/300?img=33',
    rating: 4.7,
    completedJobs: 156,
    specialty: 'Estate Cleanout',
    distance: 4.5,
    hourlyRate: 70,
    available: false,
    verified: true,
    badges: ['Estate Sales', 'Donation Coordination'],
    bio: 'Compassionate estate cleanout specialist who handles sensitive situations with care and professionalism.'
  },
  {
    id: '4',
    name: 'Jennifer Williams',
    photo: 'https://i.pravatar.cc/300?img=45',
    rating: 4.9,
    completedJobs: 203,
    specialty: 'Commercial Hauling',
    distance: 5.2,
    hourlyRate: 85,
    available: true,
    verified: true,
    badges: ['Commercial Expert', 'Large Jobs'],
    bio: 'Commercial junk removal expert handling office cleanouts, construction debris, and large-scale projects.'
  },
  {
    id: '5',
    name: 'Robert Jackson',
    photo: 'https://i.pravatar.cc/300?img=15',
    rating: 4.6,
    completedJobs: 82,
    specialty: 'Garage Cleanout',
    distance: 3.8,
    hourlyRate: 65,
    available: true,
    verified: false,
    badges: ['Organization'],
    bio: 'Detail-oriented professional specializing in garage and storage space organization.'
  },
  {
    id: '6',
    name: 'Lisa Anderson',
    photo: 'https://i.pravatar.cc/300?img=48',
    rating: 4.8,
    completedJobs: 145,
    specialty: 'Furniture Removal',
    distance: 2.9,
    hourlyRate: 75,
    available: false,
    verified: true,
    badges: ['Furniture Expert', 'Eco-Friendly'],
    bio: 'Furniture removal specialist committed to eco-friendly disposal and donation coordination.'
  },
  {
    id: '7',
    name: 'Michael Rodriguez',
    photo: 'https://i.pravatar.cc/300?img=68',
    rating: 4.7,
    completedJobs: 91,
    specialty: 'Yard Waste',
    distance: 6.1,
    hourlyRate: 60,
    available: true,
    verified: true,
    badges: ['Landscaping'],
    bio: 'Yard waste removal and light landscaping services. Great for post-storm cleanup.'
  },
  {
    id: '8',
    name: 'Amanda Lee',
    photo: 'https://i.pravatar.cc/300?img=44',
    rating: 5.0,
    completedJobs: 67,
    specialty: 'Appliance Removal',
    distance: 4.2,
    hourlyRate: 80,
    available: true,
    verified: true,
    badges: ['5-Star', 'Appliances'],
    bio: 'Perfect 5-star rating! Specializing in safe appliance removal and proper recycling.'
  }
];

const sampleJobDetails = {
  serviceType: 'Junk Removal',
  location: 'Lake Nona, Orlando, FL',
  date: 'Jan 26, 2025',
  time: '10:00 AM'
};

function App() {
  const [selectedPycker, setSelectedPycker] = useState(null);
  const [bookingComplete, setBookingComplete] = useState(false);

  const handlePyckerSelected = (pycker) => {
    setSelectedPycker(pycker);
    setBookingComplete(true);
    console.log('Selected pycker:', pycker);
    // Here you would typically:
    // 1. Send booking request to your backend
    // 2. Navigate to confirmation page
    // 3. Send notifications, etc.
  };

  const handleCancel = () => {
    console.log('User cancelled matching flow');
    // Navigate back or close modal
  };

  const handleStartNew = () => {
    setSelectedPycker(null);
    setBookingComplete(false);
  };

  if (bookingComplete) {
    return (
      <div className="app">
        <div className="booking-confirmation">
          <div className="success-icon">✓</div>
          <h2>Booking Confirmed!</h2>
          <p>You've successfully booked {selectedPycker.name}</p>
          
          <div className="booking-details">
            <img 
              src={selectedPycker.photo || '/default-avatar.png'} 
              alt={selectedPycker.name}
            />
            <div>
              <h3>{selectedPycker.name}</h3>
              <p>⭐ {selectedPycker.rating} • ${selectedPycker.hourlyRate}/hr</p>
              <p>{sampleJobDetails.date} at {sampleJobDetails.time}</p>
            </div>
          </div>

          <button className="btn-start-new" onClick={handleStartNew}>
            Book Another Job
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="app-header">
        <h1>uPYCK</h1>
        <p className="tagline">You Pick, We Haul</p>
      </div>

      <MatchingFlow
        availablePyckers={samplePyckers}
        jobDetails={sampleJobDetails}
        onPyckerSelected={handlePyckerSelected}
        onCancel={handleCancel}
      />
    </div>
  );
}

export default App;
