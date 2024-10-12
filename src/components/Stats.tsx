import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import {
  Box,
  Button,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import {
  BarElement,
  CategoryScale,
  ChartData,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
  TooltipItem,
} from "chart.js";
import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  endOfMonth,
  endOfYear,
  format,
  fromUnixTime,
  isAfter,
  isBefore,
  parseISO,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
  subWeeks,
  subYears,
} from "date-fns";
import React, { useCallback, useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { useNavigate, useParams } from "react-router-dom";
import { ParsedMessage, Participant, StatsEntry } from "../types";
import { getStats } from "../utils/db";

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

const Stats: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [stats, setStats] = useState<StatsEntry | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month" | "year">(
    "day"
  );
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
      grouping: "day" | "week" | "month" | "year",
      splitByPerson: boolean
    ) => {
      let startDate: Date;
      let buckets: Array<{
        label: string;
        data: { [key: string]: number };
      }>;

      if (grouping === "year") {
        startDate = startOfYear(subMonths(end, 35)); // Go back 3 years
        buckets = Array.from({ length: 36 }, (_, i) => ({
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
      } else if (grouping === "month") {
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
          if (grouping === "year" || grouping === "month") {
            bucketIndex =
              (messageDate.getFullYear() - startDate.getFullYear()) * 12 +
              messageDate.getMonth() -
              startDate.getMonth();
          } else {
            bucketIndex = Math.floor(
              (messageDate.getTime() - startDate.getTime()) /
                (grouping === "day"
                  ? 24 * 60 * 60 * 1000
                  : 7 * 24 * 60 * 60 * 1000)
            );
          }
          if (bucketIndex >= 0 && bucketIndex < buckets.length) {
            const messageFromName = participants.find(
              (p) => p.id === message.from
            )?.name;
            if (splitByPerson) {
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
        ? ([mainPerson, otherPerson].filter(
            Boolean
          ) as unknown as Participant[])
        : Object.values(DisplayCategory);

      return {
        labels: buckets.map((b) => {
          return b.label;
        }),
        datasets: dataKeys.map((key) => ({
          label: key instanceof Object ? key.name : key,
          data: buckets.map(
            (b) => b.data[key instanceof Object ? key.name : key] || 0
          ),
          backgroundColor: getColorForCategory(
            key instanceof Object ? key.name : key
          ),
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
    _: React.MouseEvent<HTMLElement>,
    newGroupBy: "day" | "week" | "month" | "year" | null
  ) => {
    if (newGroupBy !== null) {
      setGroupBy(newGroupBy);
    }
  };

  const handleSplitByChange = (
    _: React.MouseEvent<HTMLElement>,
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
          direction === "prev" ? subDays(endDate, 1) : addDays(endDate, 1);
        break;
      case "week":
        newDate =
          direction === "prev" ? subWeeks(endDate, 1) : addWeeks(endDate, 1);
        break;
      case "month":
        newDate =
          direction === "prev" ? subMonths(endDate, 1) : addMonths(endDate, 1);
        newDate = endOfMonth(newDate);
        break;
      case "year":
        newDate =
          direction === "prev" ? subYears(endDate, 1) : addYears(endDate, 1);
        newDate = endOfYear(newDate);
        break;
    }

    // Prevent navigating beyond data range
    if (direction === "prev" && isBefore(newDate, firstMessageDate)) {
      newDate =
        groupBy === "year" ? endOfYear(firstMessageDate) : firstMessageDate;
    } else if (direction === "next" && isAfter(newDate, lastMessageDate)) {
      newDate =
        groupBy === "year" ? endOfYear(lastMessageDate) : lastMessageDate;
    }

    setEndDate(newDate);
  };

  const options = {
    scales: {
      x: {
        stacked: splitBy === "type",
        ticks: {
          autoSkip: true,
          maxRotation: 90,
          minRotation: 0,
        },
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
            30 Days
          </ToggleButton>
          <ToggleButton value="week" aria-label="week">
            12 Weeks
          </ToggleButton>
          <ToggleButton value="month" aria-label="month">
            12 Months
          </ToggleButton>
          <ToggleButton value="year" aria-label="year">
            3 Years
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
