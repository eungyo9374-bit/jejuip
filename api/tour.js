import { searchNearby, searchTour } from '../server/tour.js';

export default async function handler(req, res) {
  try {
    const { keyword = '', type = '12', lat, lng, radius } = req.query;
    if (lat && lng) return res.status(200).json(await searchNearby({ lat, lng, radius: radius || 5000, contentTypeId: type }));
    res.status(200).json(await searchTour({ keyword, contentTypeId: type }));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
