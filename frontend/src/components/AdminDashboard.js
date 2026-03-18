import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DisasterDashboard.css';

const AdminDashboard = ({ user, onLogout }) => {
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
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [analyticsData, setAnalyticsData] = useState({
    disastersByMonth: {},
    disastersByYear: {},
    responseTimesByRegion: {},
    resolutionEfficiencyByRegion: {},
    totalDisasters: 0,
    averageResponseTime: 0,
    responderActivity: {},
    highRiskAreas: {},
    broadcastMetrics: {},
    engagementMetrics: {}
  });
  const [taskAssignment, setTaskAssignment] = useState({
    title: '',
    description: '',
    location: '',
    priority: 'medium',
    assignedResponder: '',
    deadline: '',
    disasterAlertId: null
  });

  const calculateAnalytics = () => {
    try {
      // Get all disasters from localStorage
      const storedAlerts = localStorage.getItem('modifiedAlerts');
      const storedTasks = localStorage.getItem('assignedTasks');
      const storedEmergencies = localStorage.getItem('emergencyRequests');
      
      let alerts = storedAlerts ? JSON.parse(storedAlerts) : [];
      let tasks = storedTasks ? JSON.parse(storedTasks) : [];
      let emergencies = storedEmergencies ? JSON.parse(storedEmergencies) : [];
      
      // Add sample data if no real data exists to demonstrate analytics
      if (alerts.length === 0) {
        alerts = [
          {
            properties: {
              name: "Earthquake in Japan",
              eventtype: "EQ",
              alertlevel: "Red",
              country: "Japan",
              fromdate: "2026-01-15T10:30:00.000Z",
              eventid: "EQ-2026-001"
            }
          },
          {
            properties: {
              name: "Flood in India",
              eventtype: "FL",
              alertlevel: "Orange",
              country: "India",
              fromdate: "2026-02-20T14:15:00.000Z",
              eventid: "FL-2026-002"
            }
          },
          {
            properties: {
              name: "Wildfire in USA",
              eventtype: "WF",
              alertlevel: "Red",
              country: "USA",
              fromdate: "2026-03-10T09:45:00.000Z",
              eventid: "WF-2026-003"
            }
          },
          {
            properties: {
              name: "Typhoon in Philippines",
              eventtype: "TC",
              alertlevel: "Red",
              country: "Philippines",
              fromdate: "2025-12-05T16:20:00.000Z",
              eventid: "TC-2025-004"
            }
          },
          {
            properties: {
              name: "Earthquake in Indonesia",
              eventtype: "EQ",
              alertlevel: "Orange",
              country: "Indonesia",
              fromdate: "2025-12-18T11:30:00.000Z",
              eventid: "EQ-2025-005"
            }
          }
        ];
      }
      
      if (tasks.length === 0) {
        const now = new Date();
        tasks = [
          {
            id: "TASK_001",
            title: "Emergency Response Japan",
            location: "Japan",
            priority: "critical",
            assignedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
            acknowledgedAt: new Date(now.getTime() - 1.8 * 60 * 60 * 1000).toISOString(), // 1.8 hours ago
            status: "completed",
            completedAt: new Date(now.getTime() - 0.5 * 60 * 60 * 1000).toISOString(), // 30 minutes ago
            acknowledgedBy: "Responder Tanaka",
            completedBy: "Responder Tanaka",
            disasterAlertId: "EQ-2026-001"
          },
          {
            id: "TASK_002", 
            title: "Flood Relief India",
            location: "India",
            priority: "high",
            assignedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
            acknowledgedAt: new Date(now.getTime() - 2.5 * 60 * 60 * 1000).toISOString(), // 2.5 hours ago
            status: "in-progress",
            acknowledgedBy: "Responder Kumar",
            disasterAlertId: "FL-2026-002"
          },
          {
            id: "TASK_003",
            title: "Wildfire Evacuation USA", 
            location: "USA",
            priority: "critical",
            assignedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
            acknowledgedAt: new Date(now.getTime() - 0.8 * 60 * 60 * 1000).toISOString(), // 48 minutes ago
            status: "completed",
            completedAt: new Date(now.getTime() - 0.2 * 60 * 60 * 1000).toISOString(), // 12 minutes ago
            acknowledgedBy: "Responder Smith",
            completedBy: "Responder Smith",
            disasterAlertId: "WF-2026-003"
          },
          {
            id: "TASK_004",
            title: "Typhoon Response Philippines",
            location: "Philippines", 
            priority: "high",
            assignedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
            acknowledgedAt: new Date(now.getTime() - 3.2 * 60 * 60 * 1000).toISOString(), // 3.2 hours ago
            status: "completed",
            completedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
            acknowledgedBy: "Responder Reyes",
            completedBy: "Responder Reyes",
            disasterAlertId: "TC-2025-004"
          },
          {
            id: "TASK_005",
            title: "Earthquake Assessment Indonesia",
            location: "Indonesia",
            priority: "medium", 
            assignedAt: new Date(now.getTime() - 2.5 * 60 * 60 * 1000).toISOString(), // 2.5 hours ago
            acknowledgedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
            status: "in-progress",
            acknowledgedBy: "Responder Sari",
            disasterAlertId: "EQ-2025-005"
          },
          {
            id: "TASK_006",
            title: "Medical Support Japan",
            location: "Japan",
            priority: "medium",
            assignedAt: new Date(now.getTime() - 1.5 * 60 * 60 * 1000).toISOString(), // 1.5 hours ago
            acknowledgedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
            status: "completed",
            completedAt: new Date(now.getTime() - 0.3 * 60 * 60 * 1000).toISOString(), // 18 minutes ago
            acknowledgedBy: "Responder Yamamoto",
            completedBy: "Responder Yamamoto",
            disasterAlertId: "EQ-2026-001"
          }
        ];
      }
      
      // Calculate disasters by month/year
      const disastersByMonth = {};
      const disastersByYear = {};
      const responseTimesByRegion = {};
      const resolutionEfficiencyByRegion = {};
      
      // Process disasters
      alerts.forEach(alert => {
        const date = new Date(alert.properties.fromdate);
        const month = date.toLocaleString('default', { month: 'short', year: 'numeric' });
        const year = date.getFullYear();
        const country = alert.properties.country;
        
        disastersByMonth[month] = (disastersByMonth[month] || 0) + 1;
        disastersByYear[year] = (disastersByYear[year] || 0) + 1;
        
        // Initialize region data
        if (!responseTimesByRegion[country]) {
          responseTimesByRegion[country] = { total: 0, count: 0, times: [] };
          resolutionEfficiencyByRegion[country] = { completed: 0, total: 0 };
        }
      });
      
      // Process tasks for response times and efficiency
      tasks.forEach(task => {
        if (task.acknowledged && task.assignedAt && task.acknowledgedAt) {
          const assignedTime = new Date(task.assignedAt);
          const acknowledgedTime = new Date(task.acknowledgedAt);
          const responseTime = (acknowledgedTime - assignedTime) / 1000 / 60; // in minutes
          
          const region = task.location;
          if (!responseTimesByRegion[region]) {
            responseTimesByRegion[region] = { total: 0, count: 0, times: [] };
          }
          
          responseTimesByRegion[region].total += responseTime;
          responseTimesByRegion[region].count += 1;
          responseTimesByRegion[region].times.push(responseTime);
        }
        
        // Calculate resolution efficiency - ONLY count tasks that have a status (completed or in-progress)
        if (task.location && (task.status === 'completed' || task.status === 'in-progress' || task.status === 'pending')) {
          const region = task.location;
          if (!resolutionEfficiencyByRegion[region]) {
            resolutionEfficiencyByRegion[region] = { completed: 0, total: 0 };
          }
          resolutionEfficiencyByRegion[region].total += 1;
          
          if (task.status === 'completed') {
            resolutionEfficiencyByRegion[region].completed += 1;
          }
        }
      });
      
      // Calculate average response times by region
      Object.keys(responseTimesByRegion).forEach(region => {
        const data = responseTimesByRegion[region];
        data.average = data.count > 0 ? data.total / data.count : 0;
        data.median = data.times.length > 0 ? 
          data.times.sort((a, b) => a - b)[Math.floor(data.times.length / 2)] : 0;
      });
      
      // Calculate efficiency percentages
      Object.keys(resolutionEfficiencyByRegion).forEach(region => {
        const data = resolutionEfficiencyByRegion[region];
        data.efficiency = data.total > 0 ? (data.completed / data.total) * 100 : 0;
      });
      
      // Calculate responder activity metrics
      const responderActivity = {};
      tasks.forEach(task => {
        const responder = task.acknowledgedBy || task.completedBy;
        if (responder) {
          if (!responderActivity[responder]) {
            responderActivity[responder] = {
              totalTasks: 0,
              completedTasks: 0,
              acknowledgedTasks: 0,
              averageResponseTime: 0,
              totalResponseTime: 0,
              responseCount: 0
            };
          }
          
          responderActivity[responder].totalTasks++;
          
          if (task.status === 'completed') {
            responderActivity[responder].completedTasks++;
          }
          
          if (task.acknowledged) {
            responderActivity[responder].acknowledgedTasks++;
            
            // Calculate response time
            if (task.assignedAt && task.acknowledgedAt) {
              const responseTime = (new Date(task.acknowledgedAt) - new Date(task.assignedAt)) / 1000 / 60;
              responderActivity[responder].totalResponseTime += responseTime;
              responderActivity[responder].responseCount++;
            }
          }
        }
      });
      
      // Calculate average response times for responders
      Object.keys(responderActivity).forEach(responder => {
        const activity = responderActivity[responder];
        activity.averageResponseTime = activity.responseCount > 0 ? 
          activity.totalResponseTime / activity.responseCount : 0;
        activity.completionRate = activity.totalTasks > 0 ? 
          (activity.completedTasks / activity.totalTasks) * 100 : 0;
      });
      
      // Identify high-risk areas using historical data
      const highRiskAreas = {};
      alerts.forEach(alert => {
        const country = alert.properties.country;
        const severity = alert.properties.alertlevel;
        
        if (!highRiskAreas[country]) {
          highRiskAreas[country] = {
            totalDisasters: 0,
            redAlerts: 0,
            orangeAlerts: 0,
            riskScore: 0,
            recentDisasters: []
          };
        }
        
        highRiskAreas[country].totalDisasters++;
        
        if (severity === 'Red') {
          highRiskAreas[country].redAlerts++;
        } else if (severity === 'Orange') {
          highRiskAreas[country].orangeAlerts++;
        }
        
        // Calculate risk score (Red=10, Orange=5, others=2)
        const severityScore = severity === 'Red' ? 10 : severity === 'Orange' ? 5 : 2;
        highRiskAreas[country].riskScore += severityScore;
        
        // Track recent disasters (last 6 months)
        const disasterDate = new Date(alert.properties.fromdate);
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        if (disasterDate > sixMonthsAgo) {
          highRiskAreas[country].recentDisasters.push({
            name: alert.properties.name,
            date: alert.properties.fromdate,
            severity: severity
          });
        }
      });
      
      // Sort high-risk areas by risk score
      const sortedHighRiskAreas = Object.entries(highRiskAreas)
        .sort(([,a], [,b]) => b.riskScore - a.riskScore)
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
      
      // Calculate broadcast metrics
      const broadcastMetrics = {
        totalBroadcasts: alerts.filter(alert => alert.broadcasted).length,
        totalAlerts: alerts.length,
        broadcastRate: alerts.length > 0 ? (alerts.filter(alert => alert.broadcasted).length / alerts.length) * 100 : 0,
        broadcastsByMonth: {},
        broadcastsByRegion: {}
      };
      
      alerts.forEach(alert => {
        if (alert.broadcasted) {
          const date = new Date(alert.broadcastedAt || alert.properties.fromdate);
          const month = date.toLocaleString('default', { month: 'short', year: 'numeric' });
          const country = alert.properties.country;
          
          broadcastMetrics.broadcastsByMonth[month] = (broadcastMetrics.broadcastsByMonth[month] || 0) + 1;
          broadcastMetrics.broadcastsByRegion[country] = (broadcastMetrics.broadcastsByRegion[country] || 0) + 1;
        }
      });
      
      // Calculate engagement metrics
      const engagementMetrics = {
        totalAcknowledgments: 0,
        totalIgnored: 0,
        acknowledgedByRegion: {},
        ignoredByRegion: {},
        engagementRate: 0
      };
      
      // Get emergency requests for engagement analysis
      const emergencyRequests = storedEmergencies ? JSON.parse(storedEmergencies) : [];
      
      if (emergencyRequests.length === 0) {
        // Add sample emergency requests for demonstration
        const sampleEmergencyRequests = [
          {
            id: "EMERGENCY_001",
            location: "Japan",
            acknowledged: true,
            acknowledgedBy: "Responder Tanaka",
            acknowledgedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            submittedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
          },
          {
            id: "EMERGENCY_002", 
            location: "India",
            acknowledged: false,
            submittedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
          },
          {
            id: "EMERGENCY_003",
            location: "USA",
            acknowledged: true,
            acknowledgedBy: "Responder Smith",
            acknowledgedAt: new Date(Date.now() - 0.5 * 60 * 60 * 1000).toISOString(),
            submittedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString()
          },
          {
            id: "EMERGENCY_004",
            location: "Philippines",
            acknowledged: false,
            submittedAt: new Date(Date.now() - 0.8 * 60 * 60 * 1000).toISOString()
          },
          {
            id: "EMERGENCY_005",
            location: "Indonesia",
            acknowledged: true,
            acknowledgedBy: "Responder Sari",
            acknowledgedAt: new Date(Date.now() - 0.3 * 60 * 60 * 1000).toISOString(),
            submittedAt: new Date(Date.now() - 0.6 * 60 * 60 * 1000).toISOString()
          }
        ];
        
        sampleEmergencyRequests.forEach(request => {
          const location = request.location;
          
          if (request.acknowledged) {
            engagementMetrics.totalAcknowledgments++;
            engagementMetrics.acknowledgedByRegion[location] = (engagementMetrics.acknowledgedByRegion[location] || 0) + 1;
          } else {
            engagementMetrics.totalIgnored++;
            engagementMetrics.ignoredByRegion[location] = (engagementMetrics.ignoredByRegion[location] || 0) + 1;
          }
        });
        
        const totalRequests = sampleEmergencyRequests.length;
        engagementMetrics.engagementRate = totalRequests > 0 ? 
          (engagementMetrics.totalAcknowledgments / totalRequests) * 100 : 0;
      } else {
        emergencyRequests.forEach(request => {
          const location = request.location;
          
          if (request.acknowledged) {
            engagementMetrics.totalAcknowledgments++;
            engagementMetrics.acknowledgedByRegion[location] = (engagementMetrics.acknowledgedByRegion[location] || 0) + 1;
          } else {
            engagementMetrics.totalIgnored++;
            engagementMetrics.ignoredByRegion[location] = (engagementMetrics.ignoredByRegion[location] || 0) + 1;
          }
        });
        
        const totalRequests = emergencyRequests.length;
        engagementMetrics.engagementRate = totalRequests > 0 ? 
          (engagementMetrics.totalAcknowledgments / totalRequests) * 100 : 0;
      }
      
      // Debug logging to show calculations
      console.log('📊 Task Analysis:');
      console.log('Total tasks:', tasks.length);
      console.log('Tasks by status:', tasks.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      }, {}));
      
      console.log('📊 Regional Efficiency Calculations:');
      Object.entries(resolutionEfficiencyByRegion).forEach(([region, data]) => {
        console.log(`${region}: ${data.completed}/${data.total} = ${data.efficiency.toFixed(1)}%`);
      });
      
      console.log('📊 Performance Summary:');
      const highPerf = Object.values(resolutionEfficiencyByRegion).filter(r => r.efficiency >= 80).length;
      const medPerf = Object.values(resolutionEfficiencyByRegion).filter(r => r.efficiency >= 50 && r.efficiency < 80).length;
      const lowPerf = Object.values(resolutionEfficiencyByRegion).filter(r => r.efficiency < 50).length;
      console.log(`High (>80%): ${highPerf}, Medium (50-80%): ${medPerf}, Low (<50%): ${lowPerf}`);
      
      // Calculate overall average response time
      const allResponseTimes = Object.values(responseTimesByRegion).flatMap(region => region.times);
      const overallAverage = allResponseTimes.length > 0 ? 
        allResponseTimes.reduce((a, b) => a + b, 0) / allResponseTimes.length : 0;
      
      const analytics = {
        disastersByMonth,
        disastersByYear,
        responseTimesByRegion,
        resolutionEfficiencyByRegion,
        totalDisasters: alerts.length,
        averageResponseTime: overallAverage,
        responderActivity,
        highRiskAreas: sortedHighRiskAreas,
        broadcastMetrics,
        engagementMetrics
      };
      
      console.log('📊 Analytics calculated with sample data:', analytics);
      setAnalyticsData(analytics);
      
    } catch (err) {
      console.error('Error calculating analytics:', err);
    }
  };

  const fetchAssignedTasks = async () => {
    try {
      // Get assigned tasks from localStorage
      const storedTasks = localStorage.getItem('assignedTasks');
      if (storedTasks) {
        const tasks = JSON.parse(storedTasks);
        console.log('📋 Assigned tasks loaded in admin:', tasks);
        setAssignedTasks(tasks);
      }
    } catch (err) {
      console.error('Error fetching assigned tasks:', err);
    }
  };

  // Fetch GDACS data directly from API
  const fetchGdacsData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // First check if we have modified alerts in localStorage
      const storedModifiedAlerts = localStorage.getItem('modifiedAlerts');
      if (storedModifiedAlerts) {
        const modifiedAlerts = JSON.parse(storedModifiedAlerts);
        setGdacsData(modifiedAlerts);
        setFilteredAlerts(modifiedAlerts);
        setLoading(false);
        updateStats(modifiedAlerts);
        return;
      }
      
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
    fetchAssignedTasks();
    calculateAnalytics();
    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      fetchGdacsData();
      fetchAssignedTasks();
      calculateAnalytics();
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

  const handleVerifyAlert = async (alert) => {
    try {
      // Simulate verification - update local state and localStorage
      const updatedAlerts = gdacsData.map(a => 
        a.properties.eventid === alert.properties.eventid 
          ? { ...a, verified: true, verifiedBy: user.name, verifiedAt: new Date().toISOString() }
          : a
      );
      
      const updatedFiltered = filteredAlerts.map(a => 
        a.properties.eventid === alert.properties.eventid 
          ? { ...a, verified: true, verifiedBy: user.name, verifiedAt: new Date().toISOString() }
          : a
      );
      
      setGdacsData(updatedAlerts);
      setAlerts(updatedAlerts);
      setFilteredAlerts(updatedFiltered);
      
      // Save to localStorage for persistence
      localStorage.setItem('modifiedAlerts', JSON.stringify(updatedAlerts));
      
      setError('Alert verified successfully');
      setTimeout(() => setError(''), 3000);
      setShowVerificationModal(false);
      setSelectedAlert(null);
    } catch (err) {
      setError('Failed to verify alert: ' + err.message);
    }
  };

  const handleEditAlert = (alert) => {
    setSelectedAlert(alert);
    setIsEditing(true);
    setShowEditModal(true);
  };

  const handleSaveAlert = async () => {
    try {
      // Simulate saving - update local state and localStorage
      const updatedAlerts = gdacsData.map(a => 
        a.properties.eventid === selectedAlert.properties.eventid ? selectedAlert : a
      );
      
      const updatedFiltered = filteredAlerts.map(a => 
        a.properties.eventid === selectedAlert.properties.eventid ? selectedAlert : a
      );
      
      setGdacsData(updatedAlerts);
      setAlerts(updatedAlerts);
      setFilteredAlerts(updatedFiltered);
      
      // Save to localStorage for persistence
      localStorage.setItem('modifiedAlerts', JSON.stringify(updatedAlerts));
      
      setError('Alert updated successfully');
      setTimeout(() => setError(''), 3000);
      setShowEditModal(false);
      setSelectedAlert(null);
      setIsEditing(false);
    } catch (err) {
      setError('Failed to save alert: ' + err.message);
    }
  };

  const handleBroadcastAlert = async (alert) => {
    try {
      // Simulate broadcasting - update local state and localStorage
      const updatedAlerts = gdacsData.map(a => 
        a.properties.eventid === alert.properties.eventid 
          ? { ...a, broadcasted: true, broadcastedBy: user.name, broadcastedAt: new Date().toISOString() }
          : a
      );
      
      const updatedFiltered = filteredAlerts.map(a => 
        a.properties.eventid === alert.properties.eventid 
          ? { ...a, broadcasted: true, broadcastedBy: user.name, broadcastedAt: new Date().toISOString() }
          : a
      );
      
      setGdacsData(updatedAlerts);
      setAlerts(updatedAlerts);
      setFilteredAlerts(updatedFiltered);
      
      // Save to localStorage for persistence
      localStorage.setItem('modifiedAlerts', JSON.stringify(updatedAlerts));
      
      setError('Alert broadcasted successfully to all users');
      setTimeout(() => setError(''), 3000);
      setShowBroadcastModal(false);
      setSelectedAlert(null);
    } catch (err) {
      setError('Failed to broadcast alert: ' + err.message);
    }
  };

  const handleAssignTask = async () => {
    try {
      // Create task object
      const task = {
        id: 'TASK_' + Date.now(),
        title: taskAssignment.title || `Task for ${taskAssignment.disasterAlertId}`,
        description: taskAssignment.description,
        location: taskAssignment.location,
        priority: taskAssignment.priority,
        assignedResponder: taskAssignment.assignedResponder,
        deadline: taskAssignment.deadline,
        assignedBy: user.name,
        assignedAt: new Date().toISOString(),
        status: 'pending',
        acknowledged: false,
        disasterAlertId: taskAssignment.disasterAlertId,
        type: 'disaster-task'
      };
      
      // Get existing tasks or create new array
      const existingTasks = JSON.parse(localStorage.getItem('assignedTasks') || '[]');
      existingTasks.push(task);
      localStorage.setItem('assignedTasks', JSON.stringify(existingTasks));
      
      setError('✅ Task assigned successfully to ' + taskAssignment.assignedResponder);
      setTimeout(() => setError(''), 3000);
      setShowTaskModal(false);
      setTaskAssignment({
        title: '',
        description: '',
        location: '',
        priority: 'medium',
        assignedResponder: '',
        deadline: '',
        disasterAlertId: null
      });
      
      console.log('📋 Task assigned:', task);
    } catch (err) {
      setError('Failed to assign task: ' + err.message);
    }
  };

  const getTasksForDisaster = (disasterId) => {
    return assignedTasks.filter(task => task.disasterAlertId === disasterId);
  };

  const handleShowTaskDetails = (disasterId) => {
    const tasks = getTasksForDisaster(disasterId);
    if (tasks.length === 0) {
      setError('No tasks assigned for this disaster yet');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    const taskDetails = tasks.map(task => 
      `📋 ${task.title}\n` +
      `📍 Location: ${task.location}\n` +
      `👤 Assigned to: ${task.assignedResponder}\n` +
      `🎯 Priority: ${task.priority}\n` +
      `📊 Status: ${task.status}\n` +
      `${task.acknowledged ? `✅ Acknowledged by ${task.acknowledgedBy} at ${new Date(task.acknowledgedAt).toLocaleString()}` : '⏳ Not acknowledged yet'}\n` +
      `${task.status === 'completed' ? `🎉 Completed by ${task.completedBy} at ${new Date(task.completedAt).toLocaleString()}` : ''}\n` +
      `---`
    ).join('\n\n');
    
    alert(`📋 Task Details for Disaster ${disasterId}:\n\n${taskDetails}`);
  };

  const handleAssignDisasterTask = (alert) => {
    const props = alert.properties;
    setTaskAssignment({
      title: `Response Task: ${props.name}`,
      description: `Respond to disaster: ${props.htmldescription}`,
      location: props.country,
      priority: props.alertlevel === 'Red' ? 'critical' : props.alertlevel === 'Orange' ? 'high' : 'medium',
      assignedResponder: '',
      deadline: '',
      disasterAlertId: props.eventid
    });
    setShowTaskModal(true);
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
      <div className="admin-header">
        <h1>🛡️ Admin Dashboard</h1>
        <div className="user-info">
          <span>Welcome, {user.name} (Admin)</span>
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </div>
      </div>
      
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

      {/* Analytics Dashboard */}
      <div className="analytics-dashboard">
        <h2 className="analytics-title">📊 Disaster Analytics Dashboard</h2>
        
        <div className="analytics-grid">
          {/* Disaster Statistics */}
          <div className="analytics-section">
            <h3>📈 Disaster Statistics</h3>
            <div className="analytics-cards">
              <div className="analytics-card">
                <h4>📅 Disasters by Month</h4>
                <div className="analytics-list">
                  {Object.entries(analyticsData.disastersByMonth).map(([month, count]) => (
                    <div key={month} className="analytics-item">
                      <span>{month}</span>
                      <span className="analytics-value">{count}</span>
                    </div>
                  ))}
                  {Object.keys(analyticsData.disastersByMonth).length === 0 && (
                    <p className="no-data">No disaster data available</p>
                  )}
                </div>
              </div>
              
              <div className="analytics-card">
                <h4>📆 Disasters by Year</h4>
                <div className="analytics-list">
                  {Object.entries(analyticsData.disastersByYear).map(([year, count]) => (
                    <div key={year} className="analytics-item">
                      <span>{year}</span>
                      <span className="analytics-value">{count}</span>
                    </div>
                  ))}
                  {Object.keys(analyticsData.disastersByYear).length === 0 && (
                    <p className="no-data">No disaster data available</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Response Times by Region */}
          <div className="analytics-section">
            <h3>⏱️ Response Times by Region</h3>
            <div className="analytics-cards">
              <div className="analytics-card">
                <h4>📍 Average Response Time (Minutes)</h4>
                <div className="analytics-list">
                  {Object.entries(analyticsData.responseTimesByRegion).map(([region, data]) => (
                    <div key={region} className="analytics-item">
                      <span>{region}</span>
                      <div className="analytics-value">
                        <span className="response-time">{data.average.toFixed(1)} min</span>
                        <span className="response-count">({data.count} tasks)</span>
                      </div>
                    </div>
                  ))}
                  {Object.keys(analyticsData.responseTimesByRegion).length === 0 && (
                    <p className="no-data">No response time data available</p>
                  )}
                </div>
              </div>
              
              <div className="analytics-card">
                <h4>🎯 Overall Performance</h4>
                <div className="performance-metrics">
                  <div className="metric-item">
                    <span>Total Disasters</span>
                    <span className="metric-value">{analyticsData.totalDisasters}</span>
                  </div>
                  <div className="metric-item">
                    <span>Average Response Time</span>
                    <span className="metric-value">{analyticsData.averageResponseTime.toFixed(1)} min</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Resolution Efficiency by Region */}
          <div className="analytics-section">
            <h3>✅ Resolution Efficiency by Region</h3>
            <div className="analytics-cards">
              <div className="analytics-card">
                <h4>📊 Completion Rate (%)</h4>
                <div className="analytics-list">
                  {Object.entries(analyticsData.resolutionEfficiencyByRegion).map(([region, data]) => (
                    <div key={region} className="analytics-item">
                      <span>{region}</span>
                      <div className="analytics-value">
                        <span className={`efficiency-rate ${data.efficiency >= 80 ? 'high' : data.efficiency >= 50 ? 'medium' : 'low'}`}>
                          {data.efficiency.toFixed(1)}%
                        </span>
                        <span className="task-count">({data.completed}/{data.total})</span>
                      </div>
                    </div>
                  ))}
                  {Object.keys(analyticsData.resolutionEfficiencyByRegion).length === 0 && (
                    <p className="no-data">No efficiency data available</p>
                  )}
                </div>
              </div>
              
              <div className="analytics-card">
                <h4>📈 Performance Summary</h4>
                <div className="performance-summary">
                  <div className="summary-item high">
                    <span>High Performance (&gt;80%)</span>
                    <span>{Object.values(analyticsData.resolutionEfficiencyByRegion).filter(r => r.efficiency >= 80).length}</span>
                  </div>
                  <div className="summary-item medium">
                    <span>Medium Performance (50-80%)</span>
                    <span>{Object.values(analyticsData.resolutionEfficiencyByRegion).filter(r => r.efficiency >= 50 && r.efficiency < 80).length}</span>
                  </div>
                  <div className="summary-item low">
                    <span>Low Performance (&lt;50%)</span>
                    <span>{Object.values(analyticsData.resolutionEfficiencyByRegion).filter(r => r.efficiency < 50).length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Performance Metrics */}
          <div className="analytics-section">
            <h3>🎯 Performance Metrics</h3>
            <div className="analytics-cards">
              <div className="analytics-card">
                <h4>👥 Responder Activity</h4>
                <div className="analytics-list">
                  {Object.entries(analyticsData.responderActivity).map(([responder, activity]) => (
                    <div key={responder} className="analytics-item">
                      <span>{responder}</span>
                      <div className="responder-stats">
                        <span className="completion-rate">{activity.completionRate.toFixed(1)}%</span>
                        <span className="task-count">({activity.completedTasks}/{activity.totalTasks})</span>
                        <span className="response-time">{activity.averageResponseTime.toFixed(1)}min</span>
                      </div>
                    </div>
                  ))}
                  {Object.keys(analyticsData.responderActivity).length === 0 && (
                    <p className="no-data">No responder activity data available</p>
                  )}
                </div>
              </div>
              
              <div className="analytics-card">
                <h4>⚠️ High-Risk Areas</h4>
                <div className="analytics-list">
                  {Object.entries(analyticsData.highRiskAreas).slice(0, 5).map(([area, data]) => (
                    <div key={area} className="analytics-item">
                      <span>{area}</span>
                      <div className="risk-stats">
                        <span className={`risk-score ${data.riskScore >= 20 ? 'high' : data.riskScore >= 10 ? 'medium' : 'low'}`}>
                          Score: {data.riskScore}
                        </span>
                        <span className="disaster-count">{data.totalDisasters} disasters</span>
                      </div>
                    </div>
                  ))}
                  {Object.keys(analyticsData.highRiskAreas).length === 0 && (
                    <p className="no-data">No risk data available</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Notification Insights */}
          <div className="analytics-section">
            <h3>📢 Notification Insights</h3>
            <div className="analytics-cards">
              <div className="analytics-card">
                <h4>📡 Broadcast Metrics</h4>
                <div className="broadcast-stats">
                  <div className="metric-item">
                    <span>Total Broadcasts</span>
                    <span className="metric-value">{analyticsData.broadcastMetrics.totalBroadcasts}</span>
                  </div>
                  <div className="metric-item">
                    <span>Broadcast Rate</span>
                    <span className="metric-value">{analyticsData.broadcastMetrics.broadcastRate.toFixed(1)}%</span>
                  </div>
                  <div className="metric-item">
                    <span>Total Alerts</span>
                    <span className="metric-value">{analyticsData.broadcastMetrics.totalAlerts}</span>
                  </div>
                </div>
                
                <h5>📅 Broadcasts by Month</h5>
                <div className="analytics-list">
                  {Object.entries(analyticsData.broadcastMetrics.broadcastsByMonth).map(([month, count]) => (
                    <div key={month} className="analytics-item">
                      <span>{month}</span>
                      <span className="analytics-value">{count}</span>
                    </div>
                  ))}
                  {Object.keys(analyticsData.broadcastMetrics.broadcastsByMonth).length === 0 && (
                    <p className="no-data">No broadcast data available</p>
                  )}
                </div>
              </div>
              
              <div className="analytics-card">
                <h4>📊 User Engagement</h4>
                <div className="engagement-stats">
                  <div className="metric-item">
                    <span>Total Acknowledged</span>
                    <span className="metric-value success">{analyticsData.engagementMetrics.totalAcknowledgments}</span>
                  </div>
                  <div className="metric-item">
                    <span>Total Ignored</span>
                    <span className="metric-value danger">{analyticsData.engagementMetrics.totalIgnored}</span>
                  </div>
                  <div className="metric-item">
                    <span>Engagement Rate</span>
                    <span className={`metric-value ${analyticsData.engagementMetrics.engagementRate >= 70 ? 'success' : analyticsData.engagementMetrics.engagementRate >= 40 ? 'warning' : 'danger'}`}>
                      {analyticsData.engagementMetrics.engagementRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
                
                <h5>📍 Acknowledgments by Region</h5>
                <div className="analytics-list">
                  {Object.entries(analyticsData.engagementMetrics.acknowledgedByRegion).map(([region, count]) => (
                    <div key={region} className="analytics-item">
                      <span>{region}</span>
                      <span className="analytics-value success">{count}</span>
                    </div>
                  ))}
                  {Object.keys(analyticsData.engagementMetrics.acknowledgedByRegion).length === 0 && (
                    <p className="no-data">No engagement data available</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <h1>🌍 GDACS Live Disaster Alerts</h1>
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
          const isVerified = alert.verified || false;
          const isBroadcasted = alert.broadcasted || false;
          const disasterTasks = getTasksForDisaster(props.eventid);
          const hasActiveTasks = disasterTasks.length > 0;
          
          return (
            <div key={index} className={`alert ${getAlertTypeClass(props.eventtype)} ${isVerified ? 'verified' : ''} ${isBroadcasted ? 'broadcasted' : ''}`}>
              <div className="alert-header">
                <h3>{props.name}</h3>
                <div className="alert-status">
                  {isVerified && <span className="status-badge verified-badge">✓ Verified</span>}
                  {isBroadcasted && <span className="status-badge broadcasted-badge">📢 Broadcasted</span>}
                  {hasActiveTasks && <span className="status-badge tasks-assigned-badge">📋 Tasks Assigned</span>}
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
                
                {isVerified && (
                  <p><strong>Verified by:</strong> {alert.verifiedBy} at {new Date(alert.verifiedAt).toLocaleString()}</p>
                )}
                
                {isBroadcasted && (
                  <p><strong>Broadcasted by:</strong> {alert.broadcastedBy} at {new Date(alert.broadcastedAt).toLocaleString()}</p>
                )}
                
                {/* Task Status Section */}
                {hasActiveTasks && (
                  <div className="task-status-section">
                    <h4>📋 Task Status</h4>
                    {disasterTasks.map((task, taskIndex) => (
                      <div key={taskIndex} className={`task-status-item ${task.status === 'completed' ? 'completed' : task.acknowledged ? 'acknowledged' : 'pending'}`}>
                        <p><strong>📋 {task.title}</strong></p>
                        <p><strong>👤 Assigned to:</strong> {task.assignedResponder}</p>
                        <p><strong>🎯 Priority:</strong> {task.priority}</p>
                        <p><strong>📊 Status:</strong> 
                          <span className={`status-text ${task.status}`}>
                            {task.status === 'completed' && `✅ Completed by ${task.completedBy} at ${new Date(task.completedAt).toLocaleString()}`}
                            {task.status === 'in-progress' && `🔄 In Progress - Acknowledged by ${task.acknowledgedBy} at ${new Date(task.acknowledgedAt).toLocaleString()}`}
                            {task.status === 'pending' && `⏳ Pending - Not acknowledged yet`}
                          </span>
                        </p>
                        {task.deadline && (
                          <p><strong>⏰ Deadline:</strong> {new Date(task.deadline).toLocaleString()}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="admin-actions">
                {!isVerified && (
                  <button 
                    onClick={() => {
                      setSelectedAlert(alert);
                      setShowVerificationModal(true);
                    }} 
                    className="verify-btn"
                  >
                    Verify
                  </button>
                )}
                <button 
                  onClick={() => handleEditAlert(alert)} 
                  className="edit-btn"
                >
                  Edit
                </button>
                {!isBroadcasted && (
                  <button 
                    onClick={() => {
                      setSelectedAlert(alert);
                      setShowBroadcastModal(true);
                    }} 
                    className="broadcast-btn"
                  >
                    Broadcast
                  </button>
                )}
                <button 
                  onClick={() => handleAssignDisasterTask(alert)} 
                  className="assign-disaster-task-btn"
                >
                  📋 Assign Task
                </button>
                {hasActiveTasks && (
                  <button 
                    onClick={() => handleShowTaskDetails(props.eventid)} 
                    className="task-details-btn"
                  >
                    📄 Task Details
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Verification Modal */}
      {showVerificationModal && selectedAlert && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Verify Alert</h3>
              <button
                onClick={() => {
                  setShowVerificationModal(false);
                  setSelectedAlert(null);
                }}
                className="close-btn"
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <p>Are you sure you want to verify this alert?</p>
              <div className="alert-summary">
                <h4>{selectedAlert.properties.name}</h4>
                <p><strong>Type:</strong> {getEventType(selectedAlert.properties.eventtype)}</p>
                <p><strong>Severity:</strong> <span className={getSeverityClass(selectedAlert.properties.alertlevel)}>{selectedAlert.properties.alertlevel}</span></p>
                <p><strong>Location:</strong> {selectedAlert.properties.country}</p>
                <p><strong>Description:</strong> {selectedAlert.properties.htmldescription}</p>
              </div>
            </div>
            
            <div className="modal-actions">
              <button
                onClick={() => handleVerifyAlert(selectedAlert)}
                className="confirm-btn"
              >
                Verify Alert
              </button>
              <button
                onClick={() => {
                  setShowVerificationModal(false);
                  setSelectedAlert(null);
                }}
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedAlert && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Edit Alert</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedAlert(null);
                  setIsEditing(false);
                }}
                className="close-btn"
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Alert Title</label>
                <input
                  type="text"
                  value={selectedAlert.properties.name}
                  onChange={(e) => setSelectedAlert({
                    ...selectedAlert,
                    properties: {
                      ...selectedAlert.properties,
                      name: e.target.value
                    }
                  })}
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={selectedAlert.properties.htmldescription}
                  onChange={(e) => setSelectedAlert({
                    ...selectedAlert,
                    properties: {
                      ...selectedAlert.properties,
                      htmldescription: e.target.value
                    }
                  })}
                  className="form-textarea"
                  rows="4"
                />
              </div>
              
              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  value={selectedAlert.properties.country}
                  onChange={(e) => setSelectedAlert({
                    ...selectedAlert,
                    properties: {
                      ...selectedAlert.properties,
                      country: e.target.value
                    }
                  })}
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label>Severity</label>
                <select
                  value={selectedAlert.properties.alertlevel}
                  onChange={(e) => setSelectedAlert({
                    ...selectedAlert,
                    properties: {
                      ...selectedAlert.properties,
                      alertlevel: e.target.value
                    }
                  })}
                  className="form-select"
                >
                  <option value="Green">Green</option>
                  <option value="Orange">Orange</option>
                  <option value="Red">Red</option>
                </select>
              </div>
            </div>
            
            <div className="modal-actions">
              <button
                onClick={handleSaveAlert}
                className="save-btn"
              >
                Save Changes
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedAlert(null);
                  setIsEditing(false);
                }}
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Broadcast Modal */}
      {showBroadcastModal && selectedAlert && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Broadcast Alert</h3>
              <button
                onClick={() => {
                  setShowBroadcastModal(false);
                  setSelectedAlert(null);
                }}
                className="close-btn"
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <p>Are you sure you want to broadcast this alert to all users?</p>
              <div className="alert-summary">
                <h4>{selectedAlert.properties.name}</h4>
                <p><strong>Type:</strong> {getEventType(selectedAlert.properties.eventtype)}</p>
                <p><strong>Severity:</strong> <span className={getSeverityClass(selectedAlert.properties.alertlevel)}>{selectedAlert.properties.alertlevel}</span></p>
                <p><strong>Location:</strong> {selectedAlert.properties.country}</p>
                <p><strong>Description:</strong> {selectedAlert.properties.htmldescription}</p>
                <div className="broadcast-warning">
                  <p><strong>⚠️ Warning:</strong> This will send the alert to all registered users including citizens and responders.</p>
                </div>
              </div>
            </div>
            
            <div className="modal-actions">
              <button
                onClick={() => handleBroadcastAlert(selectedAlert)}
                className="confirm-btn broadcast-confirm-btn"
              >
                Broadcast Alert
              </button>
              <button
                onClick={() => {
                  setShowBroadcastModal(false);
                  setSelectedAlert(null);
                }}
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Task Assignment Modal */}
      {showTaskModal && (
        <div className="modal-overlay">
          <div className="modal task-modal">
            <div className="modal-header">
              <h3>📋 {taskAssignment.disasterAlertId ? 'Assign Task for Disaster' : 'Assign Task to Responder'}</h3>
              <button
                onClick={() => {
                  setShowTaskModal(false);
                  setTaskAssignment({
                    title: '',
                    description: '',
                    location: '',
                    priority: 'medium',
                    assignedResponder: '',
                    deadline: '',
                    disasterAlertId: null
                  });
                }}
                className="close-btn"
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              {taskAssignment.disasterAlertId && (
                <div className="disaster-info">
                  <p><strong>🚨 Disaster Alert ID:</strong> {taskAssignment.disasterAlertId}</p>
                  <p><strong>📍 Location:</strong> {taskAssignment.location}</p>
                </div>
              )}
              
              <div className="form-group">
                <label>Task Title</label>
                <input
                  type="text"
                  placeholder="Enter task title..."
                  value={taskAssignment.title}
                  onChange={(e) => setTaskAssignment({...taskAssignment, title: e.target.value})}
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label>Task Description</label>
                <textarea
                  placeholder="Describe the task in detail..."
                  value={taskAssignment.description}
                  onChange={(e) => setTaskAssignment({...taskAssignment, description: e.target.value})}
                  className="form-textarea"
                  rows="4"
                />
              </div>
              
              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  placeholder="Enter task location..."
                  value={taskAssignment.location}
                  onChange={(e) => setTaskAssignment({...taskAssignment, location: e.target.value})}
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label>Priority</label>
                <select
                  value={taskAssignment.priority}
                  onChange={(e) => setTaskAssignment({...taskAssignment, priority: e.target.value})}
                  className="form-select"
                >
                  <option value="low">🟢 Low</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="high">🔴 High</option>
                  <option value="critical">🚨 Critical</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Assigned Responder</label>
                <input
                  type="text"
                  placeholder="Enter responder name or ID..."
                  value={taskAssignment.assignedResponder}
                  onChange={(e) => setTaskAssignment({...taskAssignment, assignedResponder: e.target.value})}
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label>Deadline</label>
                <input
                  type="datetime-local"
                  value={taskAssignment.deadline}
                  onChange={(e) => setTaskAssignment({...taskAssignment, deadline: e.target.value})}
                  className="form-input"
                />
              </div>
            </div>
            
            <div className="modal-actions">
              <button
                onClick={handleAssignTask}
                className="confirm-btn task-confirm-btn"
                disabled={!taskAssignment.title || !taskAssignment.description || !taskAssignment.location || !taskAssignment.assignedResponder}
              >
                📋 Assign Task
              </button>
              <button
                onClick={() => {
                  setShowTaskModal(false);
                  setTaskAssignment({
                    title: '',
                    description: '',
                    location: '',
                    priority: 'medium',
                    assignedResponder: '',
                    deadline: ''
                  });
                }}
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

export default AdminDashboard;
