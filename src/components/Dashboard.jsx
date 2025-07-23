import React, { useEffect, useState } from 'react';
import axios from 'axios';
import jsPDF from "jspdf";
import "jspdf-autotable";

import AOS from 'aos';
import 'aos/dist/aos.css';

AOS.init();

const AdminLogs = () => {
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await axios.get('/api/logs');
      console.log("Fetched logs:", response.data);

      // Handle both cases: response is array or object with logs array
      const logsArray = Array.isArray(response.data)
        ? response.data
        : response.data.logs;

      setLogs(Array.isArray(logsArray) ? logsArray : []);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      setLogs([]); // Ensure logs is always an array
    }
  };

  const exportCSV = () => {
    const csvContent = [
      ['#', 'VIN', 'Location', 'Timestamp', 'IP'],
      ...logs.map((log, index) => [
        index + 1,
        log.vin,
        log.location,
        new Date(log.timestamp).toLocaleString(),
        log.ip
      ])
    ].map(e => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'vin_logs.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text('VIN Scan Logs', 14, 10);
    const tableData = logs.map((log, index) => [
      index + 1,
      log.vin,
      log.location,
      new Date(log.timestamp).toLocaleString(),
      log.ip
    ]);
    doc.autoTable({
      head: [['#', 'VIN', 'Location', 'Timestamp', 'IP']],
      body: tableData
    });
    doc.save('vin_logs.pdf');
  };

  const filteredLogs = logs.filter(log =>
    log.vin.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const visibleLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Admin Logs Dashboard</h2>

      <div className="flex flex-col md:flex-row justify-between items-center gap-2 mb-4" data-aos="fade-down">
        <input
          type="text"
          placeholder="Search by VIN or Location"
          className="p-2 border rounded w-full md:w-1/2"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />

        <div className="flex gap-2 mt-2 md:mt-0">
          <button onClick={exportCSV} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">Export CSV</button>
          <button onClick={exportPDF} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded">Export PDF</button>
        </div>
      </div>

      <div className="overflow-x-auto" data-aos="fade-up">
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 border">#</th>
              <th className="p-2 border">VIN</th>
              <th className="p-2 border">Location</th>
              <th className="p-2 border">Timestamp</th>
              <th className="p-2 border">IP</th>
            </tr>
          </thead>
          <tbody>
            {visibleLogs.map((log, index) => (
              <tr key={index} className="hover:bg-gray-100">
                <td className="p-2 border">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                <td className="p-2 border">{log.vin}</td>
                <td className="p-2 border">{log.location}</td>
                <td className="p-2 border">{new Date(log.timestamp).toLocaleString()}</td>
                <td className="p-2 border">{log.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-center items-center gap-4" data-aos="fade-in">
        <button
          className="px-3 py-1 bg-blue-400 text-white rounded disabled:opacity-50"
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span>Page {currentPage} of {totalPages}</span>
        <button
          className="px-3 py-1 bg-blue-400 text-white rounded disabled:opacity-50"
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default AdminLogs;
