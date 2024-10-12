import { Participant, ParsedMessage } from "../types";

export enum MessageType {
  Text = "text",
  Image = "image",
  Video = "video",
  Sticker = "sticker",
  Gif = "gif",
  File = "file",
  Link = "link",
  Location = "location",
  PhoneCall = "phone_call",
  PinMessage = "pin_message",
  Contact = "contact",
  VideoMessage = "video_message",
  VoiceMessage = "voice_message",
  Unknown = "unknown",
}

export type RawMessage = {
  id: number;
  type: string;
  date: string;
  date_unixtime: string;
  from: string;
  from_id: string;
  text?: string;
  text_entities?: {
    type: string;
    text: string;
  }[];
  action?: string;
  location_information?: unknown;
  contact_information?: unknown;
  photo?: string;
  file?: string;
  file_name?: string;
  thumbnail?: string;
  media_type?: string;
  mime_type?: string;
  sticker_emoji?: string;
  width?: number;
  height?: number;
  duration_seconds?: number;
};
export function parseMessages(messages: RawMessage[]): {
  participants: Participant[];
  messages: ParsedMessage[];
  totalSpanMs: number;
  firstMessageTimestamp: number;
  lastMessageTimestamp: number;
} {
  const participants: { [key: string]: Participant } = {};
  let firstMessageTimestamp = Number.MAX_SAFE_INTEGER;
  let lastMessageTimestamp = 0;

  const determineMessageType = (message: RawMessage): MessageType => {
    if (message.media_type === "sticker") return MessageType.Sticker;
    if (message.media_type === "animation") return MessageType.Gif;
    if (message.media_type === "video_message") return MessageType.VideoMessage;
    if (message.media_type === "voice_message") return MessageType.VoiceMessage;
    if (message.action === "phone_call") return MessageType.PhoneCall;
    if (message.action === "pin_message") return MessageType.PinMessage;
    if (message.contact_information) return MessageType.Contact;
    if (message.location_information) return MessageType.Location;
    if (message.photo?.includes("not included")) return MessageType.Image;
    if (message.mime_type?.startsWith("image/")) return MessageType.Image;
    if (message.mime_type?.startsWith("video/")) return MessageType.Video;
    if (message.file) return MessageType.File;
    if (message.text_entities?.some((entity) => entity.type === "link"))
      return MessageType.Link;
    if (message.text) return MessageType.Text;
    return MessageType.Unknown;
  };

  const countWords = (text: string | undefined): number => {
    if (typeof text !== "string") return 0;
    return text.trim().split(/\s+/).length;
  };
  const parsedMessages = messages.map((message) => {
    // Normalize participant
    if (!participants[message.from_id]) {
      participants[message.from_id] = {
        id: message.from_id,
        name: message.from,
      };
    }

    const type = determineMessageType(message);
    const text = typeof message.text === "string" ? message.text : "";
    const timestamp = parseInt(message.date_unixtime, 10) * 1000; // Convert to milliseconds

    firstMessageTimestamp = Math.min(firstMessageTimestamp, timestamp);
    lastMessageTimestamp = Math.max(lastMessageTimestamp, timestamp);

    return {
      date: message.date,
      date_unixtime: message.date_unixtime,
      from: message.from_id,
      type,
      character_count: text.length,
      word_count: countWords(text),
    };
  });

  const totalSpanMs = lastMessageTimestamp - firstMessageTimestamp;

  return {
    participants: Object.values(participants),
    messages: parsedMessages,
    totalSpanMs,
    firstMessageTimestamp,
    lastMessageTimestamp,
  };
}
