import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DisasterDashboard.css';

const ResponderDashboard = ({ user, onLogout }) => {
  const [alerts, setAlerts] = useState([]);
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [gdacsData, setGdacsData] = useState(null);
  const [emergencyRequests, setEmergencyRequests] = useState([]);
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    highSeverity: 0,
    localAlerts: 0,
    recentAlerts: 0
  });
  const [filters, setFilters] = useState({
    type: '',
    severity: '',
    location: ''
  });

  const fetchAssignedTasks = async () => {
    try {
      // Get assigned tasks from localStorage
      const storedTasks = localStorage.getItem('assignedTasks');
      if (storedTasks) {
        const allTasks = JSON.parse(storedTasks);
        // Filter tasks assigned to this responder's location ONLY
        const userLocation = user.location || localStorage.getItem('userLocation') || '';
        const myTasks = allTasks.filter(task => {
          // Check if task location matches user location (case-insensitive and partial match)
          const taskLocation = (task.location || '').toLowerCase();
          const responderLocation = userLocation.toLowerCase();
          
          // Exact match or contains match
          return taskLocation.includes(responderLocation) || 
                 responderLocation.includes(taskLocation) ||
                 taskLocation === responderLocation;
        });
        
        console.log('📋 Location-based tasks loaded:', myTasks);
        console.log('� Responder location:', userLocation);
        console.log('🔍 Found tasks for location:', myTasks.map(t => t.location));
        
        setAssignedTasks(myTasks);
      }
      
      // Try to fetch from backend (will fail until backend is implemented)
      try {
        const response = await axios.get('/api/tasks/assigned', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.data.success) {
          console.log('📋 Assigned tasks loaded from backend:', response.data.tasks);
          setAssignedTasks(response.data.tasks);
          // Store in localStorage as backup
          localStorage.setItem('assignedTasks', JSON.stringify(response.data.tasks));
        }
      } catch (backendErr) {
        console.log('📋 Backend not available yet, using localStorage');
      }
    } catch (err) {
      console.error('Error fetching assigned tasks:', err);
    }
  };

  const fetchEmergencyRequests = async () => {
    try {
      // For now, read from localStorage since backend doesn't exist yet
      const storedRequests = localStorage.getItem('emergencyRequests');
      if (storedRequests) {
        const allRequests = JSON.parse(storedRequests);
        // Filter requests for this responder's location ONLY
        const userLocation = user.location || localStorage.getItem('userLocation') || '';
        const myRequests = allRequests.filter(request => {
          // Check if request location matches user location (case-insensitive and partial match)
          const requestLocation = (request.location || '').toLowerCase();
          const responderLocation = userLocation.toLowerCase();
          
          // Exact match or contains match
          return requestLocation.includes(responderLocation) || 
                 responderLocation.includes(requestLocation) ||
                 requestLocation === responderLocation;
        });
        
        console.log('📞 Location-based emergency requests loaded:', myRequests);
        console.log('📍 Responder location:', userLocation);
        console.log('🔍 Found requests for location:', myRequests.map(r => r.location));
        
        setEmergencyRequests(myRequests);
      }
      
      // Try to fetch from backend (will fail until backend is implemented)
      try {
        const response = await axios.get('/api/emergency/requests', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.data.success) {
          console.log('📞 Emergency requests loaded from backend:', response.data.requests);
          setEmergencyRequests(response.data.requests);
          // Store in localStorage as backup
          localStorage.setItem('emergencyRequests', JSON.stringify(response.data.requests));
        }
      } catch (backendErr) {
        console.log('📞 Backend not available yet, using localStorage');
      }
    } catch (err) {
      console.error('Error fetching emergency requests:', err);
      // Don't show error to user, just log it
    }
  };

  // Fetch GDACS data directly from API
  const fetchGdacsData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch directly from GDACS API
      const response = await fetch('https://www.gdacs.org/gdacsapi/api/Events/geteventlist/EVENTS4APP');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const features = data.features || [];
      
      // Filter alerts based on user location and broadcast status
      const filteredByLocation = filterAlertsByLocation(features);
      
      setGdacsData(filteredByLocation);
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
    // Get user location from user data or localStorage
    const userLocation = user.location || localStorage.getItem('userLocation') || 'India';
    
    return alerts.filter(alert => {
      const props = alert.properties;
      
      // If alert is broadcasted, check if it matches user's location
      if (alert.broadcasted) {
        return props.country.toLowerCase().includes(userLocation.toLowerCase()) ||
               props.name.toLowerCase().includes(userLocation.toLowerCase());
      }
      
      // For non-broadcasted alerts, show all (original behavior)
      return true;
    });
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
    const highSeverity = data.filter(a => a.properties?.alertlevel === 'Red').length;
    const localAlerts = data.filter(a => a.properties?.country.includes('India')).length; // Example local filter
    const recentAlerts = data.filter(a => {
      const alertDate = new Date(a.properties?.fromdate || a.timestamp);
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      return alertDate > twoDaysAgo;
    }).length;
    
    const acknowledged = data.filter(a => a.acknowledged).length;
    const pending = data.filter(a => !a.acknowledged && a.broadcasted).length;
    const emergencyCount = emergencyRequests.filter(req => !req.acknowledged).length;
    
    setStats({
      total,
      highSeverity,
      localAlerts,
      recentAlerts,
      acknowledged,
      pending,
      emergencyCount
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
    fetchEmergencyRequests();
    fetchAssignedTasks();
    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      fetchGdacsData();
      fetchEmergencyRequests();
      fetchAssignedTasks();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const applyFilters = () => {
    if (!gdacsData) return;
    
    const { type, severity, location } = filters;
    
    const filtered = gdacsData.filter(alert => {
      const props = alert.properties;
      
      if (type && props.eventtype !== type) return false;
      if (severity && props.alertlevel !== severity) return false;
      if (location && !props.country.toLowerCase().includes(location.toLowerCase())) return false;
      
      return true;
    });
    
    setFilteredAlerts(filtered);
    updateStats(filtered);
  };

  const resetFilters = () => {
    setFilters({ type: '', severity: '', location: '' });
    if (gdacsData) {
      setFilteredAlerts(gdacsData);
      updateStats(gdacsData);
    }
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const handleCompleteTask = async (taskId) => {
    try {
      // Update localStorage since backend doesn't exist yet
      const updatedTasks = assignedTasks.map(task => 
        task.id === taskId ? { ...task, status: 'completed', completedAt: new Date().toISOString(), completedBy: user.name } : task
      );
      
      setAssignedTasks(updatedTasks);
      
      // Update the shared storage
      const allStoredTasks = JSON.parse(localStorage.getItem('assignedTasks') || '[]');
      const updatedAllTasks = allStoredTasks.map(task => 
        task.id === taskId ? { ...task, status: 'completed', completedAt: new Date().toISOString(), completedBy: user.name } : task
      );
      localStorage.setItem('assignedTasks', JSON.stringify(updatedAllTasks));
      
      setError('✅ Task marked as completed');
      setTimeout(() => setError(''), 3000);
      
      // Try to send to backend (will fail until backend is implemented)
      try {
        const response = await axios.post(`/api/tasks/${taskId}/complete`, {
          responderId: user.id,
          responderName: user.name,
          completedAt: new Date().toISOString()
        }, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.data.success) {
          console.log('📋 Task completion saved to backend');
        }
      } catch (backendErr) {
        console.log('📋 Backend not available yet, using localStorage only');
      }
    } catch (err) {
      setError('Failed to complete task');
    }
  };

  const handleAcknowledgeTask = async (taskId) => {
    try {
      // Update localStorage since backend doesn't exist yet
      const updatedTasks = assignedTasks.map(task => 
        task.id === taskId ? { ...task, acknowledged: true, acknowledgedBy: user.name, acknowledgedAt: new Date().toISOString(), status: 'in-progress' } : task
      );
      
      setAssignedTasks(updatedTasks);
      
      // Update the shared storage
      const allStoredTasks = JSON.parse(localStorage.getItem('assignedTasks') || '[]');
      const updatedAllTasks = allStoredTasks.map(task => 
        task.id === taskId ? { ...task, acknowledged: true, acknowledgedBy: user.name, acknowledgedAt: new Date().toISOString(), status: 'in-progress' } : task
      );
      localStorage.setItem('assignedTasks', JSON.stringify(updatedAllTasks));
      
      setError('✅ Task acknowledged successfully');
      setTimeout(() => setError(''), 3000);
      
      // Try to send to backend (will fail until backend is implemented)
      try {
        const response = await axios.post(`/api/tasks/${taskId}/acknowledge`, {
          responderId: user.id,
          responderName: user.name,
          acknowledgedAt: new Date().toISOString()
        }, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.data.success) {
          console.log('📋 Task acknowledgment saved to backend');
        }
      } catch (backendErr) {
        console.log('📋 Backend not available yet, using localStorage only');
      }
    } catch (err) {
      setError('Failed to acknowledge task');
    }
  };

  const handleRespondToEmergency = async (emergencyId) => {
    try {
      // For now, update localStorage since backend doesn't exist yet
      const updatedRequests = emergencyRequests.map(req => 
        req.id === emergencyId ? { ...req, acknowledged: true, acknowledgedBy: user.name, acknowledgedAt: new Date().toISOString() } : req
      );
      
      setEmergencyRequests(updatedRequests);
      localStorage.setItem('emergencyRequests', JSON.stringify(updatedRequests));
      
      // Also update the citizen's view by updating the shared storage
      const allStoredRequests = JSON.parse(localStorage.getItem('emergencyRequests') || '[]');
      const updatedAllRequests = allStoredRequests.map(req => 
        req.id === emergencyId ? { ...req, acknowledged: true, acknowledgedBy: user.name, acknowledgedAt: new Date().toISOString() } : req
      );
      localStorage.setItem('emergencyRequests', JSON.stringify(updatedAllRequests));
      
      setError('✅ Emergency request acknowledged successfully');
      setTimeout(() => setError(''), 3000);
      
      // Try to send to backend (will fail until backend is implemented)
      try {
        const response = await axios.post(`/api/emergency/${emergencyId}/respond`, {
          responderId: user.id,
          responderName: user.name,
          responseTime: new Date().toISOString(),
          acknowledged: true
        }, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.data.success) {
          console.log('📞 Emergency acknowledgment saved to backend');
        }
      } catch (backendErr) {
        console.log('📞 Backend not available yet, using localStorage only');
      }
    } catch (err) {
      setError('Failed to acknowledge emergency request');
    }
  };

  const handleRespondToAlert = async (alertId) => {
    try {
      const response = await axios.post(`/api/alerts/${alertId}/respond`, {
        responderId: user.id,
        responseTime: new Date().toISOString(),
        acknowledged: true
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        // Update local state to mark as acknowledged
        const updatedAlerts = gdacsData.map(a => 
          a.properties.eventid === alertId ? { ...a, acknowledged: true, acknowledgedBy: user.name, acknowledgedAt: new Date().toISOString() } : a
        );
        
        const updatedFiltered = filteredAlerts.map(a => 
          a.properties.eventid === alertId ? { ...a, acknowledged: true, acknowledgedBy: user.name, acknowledgedAt: new Date().toISOString() } : a
        );
        
        setGdacsData(updatedAlerts);
        setFilteredAlerts(updatedFiltered);
        updateStats(updatedFiltered);
        
        // Save to localStorage
        localStorage.setItem('modifiedAlerts', JSON.stringify(updatedAlerts));
        
        setError('Response submitted successfully');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      setError('Failed to submit response');
    }
  };

  const handleMarkAsRead = async (alertId) => {
    try {
      const response = await axios.put(`/api/alerts/${alertId}/read`, {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        setError('Alert marked as read');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      setError('Failed to mark alert as read');
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
      <div className="responder-header">
        <h1>🚑 Responder Dashboard</h1>
        <div className="user-info">
          <div className="user-details">
            <span>Welcome, {user.name} (Responder)</span>
            <span className="user-location">📍 {user.location || localStorage.getItem('userLocation') || 'India'}</span>
          </div>
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </div>
      </div>
      
      {error && (
        <div className="error">
          {error}
        </div>
      )}
      
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
          <label htmlFor="locationFilter">Location:</label>
          <input 
            type="text" 
            id="locationFilter"
            placeholder="Filter by location"
            value={filters.location}
            onChange={(e) => handleFilterChange('location', e.target.value)}
          />
        </div>
        <button onClick={applyFilters}>Apply Filters</button>
        <button onClick={resetFilters}>Reset</button>
      </div>
      
      {/* Alerts Display */}
      <div className="responder-main-content">
        {/* Assigned Tasks Section */}
        {assignedTasks.length > 0 && (
          <div className="responder-section assigned-tasks-section">
            <h2 className="section-title">📋 Assigned Tasks</h2>
            {assignedTasks.map((task, index) => (
              <div key={index} className={`alert assigned-task ${task.acknowledged ? 'acknowledged' : ''} ${task.status === 'completed' ? 'completed' : ''}`}>
                <div className="alert-header">
                  <h3>📋 {task.title}</h3>
                  <div className="alert-status">
                    <span className={`status-badge ${task.priority}-badge`}>
                      {task.priority === 'critical' && '🚨 Critical'}
                      {task.priority === 'high' && '🔴 High'}
                      {task.priority === 'medium' && '🟡 Medium'}
                      {task.priority === 'low' && '🟢 Low'}
                    </span>
                    {task.type === 'disaster-task' && <span className="status-badge disaster-task-badge">🚨 Disaster Task</span>}
                    {task.status === 'completed' && <span className="status-badge completed-badge">✅ Completed</span>}
                    {task.acknowledged && task.status !== 'completed' && <span className="status-badge acknowledged-badge">✓ In Progress</span>}
                  </div>
                </div>
                
                <div className="alert-content">
                  {task.type === 'disaster-task' && (
                    <div className="disaster-task-info">
                      <p><strong>🚨 Disaster Alert ID:</strong> {task.disasterAlertId}</p>
                    </div>
                  )}
                  <p><strong>Description:</strong> {task.description}</p>
                  <p><strong>Location:</strong> {task.location}</p>
                  <p><strong>Assigned by:</strong> {task.assignedBy}</p>
                  <p><strong>Deadline:</strong> {task.deadline ? new Date(task.deadline).toLocaleString() : 'No deadline'}</p>
                  <p><strong>Assigned at:</strong> {new Date(task.assignedAt).toLocaleString()}</p>
                  
                  {task.acknowledged && (
                    <p><strong>Acknowledged at:</strong> {new Date(task.acknowledgedAt).toLocaleString()}</p>
                  )}
                  
                  {task.status === 'completed' && (
                    <div className="completion-details">
                      <p><strong>✅ Completed at:</strong> {new Date(task.completedAt).toLocaleString()}</p>
                      <p><strong>🎯 Completed by:</strong> {task.completedBy}</p>
                      <p><strong>⏱️ Duration:</strong> {
                        Math.round((new Date(task.completedAt) - new Date(task.acknowledgedAt)) / 1000 / 60) + ' minutes'
                      }</p>
                    </div>
                  )}
                </div>
                
                <div className="responder-actions">
                  {!task.acknowledged && (
                    <button onClick={() => handleAcknowledgeTask(task.id)} className="respond-btn task-ack-btn">
                      📋 Acknowledge Task
                    </button>
                  )}
                  {task.acknowledged && task.status !== 'completed' && (
                    <button onClick={() => handleCompleteTask(task.id)} className="respond-btn complete-task-btn">
                      ✅ Mark Complete
                    </button>
                  )}
                  <button onClick={() => alert('Task Description: ' + task.description)} className="details-btn">
                    📄 View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Emergency Requests Section */}
        {emergencyRequests.length > 0 ? (
          <div className="responder-section emergency-requests-section">
            <h2 className="section-title">🚨 Emergency Requests</h2>
            {emergencyRequests.map((request, index) => (
              <div key={index} className={`alert emergency-request ${request.acknowledged ? 'acknowledged' : ''}`}>
                <div className="alert-header">
                  <h3>🚨 {request.type} Emergency</h3>
                  <div className="alert-status">
                    <span className={`status-badge ${request.urgency}-badge`}>
                      {request.urgency === 'critical' && '🚨 Critical'}
                      {request.urgency === 'high' && '🔴 High'}
                      {request.urgency === 'medium' && '🟡 Medium'}
                      {request.urgency === 'low' && '🟢 Low'}
                    </span>
                    {request.acknowledged && <span className="status-badge acknowledged-badge">✓ Acknowledged</span>}
                  </div>
                </div>
                
                <div className="alert-content">
                  <p><strong>From:</strong> {request.citizenName}</p>
                  <p><strong>Description:</strong> {request.description}</p>
                  <p><strong>Location:</strong> {request.location}</p>
                  <p><strong>Contact:</strong> {request.contact}</p>
                  <p><strong>Time:</strong> {new Date(request.timestamp).toLocaleString()}</p>
                  
                  {request.acknowledged && (
                    <p><strong>Acknowledged by:</strong> {request.acknowledgedBy} at {new Date(request.acknowledgedAt).toLocaleString()}</p>
                  )}
                </div>
                
                <div className="responder-actions">
                  {!request.acknowledged && (
                    <button onClick={() => handleRespondToEmergency(request.id)} className="respond-btn emergency-respond-btn">
                      🚑 Acknowledge Emergency
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-alerts">
            <h3>No Emergency Requests</h3>
            <p>There are currently no emergency requests for your location.</p>
            <p>Citizens can submit emergency requests from their dashboard.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResponderDashboard;
