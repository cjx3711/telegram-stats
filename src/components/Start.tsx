import { Box, Paper, Typography } from "@mui/material";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useNavigate } from "react-router-dom";
import StatsList from "./StatsList";
import { StatsEntry } from "../types";
import { generateUniqueId, saveStats } from "../utils/db";
import { parseMessages } from "../utils/processData";

interface StartProps {
  savedStats: StatsEntry[];
  onDelete: (id: string) => void;
  onUpdate: (updatedStat: StatsEntry) => void;
}

function Start({ savedStats, onDelete, onUpdate }: StartProps) {
  const navigate = useNavigate();

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

        if (confirm("Open the new stats entry?")) {
          navigate(`/stats/${newEntry.id}`);
        }
      }
    },
    [navigate, onUpdate]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/json": [".json"] },
  });

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
          </li>
          <li>Click on the chat you want to export</li>
          <li>Click on the three dots on the top right</li>
          <li>Choose "Export chat history"</li>
          <li>Uncheck all the options</li>
          <li>Choose "Machine-readable JSON" format</li>
          <li>Click "Export" and wait for the process to complete</li>
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
          backgroundColor: isDragActive ? "action.hover" : "background.paper",
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
        onDelete={onDelete}
        onUpdate={onUpdate}
      />
    </Box>
  );
}

export default Start;
