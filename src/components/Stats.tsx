import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  ButtonGroup,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { Bar } from "react-chartjs-2";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TooltipItem,
  ChartData,
} from "chart.js";
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  addMonths,
  subWeeks,
  addWeeks,
  subDays,
  addDays,
  format,
  isBefore,
  isAfter,
  parseISO,
  fromUnixTime,
} from "date-fns";
import { getStats } from "../utils/db";
import { StatsEntry, ParsedMessage, Participant } from "../types";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Define display categories
enum DisplayCategory {
  Text = "Text",
  Media = "Media",
  Sticker = "Sticker",
  File = "File",
  Other = "Other",
}

type Bucket = {
  label: string;
  types: { [key in DisplayCategory]: number };
};

const Stats: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [stats, setStats] = useState<StatsEntry | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("day");
  const [chartData, setChartData] = useState<ChartData<"bar"> | null>(null);
  const [firstMessageDate, setFirstMessageDate] = useState<Date | null>(null);
  const [lastMessageDate, setLastMessageDate] = useState<Date | null>(null);
  const [splitBy, setSplitBy] = useState<"type" | "person">("type");
  const [mainPerson, setMainPerson] = useState<string | null>(null);
  const [otherPerson, setOtherPerson] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  useEffect(() => {
    const loadStats = async () => {
      if (id) {
        const loadedStats = await getStats(id);
        setParticipants(loadedStats?.data.participants || []);
        if (loadedStats && loadedStats.data.messages.length > 0) {
          setStats(loadedStats);
          const messages = loadedStats.data.messages;
          const firstMessage = messages[0];
          const lastMessage = messages[messages.length - 1];

          const firstDate = fromUnixTime(parseInt(firstMessage.date_unixtime));
          const lastDate = fromUnixTime(parseInt(lastMessage.date_unixtime));

          setFirstMessageDate(firstDate);
          setLastMessageDate(lastDate);
          setEndDate(lastDate);
        }
      }
    };
    loadStats();
  }, [id]);

  useEffect(() => {
    if (stats) {
      const persons = Array.from(
        new Set(stats.data.messages.map((m) => m.from))
      ).filter((p) => p !== undefined);
      setMainPerson(
        participants.find((p) => p.id === persons[0])?.name || null
      );
      setOtherPerson(
        participants.find((p) => p.id === persons[1])?.name || null
      );
    }
  }, [stats, participants]);

  const categorizeMessageForDisplay = (type: string): DisplayCategory => {
    switch (type) {
      case "text":
      case "link":
        return DisplayCategory.Text;
      case "image":
      case "video":
      case "gif":
      case "video_message":
        return DisplayCategory.Media;
      case "sticker":
        return DisplayCategory.Sticker;
      case "file":
        return DisplayCategory.File;
      default:
        return DisplayCategory.Other;
    }
  };

  const getColorForCategory = useCallback(
    (category: string) => {
      const colors = {
        [DisplayCategory.Text]: "rgba(255, 99, 132, 0.5)",
        [DisplayCategory.Media]: "rgba(54, 162, 235, 0.5)",
        [DisplayCategory.Sticker]: "rgba(255, 206, 86, 0.5)",
        [DisplayCategory.File]: "rgba(75, 192, 192, 0.5)",
        [DisplayCategory.Other]: "rgba(153, 102, 255, 0.5)",
        [mainPerson as string]: "rgba(75, 192, 192, 0.5)",
        [otherPerson as string]: "rgba(255, 159, 64, 0.5)",
      };
      return colors[category] || `hsl(${Math.random() * 360}, 70%, 50%)`;
    },
    [mainPerson, otherPerson]
  );

  const processDataForDisplay = useCallback(
    (
      messages: ParsedMessage[],
      end: Date,
      grouping: "day" | "week" | "month",
      splitByPerson: boolean
    ) => {
      let startDate: Date;
      let buckets: Array<{
        label: string;
        data: { [key: string]: number };
      }>;

      if (grouping === "month") {
        startDate = startOfMonth(subMonths(end, 11));
        buckets = Array.from({ length: 12 }, (_, i) => ({
          label: format(addMonths(startDate, i), "MMM yyyy"),
          data: Object.fromEntries(
            splitByPerson
              ? Array.from(new Set(messages.map((m) => m.from))).map(
                  (person) => [
                    participants.find((p) => p.id === person)?.name || person,
                    0,
                  ]
                )
              : Object.values(DisplayCategory).map((cat) => [cat, 0])
          ),
        }));
      } else {
        const periods = grouping === "day" ? 30 : 12;
        startDate = grouping === "day" ? subDays(end, 29) : subWeeks(end, 11);
        buckets = Array.from({ length: periods }, (_, i) => ({
          label: format(
            grouping === "day" ? addDays(startDate, i) : addWeeks(startDate, i),
            grouping === "day" ? "dd MMM" : "dd MMM yyyy"
          ),
          data: Object.fromEntries(
            splitByPerson
              ? Array.from(new Set(messages.map((m) => m.from))).map(
                  (person) => [
                    participants.find((p) => p.id === person)?.name || person,
                    0,
                  ]
                )
              : Object.values(DisplayCategory).map((cat) => [cat, 0])
          ),
        }));
      }

      messages.forEach((message) => {
        const messageDate = fromUnixTime(parseInt(message.date_unixtime));
        if (isAfter(messageDate, startDate) && isBefore(messageDate, end)) {
          let bucketIndex: number;
          if (grouping === "month") {
            bucketIndex =
              messageDate.getMonth() -
              startDate.getMonth() +
              (messageDate.getFullYear() - startDate.getFullYear()) * 12;
          } else {
            bucketIndex = Math.floor(
              (messageDate.getTime() - startDate.getTime()) /
                (grouping === "day"
                  ? 24 * 60 * 60 * 1000
                  : 7 * 24 * 60 * 60 * 1000)
            );
          }
          if (bucketIndex >= 0 && bucketIndex < buckets.length) {
            if (splitByPerson) {
              const messageFromName = participants.find(
                (p) => p.id === message.from
              )?.name;
              if (
                messageFromName === mainPerson ||
                messageFromName === otherPerson
              ) {
                buckets[bucketIndex].data[messageFromName]++;
              }
            } else {
              const category = categorizeMessageForDisplay(message.type);
              buckets[bucketIndex].data[category]++;
            }
          }
        }
      });

      const dataKeys = splitByPerson
        ? ([mainPerson, otherPerson].filter(Boolean) as string[])
        : Object.values(DisplayCategory);

      return {
        labels: buckets.map((b) => b.label),
        datasets: dataKeys.map((key) => ({
          label: key,
          data: buckets.map((b) => b.data[key] || 0),
          backgroundColor: getColorForCategory(key),
        })),
      };
    },
    [mainPerson, otherPerson, participants, getColorForCategory]
  );

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = parseISO(e.target.value);
    setEndDate(groupBy === "month" ? endOfMonth(newDate) : newDate);
  };

  const handleGroupByChange = (
    event: React.MouseEvent<HTMLElement>,
    newGroupBy: "day" | "week" | "month" | null
  ) => {
    if (newGroupBy !== null) {
      setGroupBy(newGroupBy);
    }
  };

  const handleSplitByChange = (
    event: React.MouseEvent<HTMLElement>,
    newSplitBy: "type" | "person" | null
  ) => {
    if (newSplitBy !== null) {
      setSplitBy(newSplitBy);
    }
  };

  const navigatePeriod = (direction: "prev" | "next") => {
    if (!endDate || !firstMessageDate || !lastMessageDate) return;

    let newDate: Date;

    switch (groupBy) {
      case "day":
        newDate =
          direction === "prev" ? subDays(endDate, 30) : addDays(endDate, 30);
        break;
      case "week":
        newDate =
          direction === "prev" ? subWeeks(endDate, 12) : addWeeks(endDate, 12);
        break;
      case "month":
        newDate =
          direction === "prev"
            ? subMonths(endDate, 12)
            : addMonths(endDate, 12);
        newDate = endOfMonth(newDate);
        break;
    }

    // Prevent navigating beyond data range
    if (direction === "prev" && isBefore(newDate, firstMessageDate)) {
      newDate =
        groupBy === "month" ? endOfMonth(firstMessageDate) : firstMessageDate;
    } else if (direction === "next" && isAfter(newDate, lastMessageDate)) {
      newDate =
        groupBy === "month" ? endOfMonth(lastMessageDate) : lastMessageDate;
    }

    setEndDate(newDate);
  };

  const options = {
    scales: {
      x: {
        stacked: splitBy === "type",
      },
      y: {
        stacked: splitBy === "type",
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          title: (tooltipItems: TooltipItem<"bar">[]) => {
            return `Data for ${tooltipItems[0].label}`;
          },
          label: (tooltipItem: TooltipItem<"bar">) => {
            const datasetLabel = tooltipItem.dataset.label || "";
            const value = tooltipItem.parsed.y;
            return `${datasetLabel}: ${value}`;
          },
          footer: (tooltipItems: TooltipItem<"bar">[]) => {
            let total = 0;
            tooltipItems.forEach((tooltipItem) => {
              total += tooltipItem.parsed.y;
            });
            return `Total: ${total}`;
          },
        },
      },
    },
  };

  useEffect(() => {
    if (stats && endDate) {
      const data = processDataForDisplay(
        stats.data.messages,
        endDate,
        groupBy,
        splitBy === "person"
      );
      setChartData(data);
    }
  }, [stats, endDate, groupBy, splitBy, processDataForDisplay]);

  if (!stats || !chartData || !endDate) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box sx={{ width: "100%" }}>
      <Button onClick={() => navigate("/")}>Back to Home</Button>
      <Typography variant="h4" gutterBottom>
        Stats for {stats.name}
      </Typography>
      <Box sx={{ display: "flex", gap: 2, mb: 2, alignItems: "center" }}>
        <IconButton
          onClick={() => navigatePeriod("prev")}
          disabled={
            !endDate ||
            (groupBy === "month"
              ? isBefore(
                  startOfMonth(subMonths(endDate, 11)),
                  firstMessageDate!
                )
              : isBefore(endDate, firstMessageDate!))
          }>
          <ChevronLeft />
        </IconButton>
        {groupBy === "month" ? (
          <Typography>{endDate && format(endDate, "MMMM yyyy")}</Typography>
        ) : (
          <input
            type="date"
            value={endDate ? format(endDate, "yyyy-MM-dd") : ""}
            onChange={handleEndDateChange}
            min={firstMessageDate ? format(firstMessageDate, "yyyy-MM-dd") : ""}
            max={lastMessageDate ? format(lastMessageDate, "yyyy-MM-dd") : ""}
          />
        )}
        <IconButton
          onClick={() => navigatePeriod("next")}
          disabled={
            !endDate ||
            (groupBy === "month"
              ? isAfter(endOfMonth(endDate), lastMessageDate!)
              : isAfter(endDate, lastMessageDate!))
          }>
          <ChevronRight />
        </IconButton>
        <ToggleButtonGroup
          value={groupBy}
          exclusive
          onChange={handleGroupByChange}
          aria-label="group by">
          <ToggleButton value="day" aria-label="day">
            Day
          </ToggleButton>
          <ToggleButton value="week" aria-label="week">
            Week
          </ToggleButton>
          <ToggleButton value="month" aria-label="month">
            Month
          </ToggleButton>
        </ToggleButtonGroup>
        <ToggleButtonGroup
          value={splitBy}
          exclusive
          onChange={handleSplitByChange}
          aria-label="split by">
          <ToggleButton value="type" aria-label="split by type">
            By Type
          </ToggleButton>
          <ToggleButton value="person" aria-label="split by person">
            By Person
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <Bar data={chartData} options={options} />
    </Box>
  );
};

export default Stats;
