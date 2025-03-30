// Regex patterns for parsing mentions and topics
export const MENTION_REGEX = /@([a-zA-Z0-9._]+)/g;
export const TOPIC_REGEX = /#(\w+)/g;

// Function to extract mentions from content
export const extractMentions = (content: string): string[] => {
  const matches = content.match(MENTION_REGEX) || [];
  return matches.map((match) => match.slice(1)); // Remove @ symbol
};

// Function to extract topics from content
export const extractTopics = (content: string): string[] => {
  const matches = content.match(TOPIC_REGEX) || [];
  return matches.map((match) => match.slice(1)); // Remove # symbol
};

// Function to split content into parts for rendering
export const splitContent = (content: string): string[] => {
  return content.split(/(@[a-zA-Z0-9._]+)|(#\w+)|(\s+)/).filter(Boolean);
};

// Function to check if a part is a mention
export const isMention = (part: string): boolean => {
  return part.startsWith('@');
};

// Function to check if a part is a topic
export const isTopic = (part: string): boolean => {
  return part.startsWith('#');
};

// Function to get username from a mention part
export const getUsernameFromMention = (part: string): string => {
  return part.slice(1); // Remove @ symbol
};

// Function to get topic name from a topic part
export const getTopicFromPart = (part: string): string => {
  return part.slice(1); // Remove # symbol
};
