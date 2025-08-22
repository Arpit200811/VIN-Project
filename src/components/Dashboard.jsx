import React, { useEffect, useState } from "react";
import axios from "axios";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

// ✅ Corrected path - use alias or relative
// import { button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";

import { toast } from "react-toastify";
import { format } from "date-fns";
import jsPDF from "jspdf";
import "jspdf-autotable";
import AOS from "aos";
import "aos/dist/aos.css";
// import VINClassifier from "./VINClassifier"; // Make sure this file exists

// const API = import.meta.env.VITE_API_URL;
const COLORS = ["#0088FE", "#00C49F"]; // metal, paper

AOS.init();

const AdminLogs = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API}/vin/logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setLogs(res.data);
      console.log(setLogs);
      setFilteredLogs(res.data);
    } catch (err) {
      toast.error("Failed to load logs");
    }
  };

  const handleSearch = () => {
    let filtered = [...logs];
    if (search) {
      filtered = filtered.filter(
        (log) =>
          log.vin.toLowerCase().includes(search.toLowerCase()) ||
          log.location?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (filterDate) {
      filtered = filtered.filter(
        (log) => log.date?.slice(0, 10) === filterDate
      );
    }
    if (filterLocation) {
      filtered = filtered.filter((log) =>
        log.location?.toLowerCase().includes(filterLocation.toLowerCase())
      );
    }
    setFilteredLogs(filtered);
    setCurrentPage(1);
  };

  const exportCSV = () => {
    const headers = "VIN,Type,Date,Location,IP\n";
    const rows = filteredLogs
      .map(
        (log) =>
          `${log.vin},${log.materialType},${log.date},${log.location},${log.ip}`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "vin_logs.csv";
    link.click();
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("VIN Scan Logs", 14, 10);
    const tableData = filteredLogs.map((log, index) => [
      index + 1,
      log.vin,
      log.materialType,
      log.location,
      log.date ? format(new Date(log.date), "dd-MM-yyyy") : "",
      log.ip,
    ]);
    doc.autoTable({
      head: [["#", "VIN", "Type", "Location", "Date", "IP"]],
      body: tableData,
    });
    doc.save("vin_logs.pdf");
  };

  const deleteLog = async (id) => {
    if (!window.confirm("Are you sure to delete this log?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API}/vin/logs/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Log deleted");
      fetchLogs();
    } catch (err) {
      toast.error("Failed to delete log");
    }
  };

 const chartData = [
  {
    name: "Metal",
    value: filteredLogs.filter((log) => log.materialType === "metal").length,
  },
  {
    name: "Paper",
    value: filteredLogs.filter((log) => log.materialType === "paper").length,
  },
];



  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const visibleLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid md:grid-cols-4 gap-4 mb-4" data-aos="fade-down">
        <input
  className="border p-2 rounded w-full"
  placeholder="Search by VIN or Location"
  value={search}
  onChange={(e) => setSearch(e.target.value)}
/>
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
        />
        <input
          placeholder="Location"
          value={filterLocation}
          onChange={(e) => setFilterLocation(e.target.value)}
        />
        <button onClick={handleSearch}>Filter</button>
      </div>

      <div className="mb-4 flex gap-2" data-aos="fade-up">
        <button onClick={exportCSV}>Export to CSV</button>
        <button variant="destructive" onClick={exportPDF}>
          Export to PDF
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div
          className="overflow-x-auto max-h-[500px] border rounded-lg"
          data-aos="fade-up"
        >
          <table className="table-auto w-full text-left text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2">#</th>
                <th className="p-2">VIN</th>
                <th className="p-2">Type</th>
                <th className="p-2">Date</th>
                <th className="p-2">Location</th>
                <th className="p-2">IP</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleLogs.map((log, index) => (
                <tr key={log._id} className="border-b hover:bg-gray-50">
                  <td className="p-2">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </td>
                  <td className="p-2">{log.vin}</td>
                  <td className="p-2">{log.materialType}</td>
                  <td className="p-2">
                    {log.date ? format(new Date(log.date), "dd-MM-yyyy") : ""}
                  </td>
                  <td className="p-2">{log.location}</td>
                  <td className="p-2">{log.ip}</td>
                  <td className="p-2">
                    <button
                      variant="destructive"
                      onClick={() => deleteLog(log._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {visibleLogs.length === 0 && (
                <tr>
                  <td colSpan="7" className="p-4 text-center">
                    No logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-center items-center" data-aos="zoom-in">
          <PieChart width={300} height={300}>
            <Pie
              dataKey="value"
              data={chartData}
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill="#8884d8"
              label
            >
              {chartData.map((entry, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </div>
      </div>

      <div
        className="mt-4 flex justify-center items-center gap-4"
        data-aos="fade-in"
      >
        <button
          className="px-3 py-1 bg-blue-400 text-white rounded disabled:opacity-50"
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button
          className="px-3 py-1 bg-blue-400 text-white rounded disabled:opacity-50"
          onClick={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>

      {/* <VINClassifier /> */}
    </div>
  );
};

export default AdminLogs;
