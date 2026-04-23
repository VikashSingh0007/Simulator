import React, { useState } from 'react';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import Canvas from './components/builder/Canvas';
import ConfigPanel from './components/builder/ConfigPanel';
import MetricsDashboard from './components/dashboard/MetricsDashboard';
import ScenarioLibrary from './components/scenarios/ScenarioLibrary';
import TrafficConfig from './components/simulation/TrafficConfig';
import FailureInjector from './components/simulation/FailureInjector';
import EventLog from './components/simulation/EventLog';
import DesignInsights from './components/simulation/DesignInsights';

export default function App() {
  const [showScenarios, setShowScenarios] = useState(false);
  const [showTraffic, setShowTraffic] = useState(false);
  const [showFailure, setShowFailure] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [eventLogCollapsed, setEventLogCollapsed] = useState(true);
  const [dashboardCollapsed, setDashboardCollapsed] = useState(false);

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-950 text-white overflow-hidden">
      {/* Header */}
      <Header
        onOpenScenarios={() => setShowScenarios(true)}
        onOpenTraffic={() => setShowTraffic(!showTraffic)}
        onOpenFailure={() => setShowFailure(!showFailure)}
        onOpenInsights={() => setShowInsights(!showInsights)}
      />

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar */}
        <Sidebar />

        {/* Canvas + Config */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 flex overflow-hidden relative">
            {/* React Flow Canvas */}
            <Canvas />
            {/* Config Panel */}
            <ConfigPanel />

            {/* Event Log (floating bottom-left of canvas) */}
            <div className="absolute bottom-4 left-4 z-30">
              <EventLog
                collapsed={eventLogCollapsed}
                onToggle={() => setEventLogCollapsed(!eventLogCollapsed)}
              />
            </div>

            {/* Design Insights (floating right overlay) */}
            {showInsights && (
              <DesignInsights onClose={() => setShowInsights(false)} />
            )}
          </div>

          {/* Metrics Dashboard */}
          <MetricsDashboard
            collapsed={dashboardCollapsed}
            onToggle={() => setDashboardCollapsed(!dashboardCollapsed)}
            onOpenTraffic={() => setShowTraffic(!showTraffic)}
            onOpenFailure={() => setShowFailure(!showFailure)}
          />
        </div>

        {/* Floating panels */}
        {showTraffic && <TrafficConfig onClose={() => setShowTraffic(false)} />}
        {showFailure && <FailureInjector onClose={() => setShowFailure(false)} />}
      </div>

      {/* Modals */}
      {showScenarios && <ScenarioLibrary onClose={() => setShowScenarios(false)} />}
    </div>
  );
}