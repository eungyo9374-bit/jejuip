import { getOlleCourses } from '../server/olle.js';

export default async function handler(req, res) {
  try {
    const { keyword = '', maxKm = '0' } = req.query;
    res.status(200).json(await getOlleCourses({ keyword, maxKm }));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
