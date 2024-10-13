import { Info } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Tooltip,
  Typography,
} from "@mui/material";
import { format } from "date-fns";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useNavigate } from "react-router-dom";
import { StatsEntry } from "../types";
import { generateUniqueId, saveStats } from "../utils/db";
import { parseMessages } from "../utils/processData";
import StatsList from "./StatsList";

interface StartProps {
  savedStats: StatsEntry[];
  onDelete: (id: string) => void;
  onUpdate: (updatedStat: StatsEntry) => void;
  onReload: () => void;
}

function Start({ savedStats, onDelete, onUpdate, onReload }: StartProps) {
  const navigate = useNavigate();
  const [latestStat, setLatestStat] = useState<StatsEntry | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        setIsProcessing(true);
        try {
          const fileContent = await file.text();
          const parsedStats = JSON.parse(fileContent);

          if (parsedStats.type !== "personal_chat") {
            alert("This tool only supports personal chats for now.");
            return;
          }

          if (
            !parsedStats.name ||
            !parsedStats.type ||
            !parsedStats.id ||
            !parsedStats.messages
          ) {
            alert("Invalid file format.");
            return;
          }

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

          await saveStats(newEntry);
          onUpdate(newEntry);
          setLatestStat(newEntry);
          onReload();
        } catch (error) {
          console.error("Error processing file:", error);
          alert("An error occurred while processing the file.");
        } finally {
          setIsProcessing(false);
        }
      }
    },
    [onUpdate, onReload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/json": [".json"] },
    disabled: isProcessing,
  });

  const formatDate = (timestamp: number) => {
    return format(new Date(timestamp), "yyyy-MM-dd");
  };

  const formatDuration = (ms: number) => {
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    return `${days} days`;
  };

  return (
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
            <Tooltip title="Only telegram desktop allows JSON exports. And that way you can be sure we have no way to secretly access your data.">
              <Chip
                label="Why?"
                sx={{ ml: 1, verticalAlign: "middle", cursor: "help" }}
                size="small"
              />
            </Tooltip>
          </li>
          <li>Click on the chat you want to export</li>
          <li>Click on the three dots on the top right</li>
          <li>Choose "Export chat history"</li>
          <li>Uncheck all the options</li>
          <li>
            Choose "Machine-readable JSON" format near the "Format" word at the
            bottom highlighted in blue
          </li>
          <li>Click "Export" and wait for the process to complete</li>
          <li>Upload the result.json file here</li>
        </ol>
      </Typography>
      <Alert icon={<Info />} severity="info">
        Note: This only supports personal chats for now.
      </Alert>
      <Paper
        {...getRootProps()}
        sx={{
          p: 3,
          my: 3,
          minHeight: "200px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: isDragActive ? "action.hover" : "background.paper",
          border: "2px dashed",
          borderColor: isDragActive ? "primary.main" : "grey.400",
          cursor: isProcessing ? "not-allowed" : "pointer",
          opacity: isProcessing ? 0.7 : 1,
        }}>
        <input {...getInputProps()} />
        {isProcessing ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography>Processing file...</Typography>
          </Box>
        ) : (
          <Typography>
            {isDragActive
              ? "Drop the Telegram export JSON file here"
              : "Drag 'n' drop your Telegram export JSON file here, or click to select one"}
          </Typography>
        )}
      </Paper>
      {latestStat && (
        <Box
          sx={{
            mt: 2,
            p: 2,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
          }}>
          <Typography variant="h6" gutterBottom>
            Processing completed!
          </Typography>
          <Typography>Chat Name: {latestStat.name}</Typography>
          <Typography>Number of Messages: {latestStat.data.length}</Typography>
          <Typography>
            Time Span: {formatDate(latestStat.data.firstMessageTimestamp)} -{" "}
            {formatDate(latestStat.data.lastMessageTimestamp)} (
            {formatDuration(latestStat.data.totalSpanMs)})
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate(`/stats/${latestStat.id}`)}
            sx={{ mt: 2 }}>
            View Full Stats
          </Button>
        </Box>
      )}
      <Divider sx={{ my: 6 }} />
      <StatsList
        savedStats={savedStats}
        onDelete={onDelete}
        onUpdate={onUpdate}
      />
    </Box>
  );
}

export default Start;
