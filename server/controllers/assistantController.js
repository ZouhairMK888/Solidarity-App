const { buildAssistantKnowledge } = require('../services/assistantKnowledgeService');

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MAX_MESSAGES = 12;
const MAX_MESSAGE_LENGTH = 1200;

const normalizeMessages = (messages) => {
  if (!Array.isArray(messages)) {
    return [];
  }

  return messages
    .filter((message) => ['user', 'assistant'].includes(message?.role) && typeof message.content === 'string')
    .slice(-MAX_MESSAGES)
    .map((message) => ({
      role: message.role,
      content: message.content.slice(0, MAX_MESSAGE_LENGTH),
    }));
};

const buildSystemPrompt = (knowledge) => `
You are Solidarity's volunteer assistant. You are a warm, natural AI chat assistant for volunteers.

You can handle normal conversation: greetings, small questions, language questions, and simple help requests. You can speak Arabic, French, English, or the language the user uses.

When the user asks about campaigns, missions, tasks, donation coordination, dates, locations, or organizer contacts, use only the campaign knowledge below. If a campaign detail is missing, say that it is not listed and suggest the closest next step, such as checking the campaign details page or contacting the listed organizer.

When the user asks how to apply as an organizer, which campaigns allow organizer applications, or says something like "campaigns to apply to be an organizer", do not say you lack information. This includes Arabic or French phrasing such as "هل هناك حملات للتقديم كمنظم", "العمل كمنظم", "devenir organisateur", or "postuler comme organisateur". Every campaign in the knowledge has a "Become an organizer" form on its detail page. Recommend specific active campaigns first, then draft/completed campaigns only if there are no active campaigns. Give the campaign title, status, location if listed, and the organizer application URL. Explain that they must sign in as a volunteer, open the campaign detail page, fill Motivation and Experience, and submit "Apply as organizer". Answer in the same language the user used.

Format campaign answers cleanly in Markdown:
- Put each campaign on its own numbered item.
- Put details on separate bullet lines under that campaign.
- Use Markdown links like [Campaign details](url).
- Keep paragraphs short. Avoid putting several campaigns in one long paragraph.

Keep answers friendly, brief, and practical. When helpful, recommend one or two specific campaigns or tasks. Do not repeat the same campaign answer unless the user asks for campaign information again.

Campaign knowledge:
${JSON.stringify(knowledge)}
`;

const fallbackReply = (knowledge, userText) => {
  const normalizedText = userText.toLowerCase();
  const activeCampaigns = knowledge.campaigns.filter((campaign) => campaign.status === 'active');
  const campaignsToShow = (activeCampaigns.length ? activeCampaigns : knowledge.campaigns).slice(0, 4);

  if (normalizedText.includes('donat') || normalizedText.includes('organizer') || normalizedText.includes('contact')) {
    const contacts = campaignsToShow.map((campaign) => {
      const organizer = campaign.organizers?.[0];
      const contact = organizer
        ? `${organizer.name}${organizer.email !== 'Not specified' ? ` at ${organizer.email}` : ''}`
        : `${campaign.organizer_name}${campaign.organizer_email !== 'Not specified' ? ` at ${campaign.organizer_email}` : ''}`;
      return `${campaign.title}: ${contact}`;
    });

    return `I can help with organizer contacts. ${contacts.join(' | ')}`;
  }

  if (normalizedText.includes('task') || normalizedText.includes('mission')) {
    const missionLines = campaignsToShow.flatMap((campaign) => (
      campaign.missions.slice(0, 2).map((mission) => {
        const taskTitles = mission.tasks.slice(0, 3).map((task) => task.title).join(', ') || 'tasks are not listed yet';
        return `${campaign.title} - ${mission.title}: ${taskTitles}`;
      })
    ));

    return missionLines.length
      ? `Here are some current mission options: ${missionLines.join(' | ')}`
      : 'I do not see mission tasks listed yet. Try opening a campaign detail page or checking again after organizers add tasks.';
  }

  return campaignsToShow.length
    ? `Here are campaigns I can help with: ${campaignsToShow.map((campaign) => `${campaign.title} (${campaign.status}, ${campaign.location})`).join(' | ')}. Ask me about tasks, dates, donations, or organizer contacts.`
    : 'I do not see any campaigns listed yet. Please check again after an organizer publishes one.';
};

const chatWithAssistant = async (req, res, next) => {
  try {
    const messages = normalizeMessages(req.body?.messages);

    if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
      return res.status(400).json({
        success: false,
        message: 'Send at least one user message.',
      });
    }

    const knowledge = await buildAssistantKnowledge();
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return res.status(200).json({
        success: true,
        data: {
          reply: fallbackReply(knowledge, messages[messages.length - 1].content),
          configured: false,
        },
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    let response;

    try {
      response = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.CLIENT_URL || 'http://localhost:5173',
          'X-Title': 'Solidarity Volunteer Assistant',
        },
        body: JSON.stringify({
          model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
          temperature: 0.3,
          max_tokens: 500,
          messages: [
            { role: 'system', content: buildSystemPrompt(knowledge) },
            ...messages,
          ],
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const details = await response.text();
      console.error('Assistant provider error:', details);
      return res.status(502).json({
        success: false,
        message: 'The assistant provider is unavailable right now.',
      });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return res.status(502).json({
        success: false,
        message: 'The assistant did not return an answer.',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        reply,
        configured: true,
      },
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      return res.status(504).json({
        success: false,
        message: 'The assistant took too long to answer.',
      });
    }

    next(error);
  }
};

module.exports = {
  chatWithAssistant,
};
