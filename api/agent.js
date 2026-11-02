import Anthropic from '@anthropic-ai/sdk';
import { searchTour } from '../server/tour.js';
import { getWeather } from '../server/weather.js';
import { searchHeritage } from '../server/heritage.js';
import { getOlleCourses } from '../server/olle.js';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = 'claude-sonnet-5-5';

// ① 도구 설명서: Claude는 이 설명만 보고 "어떤 도구를 언제 쓸지" 결정한다
const tools = [
  {
    name: 'get_olle_courses',
    description: '제주올레 코스 현황(코스 번호·이름·거리·소요시간·시작/도착 지점·권역·날씨 기준 지역)을 조회한다. 올레 코스를 추천하거나 코스 정보를 물으면 가장 먼저 사용한다. keyword 로 코스 번호나 지명(예: 7코스, 광치기)을, maxKm 으로 최대 거리를 제한할 수 있다.',
    input_schema: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: '코스 번호나 지명 (예: 7코스, 쇠소깍, 우도)' },
        maxKm: { type: 'number', description: '이 거리(km) 이하의 코스만. 가볍게 걷고 싶을 때 사용' },
      },
    },
  },
  {
    name: 'search_tour_places',
    description: '한국관광공사 TourAPI로 올레 코스의 시작·도착 지점 주변 관광지·문화시설·축제·음식점을 검색한다. 지명(예: 광치기해변, 쇠소깍)이나 포구·해변·카페 같은 단어로 찾는다',
    input_schema: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: '검색어 (예: 해녀, 오름, 돌하르방)' },
        contentTypeId: { type: 'string', description: '12 관광지, 14 문화시설, 15 축제·행사, 39 음식점' },
      },
    },
  },
  {
    name: 'get_weather',
    description: '기상청 단기예보로 제주시/서귀포시의 앞으로 몇 시간 기온·하늘·강수를 조회한다. 코스를 추천하기 전에 그 코스의 weatherPlace 값으로 호출해 걷기 좋은지 확인한다',
    input_schema: {
      type: 'object',
      properties: { place: { type: 'string', enum: ['제주시', '서귀포시'] } },
      required: ['place'],
    },
  },
  {
    name: 'search_heritage',
    description: '국가유산청 API로 올레길 곁의 제주 국가유산(해안 연대·성곽·방사탑 등)을 이름으로 검색한다',
    input_schema: { type: 'object', properties: { keyword: { type: 'string' } } },
  },
];

// ② 도구 이름 → 실제 실행할 함수
const runTool = { get_olle_courses: getOlleCourses, search_tour_places: searchTour, get_weather: getWeather, search_heritage: searchHeritage };

const SYSTEM = `너는 '제주를 걷다'의 올레길 추천 도우미다. 트레킹을 좋아하는 관광객이 대상이다.
- 올레 코스 정보는 반드시 get_olle_courses 로, 날씨는 get_weather 로, 주변 명소·문화유산은 해당 도구로 확인한 뒤 답한다.
- 코스를 추천할 때는 먼저 코스를 조회하고, 그 코스의 weatherPlace 로 날씨를 확인한다.
- 도구 결과에 없는 코스·장소는 지어내지 않는다. 없으면 "결과가 없다"고 답한다.
- 비가 오거나 강수확률이 60% 이상이면 짧은 코스(maxKm 12 이하)나 실내 대안을 함께 제안한다.
- 기상청 예보는 제주시·서귀포시 기준이라 해안·산지와 다를 수 있음을 필요하면 알린다.
- 답은 한국어 한글로만 쓰고 한자·일본어 글자를 섞지 않는다.
- 답은 5문장 이내로 짧게.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const { message, history = [] } = req.body ?? {};
  const messages = [...history.slice(-10), { role: 'user', content: message }]; // 최근 10개만 보내 비용 절약
  const steps = []; // 화면에 "에이전트가 무엇을 했는지" 보여주기용

  try {
    // ③ 에이전트 루프: 생각 → 도구 호출 → 결과 확인 → (반복) → 최종 답
    for (let turn = 0; turn < 5; turn++) {
      const r = await client.messages.create({
        model: MODEL,
        max_tokens: 1024,
        system: SYSTEM,
        tools,
        messages,
      });

      if (r.stop_reason !== 'tool_use') {
        const answer = r.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n');
        return res.status(200).json({ answer, steps });
      }

      messages.push({ role: 'assistant', content: r.content }); // Claude의 도구 호출 요청을 대화에 기록
      const results = [];
      for (const block of r.content) {
        if (block.type !== 'tool_use') continue;
        let result;
        try { result = await runTool[block.name](block.input ?? {}); }
        catch (e) { result = { error: e.message }; }
        steps.push({ tool: block.name, args: block.input, count: Array.isArray(result) ? result.length : 0 });
        results.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(result) });
      }
      messages.push({ role: 'user', content: results }); // 도구 결과를 Claude에게 돌려줌
    }
    res.status(200).json({ answer: '도구 호출이 너무 많아 중단했어요. 질문을 좁혀 주세요.', steps });
  } catch (e) {
    // 자세한 오류는 서버 로그에만 남기고(키처럼 보이는 글자는 가려서), 화면에는 안전한 안내 문구만 보내요.
    // (오류 메시지에 인증 키가 그대로 들어 있는 경우가 있어서, 그대로 내보내면 키가 노출돼요)
    console.error('agent error', e.status, String(e.message).replace(/sk-[A-Za-z0-9_-]+/g, 'sk-***'));
    const status = Number.isInteger(e.status) && e.status >= 400 && e.status < 600 ? e.status : 500;
    const keyProblem = status === 401 || /header|authorization|api key/i.test(String(e.message));
    res.status(status).json({
      error: status === 429 ? '사용량이 많아요. 1분 뒤 다시 시도하세요.'
        : keyProblem ? '에이전트 키 설정에 문제가 있어요. 관리자에게 알려 주세요.'
        : '에이전트 호출 중 오류가 났어요. 잠시 뒤 다시 시도해 주세요.',
    });
  }
}
