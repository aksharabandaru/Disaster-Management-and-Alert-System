import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DisasterDashboard.css';

const CitizenDashboard = ({ user, onLogout }) => {
  const [alerts, setAlerts] = useState([]);
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [gdacsData, setGdacsData] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    criticalAlerts: 0,
    nearbyAlerts: 0,
    todayAlerts: 0
  });
  const [filters, setFilters] = useState({
    type: '',
    severity: '',
    country: ''
  });

  const [showDebug, setShowDebug] = useState(false);
  const [manualLocation, setManualLocation] = useState('');
  const [showEmergencyReport, setShowEmergencyReport] = useState(false);
  const [emergencyRequest, setEmergencyRequest] = useState({
    type: '',
    description: '',
    location: user.location || localStorage.getItem('userLocation') || '',
    urgency: 'medium',
    contact: ''
  });
  const [myEmergencyRequests, setMyEmergencyRequests] = useState([]);

  const fetchMyEmergencyRequests = async () => {
    try {
      // Get emergency requests from localStorage
      const storedRequests = localStorage.getItem('emergencyRequests');
      if (storedRequests) {
        const allRequests = JSON.parse(storedRequests);
        // Filter only this citizen's requests
        const myRequests = allRequests.filter(req => req.citizenId === user.id);
        console.log('📞 My emergency requests loaded:', myRequests);
        setMyEmergencyRequests(myRequests);
      }
      
      // Try to fetch from backend (will fail until backend is implemented)
      try {
        const response = await axios.get('/api/emergency/my-requests', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.data.success) {
          console.log('📞 My emergency requests loaded from backend:', response.data.requests);
          setMyEmergencyRequests(response.data.requests);
          // Store in localStorage as backup
          localStorage.setItem('emergencyRequests', JSON.stringify(response.data.requests));
        }
      } catch (backendErr) {
        console.log('📞 Backend not available yet, using localStorage');
      }
    } catch (err) {
      console.error('Error fetching my emergency requests:', err);
    }
  };

  // Fetch GDACS data directly from API
  const fetchGdacsData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // First check if we have modified alerts in localStorage
      const storedModifiedAlerts = localStorage.getItem('modifiedAlerts');
      console.log('🔍 Checking localStorage for modifiedAlerts:', storedModifiedAlerts);
      
      if (storedModifiedAlerts) {
        const modifiedAlerts = JSON.parse(storedModifiedAlerts);
        console.log('📊 Using modified alerts from localStorage:', modifiedAlerts);
        console.log('📊 Broadcasted alerts in modified data:', modifiedAlerts.filter(a => a.broadcasted));
        
        // Apply location filtering to modified alerts
        const filteredByLocation = filterAlertsByLocation(modifiedAlerts);
        
        setGdacsData(modifiedAlerts);
        setFilteredAlerts(filteredByLocation);
        setLoading(false);
        updateStats(filteredByLocation);
        return;
      }
      
      // Fetch directly from GDACS API
      console.log('🌐 Fetching fresh GDACS data...');
      const response = await fetch('https://www.gdacs.org/gdacsapi/api/Events/geteventlist/EVENTS4APP');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const features = data.features || [];
      console.log('📊 Fresh GDACS data loaded:', features);
      
      // Apply location filtering to fresh data
      const filteredByLocation = filterAlertsByLocation(features);
      
      setGdacsData(features);
      setFilteredAlerts(filteredByLocation);
      setLoading(false);
      updateStats(filteredByLocation);
      
    } catch (err) {
      console.error('Error fetching GDACS data:', err);
      setError('Failed to load GDACS data: ' + err.message);
      setLoading(false);
      
      // Load sample data as fallback
      loadSampleData();
    }
  };

  const filterAlertsByLocation = (alerts) => {
    // Get user location from multiple sources with priority
    let userLocation = manualLocation || // Manual location first
                     user.location || // Then user object
                     localStorage.getItem('userLocation') || // Then localStorage
                     'India'; // Default fallback
    
    // Update localStorage if we have a better location
    if (userLocation && userLocation !== 'India') {
      localStorage.setItem('userLocation', userLocation);
    }
    
    const filtered = alerts.filter(alert => {
      const props = alert.properties;
      
      // ONLY show broadcasted alerts that match user's location
      if (alert.broadcasted) {
        const alertLocation = props.country.toLowerCase();
        const alertName = props.name.toLowerCase();
        const userLoc = userLocation.toLowerCase();
        
        // Flexible location matching
        const matches = (
          alertLocation.includes(userLoc) ||                    // Country contains user location
          alertName.includes(userLoc) ||                     // Alert name contains user location
          userLoc.includes(alertLocation) ||                   // User location contains country
          containsSimilarWords(alertLocation, userLoc) ||      // Similar words matching
          containsSimilarWords(alertName, userLoc)            // Similar words in alert name
        );
        
        // Debug logging
        console.log('🔍 Location Matching Debug:', {
          alertName: props.name,
          alertLocation: props.country,
          userLocation: userLoc,
          matches: matches,
          broadcasted: alert.broadcasted,
          manualLocation: manualLocation,
          userObjectLocation: user.location
        });
        
        return matches;
      }
      
      // Hide all non-broadcasted alerts from citizens
      return false;
    });
    
    // Debug summary
    console.log('📊 Filtering Summary:', {
      totalAlerts: alerts.length,
      broadcastedAlerts: alerts.filter(a => a.broadcasted).length,
      filteredAlerts: filtered.length,
      userLocation: userLocation,
      manualLocation: manualLocation,
      userObjectLocation: user.location
    });
    
    return filtered;
  };

  // Helper function for flexible word matching
  const containsSimilarWords = (text1, text2) => {
    const words1 = text1.split(/\s+/);
    const words2 = text2.split(/\s+/);
    
    // Check if any word from text2 is in text1
    return words2.some(word2 => 
      words1.some(word1 => 
        word1.includes(word2) || word2.includes(word1) || 
        word1.length > 3 && word2.length > 3 && 
        (word1.substring(0, 3) === word2.substring(0, 3))
      )
    );
  };

  const loadSampleData = () => {
    const sampleData = [
      {
        type: "Feature",
        properties: {
          eventtype: "EQ",
          eventid: 1529182,
          name: "Earthquake in Off Coast Of Southern Chile",
          description: "Earthquake in Off Coast Of Southern Chile",
          htmldescription: "Green M 4.6 Earthquake in Off Coast Of Southern Chile at: 15 Mar 2026 12:54:07.",
          alertlevel: "Green",
          country: "Off Coast Of Southern Chile",
          fromdate: "2026-03-15T12:54:07",
          severitydata: {
            severity: 4.6,
            severitytext: "Magnitude 4.6M, Depth:10km",
            severityunit: "M"
          }
        },
        geometry: {
          type: "Point",
          coordinates: [-77.3565, -45.6923]
        }
      },
      {
        type: "Feature",
        properties: {
          eventtype: "WF",
          eventid: 1027816,
          name: "Forest fires in India",
          description: "Forest fires in India",
          htmldescription: "Green Forest fires in India from: 10 Mar 2026 to: 15 Mar 2026.",
          alertlevel: "Green",
          country: "India",
          fromdate: "2026-03-10T00:00:00",
          severitydata: {
            severity: 6992.0,
            severitytext: "Green impact for forestfire in 6992 ha",
            severityunit: "ha"
          }
        },
        geometry: {
          type: "Point",
          coordinates: [92.61058021336291, 22.499427642525163]
        }
      }
    ];
    
    // Apply location filtering to sample data as well
    const filteredByLocation = filterAlertsByLocation(sampleData);
    
    setGdacsData(filteredByLocation);
    setFilteredAlerts(filteredByLocation);
    setLoading(false);
    updateStats(filteredByLocation);
  };

  const updateStats = (data) => {
    const total = data.length;
    const criticalAlerts = data.filter(a => a.properties.alertlevel === 'Red').length;
    const nearbyAlerts = data.filter(a => a.properties.country.includes('India')).length; // Example nearby filter
    const todayAlerts = data.filter(a => {
      const alertDate = new Date(a.properties.fromdate);
      const today = new Date();
      return alertDate.toDateString() === today.toDateString();
    }).length;
    
    setStats({
      total,
      criticalAlerts,
      nearbyAlerts,
      todayAlerts
    });
  };

  const getAlertTypeClass = (eventType) => {
    const types = {
      'EQ': 'alert-earthquake',
      'WF': 'alert-fire',
      'FL': 'alert-flood',
      'DR': 'alert-drought',
      'TC': 'alert-cyclone'
    };
    return types[eventType] || 'alert-default';
  };

  const getEventType = (eventType) => {
    const types = {
      'EQ': 'Earthquake',
      'WF': 'Forest Fire',
      'FL': 'Flood',
      'DR': 'Drought',
      'TC': 'Tropical Cyclone'
    };
    return types[eventType] || eventType;
  };

  const getSeverityClass = (severity) => {
    return `severity-${severity.toLowerCase()}`;
  };

  useEffect(() => {
    fetchGdacsData();
    fetchMyEmergencyRequests();
    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      fetchGdacsData();
      fetchMyEmergencyRequests();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const applyFilters = () => {
    if (!gdacsData) return;
    
    const { type, severity, country } = filters;
    
    const filtered = gdacsData.filter(alert => {
      const props = alert.properties;
      
      if (type && props.eventtype !== type) return false;
      if (severity && props.alertlevel !== severity) return false;
      if (country && !props.country.toLowerCase().includes(country.toLowerCase())) return false;
      
      return true;
    });
    
    setFilteredAlerts(filtered);
    updateStats(filtered);
  };

  const resetFilters = () => {
    setFilters({ type: '', severity: '', country: '' });
    // Re-apply location filtering to get back to base state
    if (gdacsData) {
      const filteredByLocation = filterAlertsByLocation(gdacsData);
      setFilteredAlerts(filteredByLocation);
      updateStats(filteredByLocation);
    }
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const handleGetDetails = async (alertId) => {
    try {
      const response = await axios.get(`/api/alerts/${alertId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        // Show detailed information in a modal or expand section
        alert(`Alert Details: ${response.data.data.description}`);
      }
    } catch (err) {
      setError('Failed to get alert details');
    }
  };

  const handleReportConcern = async (alertId) => {
    try {
      const response = await axios.post(`/api/alerts/${alertId}/concern`, {
        citizenId: user.id,
        concern: 'Additional information from citizen',
        timestamp: new Date().toISOString()
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        setError('Concern reported successfully');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      setError('Failed to report concern');
    }
  };

  const handleEmergencyReport = async () => {
    try {
      console.log('🚨 Submitting emergency request:', emergencyRequest);
      
      // Simulate successful submission for now (since backend doesn't exist yet)
      const mockResponse = {
        data: {
          success: true,
          message: 'Emergency request submitted successfully',
          requestId: 'REQ_' + Date.now()
        }
      };
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('📞 Emergency request response:', mockResponse.data);
      
      if (mockResponse.data.success) {
        setError('✅ Emergency request submitted successfully! Request ID: ' + mockResponse.data.requestId + '. Help is on the way.');
        setTimeout(() => setError(''), 5000);
        setShowEmergencyReport(false);
        setEmergencyRequest({
          type: '',
          description: '',
          location: user.location || localStorage.getItem('userLocation') || '',
          urgency: 'medium',
          contact: ''
        });
        
        // Store in localStorage for responder dashboard to see
        const emergencyData = {
          id: mockResponse.data.requestId,
          citizenId: user.id,
          citizenName: user.name,
          type: emergencyRequest.type,
          description: emergencyRequest.description,
          location: emergencyRequest.location,
          urgency: emergencyRequest.urgency,
          contact: emergencyRequest.contact,
          timestamp: new Date().toISOString(),
          acknowledged: false
        };
        
        // Get existing emergency requests or create new array
        const existingRequests = JSON.parse(localStorage.getItem('emergencyRequests') || '[]');
        existingRequests.push(emergencyData);
        localStorage.setItem('emergencyRequests', JSON.stringify(existingRequests));
        
        console.log('📞 Emergency request stored in localStorage:', emergencyData);
      }
    } catch (err) {
      console.error('🚨 Emergency request error:', err);
      let errorMessage = 'Failed to submit emergency request. Please try again.';
      
      if (err.response) {
        console.error('🚨 Server response:', err.response.data);
        errorMessage = err.response.data?.message || errorMessage;
      } else if (err.request) {
        console.error('🚨 No response from server');
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      setError('❌ ' + errorMessage);
      setTimeout(() => setError(''), 5000);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <p>Loading GDACS data...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="citizen-header">
        <h1>👥 Citizen Dashboard</h1>
        <div className="user-info">
          <div className="user-details">
            <span>Welcome, {user.name} (Citizen)</span>
            <span className="user-location">📍 {user.location || localStorage.getItem('userLocation') || 'India'}</span>
          </div>
          <div className="header-actions">
            <button 
              onClick={() => setShowEmergencyReport(true)} 
              className="emergency-btn"
            >
              🚨 Report Emergency
            </button>
            <button onClick={onLogout} className="logout-btn">Logout</button>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="error">
          {error}
        </div>
      )}
      
      {/* Debug Panel */}
      {showDebug && (
        <div className="debug-panel">
          <h3>🔍 Debug Information</h3>
          <div className="debug-info">
            <p><strong>User Location:</strong> {user.location || localStorage.getItem('userLocation') || 'India'}</p>
            <p><strong>Manual Location:</strong> {manualLocation || 'Not set'}</p>
            <p><strong>Effective Location:</strong> {manualLocation || user.location || localStorage.getItem('userLocation') || 'India'}</p>
            <p><strong>Total GDACS Alerts:</strong> {gdacsData?.length || 0}</p>
            <p><strong>Broadcasted Alerts:</strong> {gdacsData?.filter(a => a.broadcasted).length || 0}</p>
            <p><strong>Filtered Alerts:</strong> {filteredAlerts.length}</p>
            <p><strong>Open browser console (F12) to see detailed matching logs</strong></p>
            
            <div className="location-setter">
              <h4>📍 Test Different Locations:</h4>
              <div className="location-buttons">
                <button onClick={() => setManualLocation('Mumbai')} className="location-btn">Mumbai</button>
                <button onClick={() => setManualLocation('Delhi')} className="location-btn">Delhi</button>
                <button onClick={() => setManualLocation('Bangalore')} className="location-btn">Bangalore</button>
                <button onClick={() => setManualLocation('Russia')} className="location-btn">Russia</button>
                <button onClick={() => setManualLocation('USA')} className="location-btn">USA</button>
                <button onClick={() => setManualLocation('')} className="location-btn clear-btn">Clear</button>
              </div>
              <div className="manual-input">
                <input
                  type="text"
                  placeholder="Enter custom location..."
                  value={manualLocation}
                  onChange={(e) => setManualLocation(e.target.value)}
                  className="location-input"
                />
                <button onClick={() => {
                  if (manualLocation) {
                    localStorage.setItem('userLocation', manualLocation);
                    setError(`Location set to: ${manualLocation}. Refreshing data...`);
                    setTimeout(() => {
                      setError('');
                      fetchGdacsData();
                    }, 1000);
                  }
                }} className="set-location-btn">
                  Set Location
                </button>
              </div>
              
              <div className="cache-controls">
                <h4>🗑️ Cache Controls:</h4>
                <div className="cache-buttons">
                  <button onClick={() => {
                    const modifiedAlerts = localStorage.getItem('modifiedAlerts');
                    console.log('🔍 Current modifiedAlerts in localStorage:', modifiedAlerts);
                    if (modifiedAlerts) {
                      const parsed = JSON.parse(modifiedAlerts);
                      console.log('📊 Parsed modified alerts:', parsed);
                      console.log('📊 Broadcasted alerts:', parsed.filter(a => a.broadcasted));
                      console.log('📊 Broadcasted alert details:', parsed.filter(a => a.broadcasted).map(a => ({
                        name: a.properties.name,
                        country: a.properties.country,
                        broadcasted: a.broadcasted,
                        broadcastedBy: a.broadcastedBy
                      })));
                    }
                  }} className="cache-btn inspect-btn">
                    Inspect Cache
                  </button>
                  <button onClick={() => {
                    localStorage.removeItem('modifiedAlerts');
                    setError('Cache cleared. Refreshing data...');
                    setTimeout(() => {
                      setError('');
                      fetchGdacsData();
                    }, 1000);
                  }} className="cache-btn clear-cache-btn">
                    Clear Cache & Refresh
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Citizen Statistics */}
      <div className="stats">
        <div className="stat-card citizen-stats">
          <h3>{stats.total}</h3>
          <p>Total Alerts</p>
        </div>
        <div className="stat-card citizen-stats critical">
          <h3>{stats.criticalAlerts}</h3>
          <p>Critical Alerts</p>
        </div>
        <div className="stat-card citizen-stats nearby">
          <h3>{stats.nearbyAlerts}</h3>
          <p>Nearby Alerts</p>
        </div>
        <div className="stat-card citizen-stats today">
          <h3>{stats.todayAlerts}</h3>
          <p>Today's Alerts</p>
        </div>
      </div>
      
      {/* Safety Tips */}
      <div className="safety-tips">
        <h2>🛡️ Safety Information</h2>
        <div className="tips-grid">
          <div className="tip-card">
            <h3>🚨 Stay Informed</h3>
            <p>Monitor official sources and follow evacuation orders immediately.</p>
          </div>
          <div className="tip-card">
            <h3>📱 Emergency Contacts</h3>
            <p>Keep emergency numbers handy and charged devices ready.</p>
          </div>
          <div className="tip-card">
            <h3>🎒 Emergency Kit</h3>
            <p>Prepare supplies for at least 72 hours including water, food, and medications.</p>
          </div>
          <div className="tip-card">
            <h3>🏠 Safe Location</h3>
            <p>Identify safe meeting points and evacuation routes in advance.</p>
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <div className="filters">
        <div className="filter-group">
          <label htmlFor="typeFilter">Type:</label>
          <select 
            id="typeFilter"
            value={filters.type} 
            onChange={(e) => handleFilterChange('type', e.target.value)}
          >
            <option value="">All Types</option>
            <option value="EQ">Earthquake</option>
            <option value="WF">Forest Fire</option>
            <option value="FL">Flood</option>
            <option value="DR">Drought</option>
            <option value="TC">Tropical Cyclone</option>
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="severityFilter">Severity:</label>
          <select 
            id="severityFilter"
            value={filters.severity} 
            onChange={(e) => handleFilterChange('severity', e.target.value)}
          >
            <option value="">All Severities</option>
            <option value="Red">Red (Critical)</option>
            <option value="Orange">Orange (High)</option>
            <option value="Green">Green (Low)</option>
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="countryFilter">Country:</label>
          <input 
            type="text" 
            id="countryFilter"
            placeholder="Filter by country"
            value={filters.country}
            onChange={(e) => handleFilterChange('country', e.target.value)}
          />
        </div>
        <button onClick={applyFilters}>Apply Filters</button>
        <button onClick={resetFilters}>Reset</button>
      </div>
      
      {/* Main Content - Two Column Layout */}
      <div className="citizen-main-content">
        {/* My Emergency Requests Section */}
        <div className="citizen-section emergency-section">
          <h2 className="section-title emergency">📞 My Emergency Requests</h2>
          {myEmergencyRequests.length > 0 ? (
            myEmergencyRequests.map((request, index) => (
              <div key={index} className={`alert my-emergency-request ${request.acknowledged ? 'acknowledged' : ''}`}>
                <div className="alert-header">
                  <h3>🚨 {request.type} Emergency</h3>
                  <div className="alert-status">
                    <span className={`status-badge ${request.urgency}-badge`}>
                      {request.urgency === 'critical' && '🚨 Critical'}
                      {request.urgency === 'high' && '🔴 High'}
                      {request.urgency === 'medium' && '🟡 Medium'}
                      {request.urgency === 'low' && '🟢 Low'}
                    </span>
                    {request.acknowledged && (
                      <span className="status-badge acknowledged-badge">
                        {request.acknowledgedBy ? `✓ Acknowledged by ${request.acknowledgedBy}` : '✓ Acknowledged'}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="alert-content">
                  <p><strong>Description:</strong> {request.description}</p>
                  <p><strong>Location:</strong> {request.location}</p>
                  <p><strong>Urgency:</strong> 
                    <span className={request.urgency}>
                      {request.urgency === 'critical' && '🚨 Critical'}
                      {request.urgency === 'high' && '🔴 High'}
                      {request.urgency === 'medium' && '🟡 Medium'}
                      {request.urgency === 'low' && '🟢 Low'}
                    </span>
                  </p>
                  <p><strong>Contact:</strong> {request.contact}</p>
                  <p><strong>Submitted:</strong> {new Date(request.timestamp).toLocaleString()}</p>
                  
                  {request.acknowledged && (
                    <div className="acknowledgment-details">
                      <p><strong>🚑 Acknowledged by:</strong> {request.acknowledgedBy}</p>
                      <p><strong>⏰ Response Time:</strong> {new Date(request.acknowledgedAt).toLocaleString()}</p>
                      <p><strong>⚡ Response Duration:</strong> {
                        Math.round((new Date(request.acknowledgedAt) - new Date(request.timestamp)) / 1000 / 60) + ' minutes'
                      }</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="no-emergency-requests">
              <h3>📞 No Emergency Requests</h3>
              <p>You haven't submitted any emergency requests.</p>
              <p>Click the "🚨 Report Emergency" button above to submit one.</p>
            </div>
          )}
        </div>
        
        {/* Broadcasted Alerts Section */}
        <div className="citizen-section alerts-section">
          <h2 className="section-title broadcasts">📡 Official Broadcasts</h2>
          {filteredAlerts.length === 0 ? (
            <div className="no-broadcasts">
              <h3>📢 No Official Broadcasts</h3>
              <p>There are currently no official disaster broadcasts for your location.</p>
              <p>Officials will broadcast alerts here when there are verified disasters in your area.</p>
              <div className="safety-reminder">
                <h4>🛡️ Stay Prepared</h4>
                <ul>
                  <li>Keep emergency contacts handy</li>
                  <li>Monitor official channels for updates</li>
                  <li>Have an emergency kit ready</li>
                  <li>Know your evacuation routes</li>
                </ul>
              </div>
            </div>
          ) : (
            filteredAlerts.map((alert, index) => {
              const props = alert.properties;
              const coords = alert.geometry.coordinates;
              
              return (
                <div key={index} className={`alert ${getAlertTypeClass(props.eventtype)} broadcasted-alert`}>
                  <div className="alert-header">
                    <h3>📢 {props.name}</h3>
                    <div className="alert-status">
                      <span className="status-badge broadcasted-badge">Official Broadcast</span>
                    </div>
                  </div>
                  
                  <div className="alert-content">
                    <p><strong>Type:</strong> {getEventType(props.eventtype)}</p>
                    <p><strong>Severity:</strong> <span className={getSeverityClass(props.alertlevel)}>{props.alertlevel}</span></p>
                    <p><strong>Location:</strong> {props.country}</p>
                    <p><strong>Date:</strong> {new Date(props.fromdate).toLocaleDateString()}</p>
                    <p><strong>Description:</strong> {props.htmldescription}</p>
                    <p><strong>Coordinates:</strong> {coords[1].toFixed(4)}, {coords[0].toFixed(4)}</p>
                    <p><strong>Event ID:</strong> {props.eventid}</p>
                    
                    {alert.broadcastedBy && (
                      <p><strong>Broadcasted by:</strong> {alert.broadcastedBy} at {new Date(alert.broadcastedAt).toLocaleString()}</p>
                    )}
                  </div>
                  
                  <div className="citizen-actions">
                    <button onClick={() => handleGetDetails(props.eventid)} className="details-btn">Get Details</button>
                    <button onClick={() => handleReportConcern(props.eventid)} className="report-btn">Report Concern</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    
      
      {/* Emergency Report Modal */}
      {showEmergencyReport && (
        <div className="modal-overlay">
          <div className="modal emergency-modal">
            <div className="modal-header">
              <h3>🚨 Report Emergency</h3>
              <button
                onClick={() => setShowEmergencyReport(false)}
                className="close-btn"
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Emergency Type</label>
                <select
                  value={emergencyRequest.type}
                  onChange={(e) => setEmergencyRequest({...emergencyRequest, type: e.target.value})}
                  className="form-select"
                >
                  <option value="">Select emergency type</option>
                  <option value="fire">🔥 Fire</option>
                  <option value="flood">🌊 Flood</option>
                  <option value="earthquake">🏚️ Earthquake</option>
                  <option value="medical">🚑 Medical Emergency</option>
                  <option value="accident">🚗 Accident</option>
                  <option value="other">⚠️ Other</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea
                  placeholder="Describe the emergency situation..."
                  value={emergencyRequest.description}
                  onChange={(e) => setEmergencyRequest({...emergencyRequest, description: e.target.value})}
                  className="form-textarea"
                  rows="4"
                />
              </div>
              
              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  placeholder="Enter your location or address..."
                  value={emergencyRequest.location}
                  onChange={(e) => setEmergencyRequest({...emergencyRequest, location: e.target.value})}
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label>Urgency Level</label>
                <select
                  value={emergencyRequest.urgency}
                  onChange={(e) => setEmergencyRequest({...emergencyRequest, urgency: e.target.value})}
                  className="form-select"
                >
                  <option value="low">🟢 Low</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="high">🔴 High</option>
                  <option value="critical">🚨 Critical</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Contact Phone</label>
                <input
                  type="tel"
                  placeholder="Your phone number for responders..."
                  value={emergencyRequest.contact}
                  onChange={(e) => setEmergencyRequest({...emergencyRequest, contact: e.target.value})}
                  className="form-input"
                />
              </div>
            </div>
            
            <div className="modal-actions">
              <button
                onClick={handleEmergencyReport}
                className="submit-emergency-btn"
                disabled={!emergencyRequest.type || !emergencyRequest.description || !emergencyRequest.location}
              >
                🚨 Send Emergency Request
              </button>
              <button
                onClick={() => setShowEmergencyReport(false)}
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CitizenDashboard;
