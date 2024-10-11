import React, { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import {
  ThemeProvider,
  CssBaseline,
  Container,
  Box,
  Typography,
  AppBar,
  Toolbar,
  Paper,
} from "@mui/material";
import { createTheme } from "@mui/material/styles";
import { Route, Routes, Link, useNavigate } from "react-router-dom";
import {
  saveStats,
  getAllStats,
  deleteStats,
  generateUniqueId,
} from "./utils/db";
import Stats from "./components/Stats";
import StatsList from "./components/StatsList";
import { StatsEntry } from "./types";
import TelegramIcon from "@mui/icons-material/Telegram";

const theme = createTheme();

function App() {
  const [savedStats, setSavedStats] = useState<StatsEntry[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadSavedStats = async () => {
      const stats = await getAllStats();
      setSavedStats(stats);
    };
    loadSavedStats();
  }, []);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        const fileContent = await file.text();
        const parsedStats = JSON.parse(fileContent);
        const newEntry: StatsEntry = {
          id: generateUniqueId(),
          name: file.name,
          date: new Date().toISOString(),
          data: parsedStats,
        };
        await saveStats(newEntry);
        setSavedStats((prevStats) => [...prevStats, newEntry]);
        navigate(`/stats/${newEntry.id}`);
      }
    },
    [navigate]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/json": [".json"] },
  });

  const handleDelete = async (id: string) => {
    await deleteStats(id);
    setSavedStats((prevStats) => prevStats.filter((stat) => stat.id !== id));
  };

  const handleUpdateStat = (updatedStat: StatsEntry) => {
    setSavedStats((prevStats) =>
      prevStats.map((stat) => (stat.id === updatedStat.id ? updatedStat : stat))
    );
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
      >
        <AppBar position="static">
          <Toolbar>
            <Typography
              variant="h6"
              component={Link}
              to="/"
              sx={{
                flexGrow: 1,
                textDecoration: "none",
                color: "inherit",
                display: "flex",
                alignItems: "center",
              }}
            >
              <TelegramIcon sx={{ mr: 1 }} /> Telegram Stats Viewer
            </Typography>
          </Toolbar>
        </AppBar>

        <Container component="main" sx={{ mt: 4, mb: 4, flex: 1 }}>
          <Routes>
            <Route
              path="/"
              element={
                <Box>
                  <Typography variant="h4" gutterBottom>
                    Upload Telegram Export
                  </Typography>
                  <Typography variant="body1">
                    To retrieve your Telegram export:
                    <ol>
                      <li>
                        Open{" "}
                        <a
                          href="https://desktop.telegram.org/"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Telegram Desktop
                        </a>
                      </li>
                      <li>
                        Go to Settings &gt; Advanced &gt; Export Telegram Data
                      </li>
                      <li>Choose "Machine-readable JSON" format</li>
                      <li>Select the data you want to export</li>
                      <li>
                        Click "Export" and wait for the process to complete
                      </li>
                      <li>Upload the resulting JSON file here</li>
                    </ol>
                  </Typography>
                  <Paper
                    {...getRootProps()}
                    sx={{
                      p: 3,
                      mb: 3,
                      backgroundColor: isDragActive
                        ? "action.hover"
                        : "background.paper",
                      border: "2px dashed",
                      borderColor: isDragActive ? "primary.main" : "grey.400",
                      cursor: "pointer",
                    }}
                  >
                    <input {...getInputProps()} />
                    <Typography>
                      {isDragActive
                        ? "Drop the Telegram export JSON file here"
                        : "Drag 'n' drop your Telegram export JSON file here, or click to select one"}
                    </Typography>
                  </Paper>
                  <StatsList
                    savedStats={savedStats}
                    onDelete={handleDelete}
                    onUpdate={handleUpdateStat}
                  />
                </Box>
              }
            />
            <Route path="/stats/:id" element={<Stats />} />
          </Routes>
        </Container>

        <Paper
          component="footer"
          sx={{ marginTop: "auto", py: 2 }}
          elevation={3}
        >
          <Container maxWidth="lg">
            <Typography variant="body2" color="text.secondary" align="center">
              © {new Date().getFullYear()} Telegram Stats Viewer. All rights
              reserved.
            </Typography>
          </Container>
        </Paper>
      </Box>
    </ThemeProvider>
  );
}

export default App;
