import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Box, Typography, Button } from "@mui/material";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { getStats } from "../utils/db";
import { StatsEntry } from "../types";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Stats: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [stats, setStats] = useState<StatsEntry | null>(null);

  const getDefaultDates = () => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 2);
    return {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
    };
  };

  const [startDate, setStartDate] = useState(
    searchParams.get("start") || getDefaultDates().start
  );
  const [endDate, setEndDate] = useState(
    searchParams.get("end") || getDefaultDates().end
  );

  useEffect(() => {
    const loadStats = async () => {
      if (id) {
        const loadedStats = await getStats(id);
        if (loadedStats) {
          setStats(loadedStats);
        }
      }
    };
    loadStats();
  }, [id]);

  useEffect(() => {
    setSearchParams({ start: startDate, end: endDate });
  }, [startDate, endDate, setSearchParams]);

  if (!stats) {
    return <Typography>Loading...</Typography>;
  }

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value);
  };

  // TODO: Process stats.data to create chart data
  const chartData = {
    labels: ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7"],
    datasets: [
      {
        label: "Text Messages",
        data: [12, 19, 3, 5, 2, 3, 10],
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.5)",
      },
      {
        label: "GIFs",
        data: [2, 3, 1, 4, 2, 6, 3],
        borderColor: "rgb(53, 162, 235)",
        backgroundColor: "rgba(53, 162, 235, 0.5)",
      },
      {
        label: "Images",
        data: [5, 7, 2, 8, 4, 3, 6],
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.5)",
      },
    ],
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Button onClick={() => navigate("/")}>Back to Home</Button>
      <Typography variant="h4" gutterBottom>
        Stats for {stats.name}
      </Typography>
      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <input type="date" value={startDate} onChange={handleStartDateChange} />
        <input type="date" value={endDate} onChange={handleEndDateChange} />
      </Box>
      <Line data={chartData} />
    </Box>
  );
};

export default Stats;
