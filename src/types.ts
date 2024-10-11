export interface StatsEntry {
  id: string;
  name: string;
  date: string;
  data: {
    startDate?: string;
    endDate?: string;
    // Add other properties as needed based on your actual data structure
  };
}
