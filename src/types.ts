import { MessageType } from "./utils/processData";

export interface StatsEntry {
  id: string;
  name: string;
  date: string;
  data: {
    participants: Participant[];
    messages: ParsedMessage[];
    length: number;
    totalSpanMs: number;
    firstMessageTimestamp: number;
    lastMessageTimestamp: number;
  };
}

export interface Participant {
  id: string;
  name: string;
}

export interface ParsedMessage {
  date: string;
  date_unixtime: string;
  from: string;
  type: MessageType;
  character_count: number;
  word_count: number;
}
