import Anthropic from "@anthropic-ai/sdk";
import { agencyContext, allContext, reportContext } from "@/lib/ai-context";

export const maxDuration = 120;

const MODEL = "claude-opus-5-5";

const BASE = `당신은 CS시스템(주)의 국가기관 네트워크망 유지보수 기술지원 담당자를 돕는 AI입니다.
제공된 점검·작업 기록만 근거로 한국어로 답합니다. 기록에 없는 사실은 추측하지 말고 "기록 없음"이라고 말합니다.
결과는 화면과 인쇄물에 그대로 표시되므로 마크다운 기호(#, *, |, 표)를 쓰지 말고, "■ 제목" 형식의 소제목과 "- " 목록, 짧은 문장만 사용합니다.
IP 주소, 계정, 비밀번호 같은 민감 정보는 요구하거나 만들어내지 않습니다.`;

const PROMPTS = {
  agency: `${BASE}

요청: 아래 기관의 점검·작업 이력을 분석해 다음 순서로 정리하세요.
■ 요약 (2~3문장)
■ 반복되거나 주의할 이상 (장비·항목별, 발생 날짜 포함)
■ 다음 정기점검 때 중점 확인할 항목
■ 미완료·지연 작업과 권고 조치
기록이 적으면 그 사실을 밝히고 확인 가능한 범위에서만 씁니다. 전체 20줄 이내.`,
  report: `${BASE}

요청: 기관에 제출하는 월간 네트워크 정기점검 보고서의 "종합 의견"을 작성하세요.
공문서 어조(~함, ~임)로, 다음 순서로 씁니다.
■ 점검 결과 요약
■ 이상 사항 및 조치 내용
■ 권고 사항
이번 달 정기점검이 없으면 "해당 월 완료된 정기점검 없음"이라고만 씁니다. 전체 12줄 이내.`,
  ask: `${BASE}

요청: 직원의 질문에 기록을 근거로 답하세요. 관련 기록의 날짜·기관·장비를 함께 밝히고, 필요하면 점검·조치 권고를 덧붙입니다. 간결하게 답합니다.`,
};

type Body = { mode?: string; agencyId?: string; month?: string; question?: string };

const UUID = /^[0-9a-f-]{36}$/i;
const bad = (msg: string, status = 400) => new Response(msg, { status, headers: { "Content-Type": "text/plain; charset=utf-8" } });

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) return bad("AI 기능이 설정되지 않았습니다 (ANTHROPIC_API_KEY 없음).", 503);

  const body = (await request.json().catch(() => ({}))) as Body;
  let system: string, content: string;
  try {
    if (body.mode === "agency" && body.agencyId && UUID.test(body.agencyId)) {
      system = PROMPTS.agency;
      content = await agencyContext(body.agencyId);
    } else if (body.mode === "report" && body.agencyId && UUID.test(body.agencyId) && /^\d{4}-\d{2}$/.test(body.month ?? "")) {
      system = PROMPTS.report;
      content = await reportContext(body.agencyId, body.month!);
    } else if (body.mode === "ask" && body.question?.trim()) {
      const q = body.question.trim();
      if (q.length > 500) return bad("질문은 500자 이내로 입력하세요.");
      system = PROMPTS.ask;
      content = `${await allContext()}\n\n## 질문\n${q}`;
    } else {
      return bad("잘못된 요청입니다.");
    }
  } catch (e) {
    return bad("기록을 불러오지 못했습니다: " + (e as Error).message, 500);
  }

  const client = new Anthropic();
  const stream = client.beta.messages.stream({
    model: MODEL,
    max_tokens: 8000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "medium" },
    system,
    messages: [{ role: "user", content }],
  });

  const enc = new TextEncoder();
  const out = new ReadableStream<Uint8Array>({
    async start(controller) {
      stream.on("text", (t) => controller.enqueue(enc.encode(t)));
      try {
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal") controller.enqueue(enc.encode("\n\n(AI가 이 요청에는 답하지 않았습니다.)"));
        else if (final.stop_reason === "max_tokens") controller.enqueue(enc.encode("\n\n(응답이 길어 중간에 끊겼습니다.)"));
      } catch (e) {
        let msg = "AI 응답 중 오류가 발생했습니다.";
        if (e instanceof Anthropic.AuthenticationError) msg = "AI API 키가 올바르지 않습니다.";
        else if (e instanceof Anthropic.RateLimitError) msg = "AI 요청이 많습니다. 잠시 후 다시 시도하세요.";
        else if (e instanceof Anthropic.APIError) msg = `AI 오류 (${e.status}): ${e.message}`;
        controller.enqueue(enc.encode(`\n\n[오류] ${msg}`));
      }
      controller.close();
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(out, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
}
