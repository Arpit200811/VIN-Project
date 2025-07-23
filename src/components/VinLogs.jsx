import React, { useEffect, useState } from "react";
import api from "../Utils/api";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function VinLogs() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get("/admin/logs").then((res) => setLogs(res.data));
  }, []);

  const handleExport = () => {
    const flatLogs = logs.flatMap((item) =>
      item.scannedLogs.map((log) => ({
        VIN: item.vin,
        IP: log.ip,
        Location: log.location,
        Time: new Date(log.timestamp).toLocaleString(),
      }))
    );
    const worksheet = XLSX.utils.json_to_sheet(flatLogs);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Logs");
    const blob = new Blob([XLSX.write(workbook, { bookType: "xlsx", type: "array" })]);
    saveAs(blob, "vin-logs.xlsx");
  };

  const filtered = logs.filter((item) =>
    item.vin.includes(search) ||
    item.scannedLogs.some((log) => log.location?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <h2>VIN Logs</h2>
      <input placeholder="Search VIN/Location" onChange={(e) => setSearch(e.target.value)} />
      <button onClick={handleExport}>Export to Excel</button>
      <ul>
        {filtered.map((item) => (
          <li key={item.vin}>
            <b>{item.vin}</b>
            <ul>
              {item.scannedLogs.map((log, i) => (
                <li key={i}>
                  {new Date(log.timestamp).toLocaleString()} - {log.location} - {log.ip}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}