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
import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Link, Route, Routes, useNavigate } from "react-router-dom";
import Stats from "./components/Stats";
import StatsList from "./components/StatsList";
import { StatsEntry } from "./types";
import {
  deleteStats,
  generateUniqueId,
  getAllStats,
  saveStats,
} from "./utils/db";
import { parseMessages } from "./utils/processData";

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

        if (parsedStats.type !== "personal_chat") {
          alert("This tool only supports personal chats for now.");
          return;
        }

        // Check that the keys name, type, id, messages exist
        if (
          !parsedStats.name ||
          !parsedStats.type ||
          !parsedStats.id ||
          !parsedStats.messages
        ) {
          alert("Invalid file format.");
          return;
        }

        // Check that the messages array is not empty
        if (parsedStats.messages.length === 0) {
          alert("No messages found in the file.");
          return;
        }

        const {
          participants,
          messages,
          totalSpanMs,
          firstMessageTimestamp,
          lastMessageTimestamp,
        } = parseMessages(parsedStats.messages);

        console.log(totalSpanMs, firstMessageTimestamp, lastMessageTimestamp);
        // Get the name from the file
        const newEntry: StatsEntry = {
          id: generateUniqueId(),
          name: parsedStats.name,
          date: new Date().toISOString(),
          data: {
            participants,
            messages,
            length: messages.length,
            totalSpanMs,
            firstMessageTimestamp,
            lastMessageTimestamp,
          },
        };

        console.log(newEntry);

        await saveStats(newEntry);
        setSavedStats((prevStats) => [...prevStats, newEntry]);

        if (confirm("Open the new stats entry?")) {
          navigate(`/stats/${newEntry.id}`);
        }
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
                          rel="noopener noreferrer">
                          Telegram Desktop
                        </a>
                      </li>
                      <li>Click on the chat you want to export</li>
                      <li>Click on the three dots on the top right</li>
                      <li>Choose "Export chat history"</li>
                      <li>Uncheck all the options</li>
                      <li>Choose "Machine-readable JSON" format</li>
                      <li>
                        Click "Export" and wait for the process to complete
                      </li>
                      <li>Upload the result.json file here</li>
                    </ol>
                  </Typography>
                  <Typography variant="body1">
                    Note: This only supports personal chats for now. <br />
                    This tool is not affiliated with Telegram in any way.
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
                    }}>
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
          elevation={3}>
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
