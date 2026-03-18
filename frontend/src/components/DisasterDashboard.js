import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DisasterDashboard.css';

const DisasterDashboard = ({ logout }) => {
  const [alerts, setAlerts] = useState([]);
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [gdacsData, setGdacsData] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    earthquakes: 0,
    fires: 0,
    floods: 0
  });
  const [filters, setFilters] = useState({
    type: '',
    severity: '',
    country: ''
  });

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
      
      setGdacsData(features);
      setFilteredAlerts(features);
      setLoading(false);
      updateStats(features);
      
    } catch (err) {
      console.error('Error fetching GDACS data:', err);
      setError('Failed to load GDACS data: ' + err.message);
      setLoading(false);
      
      // Load sample data as fallback
      loadSampleData();
    }
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
    
    setGdacsData(sampleData);
    setFilteredAlerts(sampleData);
    setLoading(false);
    updateStats(sampleData);
  };

  const updateStats = (data) => {
    const total = data.length;
    const earthquakes = data.filter(a => a.properties.eventtype === 'EQ').length;
    const fires = data.filter(a => a.properties.eventtype === 'WF').length;
    const floods = data.filter(a => a.properties.eventtype === 'FL').length;
    
    setStats({
      total,
      earthquakes,
      fires,
      floods
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
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchGdacsData, 5 * 60 * 1000);
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

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return '#ff4444';
      case 'moderate': return '#ff8800';
      case 'low': return '#00C851';
      default: return '#757575';
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
      <h1>🌍 GDACS Live Disaster Alerts</h1>
      
      {error && (
        <div className="error">
          {error}
        </div>
      )}
      
      {/* Statistics Cards */}
      <div className="stats">
        <div className="stat-card">
          <h3>{stats.total}</h3>
          <p>Total Alerts</p>
        </div>
        <div className="stat-card">
          <h3>{stats.earthquakes}</h3>
          <p>Earthquakes</p>
        </div>
        <div className="stat-card">
          <h3>{stats.fires}</h3>
          <p>Forest Fires</p>
        </div>
        <div className="stat-card">
          <h3>{stats.floods}</h3>
          <p>Floods</p>
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
            <option value="Green">Green</option>
            <option value="Orange">Orange</option>
            <option value="Red">Red</option>
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="countryFilter">Country:</label>
          <input 
            type="text" 
            id="countryFilter"
            placeholder="Enter country name"
            value={filters.country}
            onChange={(e) => handleFilterChange('country', e.target.value)}
          />
        </div>
        <button onClick={applyFilters}>Apply Filters</button>
        <button onClick={resetFilters}>Reset</button>
      </div>
      
      {/* Alerts Display */}
      <div className="alerts-container">
        {filteredAlerts.map((alert, index) => {
          const props = alert.properties;
          const coords = alert.geometry.coordinates;
          
          return (
            <div key={index} className={`alert ${getAlertTypeClass(props.eventtype)}`}>
              <h3 style="color:black">{props.name}</h3>
              <p><strong>Type:</strong> {getEventType(props.eventtype)}</p>
              <p><strong>Severity:</strong> <span className={getSeverityClass(props.alertlevel)}>{props.alertlevel}</span></p>
              <p><strong>Location:</strong> {props.country}</p>
              <p><strong>Date:</strong> {new Date(props.fromdate).toLocaleDateString()}</p>
              <p><strong>Description:</strong> {props.htmldescription}</p>
              <p><strong>Coordinates:</strong> {coords[1].toFixed(4)}, {coords[0].toFixed(4)}</p>
              <p><strong>Event ID:</strong> {props.eventid}</p>
            </div>
          );
        })}
      </div>
      
      <button onClick={logout} className="logout-btn">Logout</button>
    </div>
  );
};

export default DisasterDashboard;
