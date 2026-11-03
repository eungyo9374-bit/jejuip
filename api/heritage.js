import { listHeritageAll, searchHeritage, searchHeritageNear } from '../server/heritage.js';

export default async function handler(req, res) {
  try {
    const { keyword, lat, lng, radius, all } = req.query;
    if (all) return res.status(200).json(await listHeritageAll());
    if (lat && lng) return res.status(200).json(await searchHeritageNear({ lat, lng, radius: radius || 8000 }));
    res.status(200).json(await searchHeritage({ keyword }));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
