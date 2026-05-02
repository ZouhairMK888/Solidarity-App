const CampaignModel = require('../models/Campaign');
const MissionTaskModel = require('../models/MissionTask');

const compactText = (value, fallback = 'Not specified') => {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  return String(value).replace(/\s+/g, ' ').trim();
};

const formatDate = (value) => {
  if (!value) return 'Not specified';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return compactText(value);
  return date.toISOString().slice(0, 10);
};

const getClientBaseUrl = () => (
  process.env.CLIENT_URL || 'http://localhost:5174'
).replace(/\/$/, '');

const summarizeTask = (task) => ({
  title: compactText(task.title),
  description: compactText(task.description),
  status: compactText(task.status),
  required_volunteers: task.required_volunteers ?? 'Not specified',
  assigned_count: task.assigned_count ?? 0,
});

const summarizeMission = (mission) => ({
  title: compactText(mission.title),
  description: compactText(mission.description),
  status: compactText(mission.status),
  location: compactText(mission.location),
  date: formatDate(mission.mission_date),
  required_volunteers: mission.required_volunteers ?? 'Not specified',
  assigned_count: mission.assigned_count ?? 0,
  tasks: (mission.tasks || []).map(summarizeTask),
});

const summarizeOrganizer = (organizer) => ({
  name: compactText(organizer.name),
  role: compactText(organizer.role),
  email: compactText(organizer.email),
  phone: compactText(organizer.phone),
});

const buildAssistantKnowledge = async () => {
  const { campaigns } = await CampaignModel.findAll({ limit: 50 });
  const clientBaseUrl = getClientBaseUrl();

  const fullCampaigns = await Promise.all(
    campaigns.map(async (campaign) => {
      const detailedCampaign = await CampaignModel.findById(campaign.id);
      const missions = await CampaignModel.getMissions(campaign.id);
      const tasks = await MissionTaskModel.findByMissionIds(
        missions.map((mission) => mission.id),
        { excludeCancelled: true }
      );

      const tasksByMissionId = tasks.reduce((accumulator, task) => {
        const key = Number(task.mission_id);
        if (!accumulator[key]) accumulator[key] = [];
        accumulator[key].push(task);
        return accumulator;
      }, {});

      return {
        id: detailedCampaign.id,
        title: compactText(detailedCampaign.title),
        status: compactText(detailedCampaign.status),
        description: compactText(detailedCampaign.description),
        location: compactText(detailedCampaign.location),
        start_date: formatDate(detailedCampaign.start_date),
        end_date: formatDate(detailedCampaign.end_date),
        detail_url: `${clientBaseUrl}/campaigns/${detailedCampaign.id}`,
        organizer_application: {
          available: true,
          url: `${clientBaseUrl}/campaigns/${detailedCampaign.id}#become-organizer`,
          who_can_apply: 'Signed-in volunteer accounts can apply to organize this campaign.',
          required_fields: ['Motivation', 'Experience'],
          review_process: 'The campaign team reviews organizer requests after submission.',
        },
        organizer_name: compactText(detailedCampaign.organizer_name),
        organizer_email: compactText(detailedCampaign.organizer_email),
        organizers: (detailedCampaign.organizers || []).map(summarizeOrganizer),
        missions: missions.map((mission) => summarizeMission({
          ...mission,
          tasks: tasksByMissionId[Number(mission.id)] || [],
        })),
      };
    })
  );

  return {
    generated_at: new Date().toISOString(),
    campaign_count: fullCampaigns.length,
    campaigns: fullCampaigns,
  };
};

module.exports = {
  buildAssistantKnowledge,
};
