import React from "react";
import {
  List,
  ListItem,
  ListItemText,
  Button,
  Typography,
  Box,
} from "@mui/material";
import { Link } from "react-router-dom";
import { StatsEntry } from "../types";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { saveStats } from "../utils/db";
import { calculateChatDuration } from "../utils/chatDuration";
import { format } from "date-fns";

interface StatsListProps {
  savedStats: StatsEntry[];
  onDelete: (id: string) => void;
  onUpdate: (updatedStat: StatsEntry) => void;
}

const StatsList: React.FC<StatsListProps> = ({
  savedStats,
  onDelete,
  onUpdate,
}) => {
  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this stat?")) {
      onDelete(id);
    }
  };

  const handleEdit = (stat: StatsEntry) => {
    const newName = window.prompt("Enter a new name for this stat:", stat.name);
    if (newName !== null && newName.trim() !== "") {
      const updatedStat = { ...stat, name: newName.trim() };
      saveStats(updatedStat).then(() => onUpdate(updatedStat));
    } else if (newName !== null) {
      alert("The name cannot be empty. The change was not saved.");
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Saved Stats ({savedStats.length})
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Note: All data is stored locally in your browser. If you clear your
        cache or cookies, this data will be lost.
      </Typography>
      {savedStats.length === 0 ? (
        <Typography>
          No saved stats available. Upload a new JSON file to see your stats
          here.
        </Typography>
      ) : (
        <List>
          {savedStats.map((stat) => (
            <ListItem key={stat.id}>
              <ListItemText
                primary={stat.name}
                secondary={`${format(new Date(stat.date), "yyyy-MM-dd")} · ${
                  stat.data.length
                } messages · ${calculateChatDuration(stat.data.totalSpanMs)}`}
              />
              <Button
                component={Link}
                to={`/stats/${stat.id}`}
                startIcon={<VisibilityIcon />}>
                View
              </Button>
              <Button onClick={() => handleEdit(stat)} startIcon={<EditIcon />}>
                Rename
              </Button>
              <Button
                onClick={() => handleDelete(stat.id)}
                color="error"
                startIcon={<DeleteIcon />}>
                Delete
              </Button>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

export default StatsList;
