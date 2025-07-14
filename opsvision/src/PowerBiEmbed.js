import React, { useEffect, useRef, useState } from 'react';
import { models, factories, service } from 'powerbi-client';

const PowerBiEmbed = () => {
  const reportRef = useRef(null);
  const [reportConfig, setReportConfig] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [selectedReport, setSelectedReport] = useState('');

  // Fetch role on mount
  useEffect(() => {
    const role = localStorage.getItem('role') || '';
    setUserRole(role);
  }, []);

  // Fetch embed config whenever a report is selected
  useEffect(() => {
    if (!selectedReport) return;

    const fetchReportConfig = async () => {
      try {
        console.log(`Fetching embed config for report: ${selectedReport}`);
        const token = localStorage.getItem('token');
        const res = await fetch(`https://opsvisionbe.integrator-orange.com/api/PowerBi/embed/${selectedReport}`, {
  headers: {
    Authorization: `Bearer ${token}`
  }
});

        if (!res.ok) {
          console.error(`API error: ${res.status}`);
          return;
        }

        const data = await res.json();
        setReportConfig(data);
      } catch (err) {
        console.error('Error fetching Power BI config:', err);
      }
    };

    fetchReportConfig();
  }, [selectedReport]);

  // Embed report when config is ready
  useEffect(() => {
    if (reportConfig && reportRef.current) {
      const { embedToken, embedUrl, reportId } = reportConfig;

      const powerbiService = new service.Service(
        factories.hpmFactory,
        factories.wpmpFactory,
        factories.routerFactory
      );

      powerbiService.reset(reportRef.current);

      const config = {
        type: 'report',
        id: reportId,
        embedUrl: embedUrl,
        accessToken: embedToken,
        tokenType: models.TokenType.Embed,
        permissions: models.Permissions.All,
        settings: {
          panes: {
            filters: { visible: false },
            pageNavigation: { visible: true }
          }
        }
      };

      powerbiService.embed(reportRef.current, config);
    }
  }, [reportConfig]);

  // Determine allowed reports
  const allowedReports = [];
 if (userRole === 'Manager' || userRole === 'Admin') {
    allowedReports.push('Galderma');
  } else if (userRole === 'VerticalLead') {
    allowedReports.push('Cockpit', 'MIS','Galderma'); // ✅ Added MIS option for VerticalLead
  }

  return (
    <div style={{ padding: '1rem' }}>
      {!selectedReport ? (
        <div>
          <h2>Select a report to view</h2>
          {allowedReports.map((report) => (
            <button
              key={report}
              onClick={() => setSelectedReport(report)}
              style={{
                margin: '0.5rem',
                padding: '0.5rem 1rem',
                fontSize: '1rem',
                cursor: 'pointer'
              }}
            >
              {report} Report
            </button>
          ))}
          {allowedReports.length === 0 && (
            <p>You do not have permission to view any reports.</p>
          )}
        </div>
      ) : (
        <div
          ref={reportRef}
          style={{ height: '120vh', width: '100%' }}
        />
      )}
    </div>
  );
};

export default PowerBiEmbed;
