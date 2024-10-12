import TelegramIcon from "@mui/icons-material/Telegram";
import {
  AppBar,
  Box,
  Container,
  CssBaseline,
  Paper,
  ThemeProvider,
  Toolbar,
  Typography,
} from "@mui/material";
import { createTheme } from "@mui/material/styles";
import { useEffect, useState, useCallback } from "react";
import { Link, Route, Routes } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import Start from "./components/Start";
import Stats from "./components/Stats";
import { StatsEntry } from "./types";
import { deleteStats, getAllStats } from "./utils/db";

const theme = createTheme();

function App() {
  const [savedStats, setSavedStats] = useState<StatsEntry[]>([]);

  const loadSavedStats = useCallback(async () => {
    const stats = await getAllStats();
    setSavedStats(stats);
  }, []);

  useEffect(() => {
    loadSavedStats();
  }, [loadSavedStats]);

  const handleDelete = async (id: string) => {
    await deleteStats(id);
    setSavedStats((prevStats) => prevStats.filter((stat) => stat.id !== id));
  };

  const handleUpdateStat = (updatedStat: StatsEntry) => {
    setSavedStats((prevStats) => {
      const existingStatIndex = prevStats.findIndex(
        (stat) => stat.id === updatedStat.id
      );
      if (existingStatIndex >= 0) {
        // Update existing stat
        return prevStats.map((stat) =>
          stat.id === updatedStat.id ? updatedStat : stat
        );
      } else {
        // Add new stat
        return [...prevStats, updatedStat];
      }
    });
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
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
              }}>
              <TelegramIcon sx={{ mr: 1 }} /> Telegram Stats Viewer
            </Typography>
          </Toolbar>
        </AppBar>

        <Container component="main" sx={{ mt: 4, mb: 4, flex: 1 }}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route
              path="/start"
              element={
                <Start
                  savedStats={savedStats}
                  onDelete={handleDelete}
                  onUpdate={handleUpdateStat}
                  onReload={loadSavedStats}
                />
              }
            />
            <Route path="/stats/:id" element={<Stats />} />
          </Routes>
        </Container>

        <Paper
          component="footer"
          sx={{ marginTop: "auto", py: 2 }}
          elevation={3}>
          <Container maxWidth="lg">
            <Typography variant="body2" color="text.secondary" align="center">
              © {new Date().getFullYear()} Telegram Stats Viewer.
              <br />
              Made haphazardly by{" "}
              <a
                href="https://github.com/cjx3711"
                target="_blank"
                rel="noopener noreferrer">
                CJX3711
              </a>
              .
            </Typography>
          </Container>
        </Paper>
      </Box>
    </ThemeProvider>
  );
}

export default App;
