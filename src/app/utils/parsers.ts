// Regex patterns for parsing mentions and topics
export const MENTION_REGEX =
  /@([a-zA-Z0-9._]+)|@([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/g;
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
  // First, split by spaces to preserve them
  const parts = content.split(/(\s+)/);

  // Then process each part to handle mentions and topics
  return parts.flatMap((part) => {
    if (part.trim() === '') return [part];

    // Check if the part is a mention (either username or UUID)
    if (part.startsWith('@')) {
      const isUUID = /^@[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(part);
      const isUsername = /^@[a-zA-Z0-9._]+$/.test(part);

      if (isUUID || isUsername) {
        return [part];
      }
    }

    // Check if the part is a topic
    if (part.startsWith('#')) {
      return [part];
    }

    // For regular text, split by mentions and topics
    return part
      .split(/(@[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|@[a-zA-Z0-9._]+|#\w+)/)
      .filter(Boolean);
  });
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
