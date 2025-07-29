const { createPublicApiClient } = require('./api'); 

const getDrivesSettings = async () => {
  try {
    const api = createPublicApiClient();
    const res = await api.get('/settings');
    return res.data;
  } catch (err) {
    console.error("Failed to fetch drive settings:", err.message);
    return null;
  }
};

module.exports = {
  getDrivesSettings,
};
