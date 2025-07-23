// src/components/Logs.jsx
import React, { useEffect, useState } from 'react';
import API from '../Utils/api';

export default function Logs() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const res = await API.get('/scan/logs');
        setLogs(res.data);
      } catch (err) {
        console.error('Error fetching logs:', err);
      }
    }
    fetchLogs();
  }, []);

  return (
    <div>
      <h2>Scan Logs</h2>
      <table border="1">
        <thead>
          <tr>
            <th>VIN</th>
            <th>Type</th>
            <th>Location</th>
            <th>IP</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((vinEntry, i) => (
  <div key={i} className="border p-4 my-2 bg-gray-100 rounded-md">
    <p><strong>VIN:</strong> {vinEntry.vin}</p>
    <ul>
      {vinEntry.scannedLogs.map((log, j) => (
        <li key={j}>
          📍 <b>Location:</b> {log.location} |
          🕒 <b>Time:</b> {new Date(log.timestamp).toLocaleString()} |
          🌐 <b>IP:</b> {log.ip}
        </li>
      ))}
    </ul>
  </div>
))}
        </tbody>
      </table>
    </div>
  );
}
