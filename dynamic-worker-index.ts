import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
  Deno.env.get("SUPABASE_SECRET_KEY") ??
  "";
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") ?? "";
const WORKER_SECRET = Deno.env.get("LELLEE_AGENT_WORKER_SECRET") ?? "";
const MODEL = Deno.env.get("LELLEE_AGENT_MODEL") ?? "gpt-5.6-luna";

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });

const readSetting = async (key: string) => {
  const { data } = await sb
    .from("app_public_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  return String(data?.value ?? "");
};

const isTrue = (value: string) => value.toLowerCase() === "true";

const outputTypeFor = (taskType: string) => {
  switch (taskType) {
    case "research": return "research_brief";
    case "qa": return "qa_report";
    case "summary": return "summary";
    case "workflow": return "recommendation";
    case "evaluation": return "evaluation";
    default: return "draft";
  }
};

const extractOutputText = (response: any): string => {
  if (typeof response?.output_text === "string" && response.output_text.trim()) {
    return response.output_text.trim();
  }
  const parts: string[] = [];
  for (const item of response?.output ?? []) {
    if (item?.type !== "message") continue;
    for (const content of item?.content ?? []) {
      if (content?.type === "output_text" && typeof content?.text === "string") {
        parts.push(content.text);
      }
    }
  }
  return parts.join("\n\n").trim();
};

const collectSources = (value: any) => {
  const found = new Map<string, { url: string; title?: string }>();
  const walk = (node: any) => {
    if (!node || typeof node !== "object") return;
    if (typeof node.url === "string" && /^https?:\/\//i.test(node.url)) {
      found.set(node.url, {
        url: node.url,
        title: typeof node.title === "string" ? node.title : undefined,
      });
    }
    if (Array.isArray(node)) node.forEach(walk);
    else Object.values(node).forEach(walk);
  };
  walk(value);
  return Array.from(found.values()).slice(0, 40);
};

const safePrompt = async (task: any) => {
  const { data: promptRows } = await sb
    .from("agent_prompt_templates")
    .select("prompt_key,prompt_type,agent_type,instruction_text,status")
    .eq("status", "approved");

  const systemRules = (promptRows ?? [])
    .filter((p: any) =>
      p.prompt_type === "system" ||
      (p.agent_type && p.agent_type === task.agent_type)
    )
    .map((p: any) => p.instruction_text)
    .join("\n\n");

  return `
LELLEE CONTROLLED AGENT RUN

NON-NEGOTIABLE SAFETY:
${systemRules}

Agent: ${task.agent_name}
Agent role: ${task.agent_description}
Task type: ${task.task_type}
Priority: ${task.priority}
Source type: ${task.source_type ?? "none"}
Source reference: ${task.source_reference ?? "none"}

OBJECTIVE:
${task.objective}

RULES FOR THIS RUN:
- Produce a DRAFT for human review. Never claim it has been approved or published.
- Do not send messages, publish content, make payments, change permissions, or modify outside systems.
- Do not request, reveal, infer, or use private journals, private message bodies, safety/crisis activity, passwords, API keys, or other secrets.
- Do not diagnose, prescribe, or make clinical decisions.
- Keep uncertainties explicit.
- If web research is available, use public sources only and cite sources.
- Return practical, organized output that a Lellee human reviewer can use.
${task.agent_key === "professional-training-evidence-builder" ? `
PROFESSIONAL TRAINING EVIDENCE BUILD:
- Use live web research and real verifiable sources.
- Prefer systematic reviews, current government guidance, professional standards, and peer-reviewed research.
- Include at least 3 unique sources and at least 2 authoritative/systematic sources.
- Include at least one current/recent source for changing topics; justified older foundational evidence may supplement it.
- Preserve important mixed, null, negative, or uncertain findings; do not cherry-pick.
- Match claim strength to evidence and never call the Lellee curriculum itself evidence-based unless separately validated.
- Draft at least 1,800 characters of substantive instructional content.
- Provide at least 3 learning objectives and 2 practice requirements.
- Provide exactly 8 assessment items, each with 4 answer choices; at least 3 items must be scenarios.
- Keep diagnosis, treatment, medication decisions, individualized legal advice, emergency services, and other regulated practice outside ordinary coaching/education scope.
- The response must conform exactly to the required structured-output schema.
` : ""}
`.trim();
};

const professionalTrainingSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    content_md: { type: "string" },
    learning_objectives: { type: "array", items: { type: "string" } },
    practice_requirements: { type: "array", items: { type: "string" } },
    source_refs: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          url: { type: "string" },
          source_type: {
            type: "string",
            enum: ["systematic_review","government_guidance","professional_standard","peer_reviewed_research"]
          },
          published_or_reviewed_year: { type: "integer" },
          current_or_recent: { type: "boolean" },
          claim_supported: { type: "string" }
        },
        required: ["title","url","source_type","published_or_reviewed_year","current_or_recent","claim_supported"]
      }
    },
    mixed_evidence_note: { type: "string" },
    claim_strength_note: { type: "string" },
    assessment_items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          item_type: { type: "string", enum: ["multiple_choice","scenario"] },
          prompt: { type: "string" },
          choices: { type: "array", items: { type: "string" } },
          correct_index: { type: "integer" },
          rationale: { type: "string" },
          source_note: { type: "string" }
        },
        required: ["item_type","prompt","choices","correct_index","rationale","source_note"]
      }
    }
  },
  required: [
    "content_md","learning_objectives","practice_requirements","source_refs",
    "mixed_evidence_note","claim_strength_note","assessment_items"
  ]
};

const callOpenAI = async (task: any, useWebSearch: boolean) => {
  const prompt = await safePrompt(task);

  const evidenceBuild = task.agent_key === "professional-training-evidence-builder";
  const body: any = {
    model: MODEL,
    reasoning: { effort: evidenceBuild ? "medium" : "low" },
    max_output_tokens: evidenceBuild ? 8000 : 6000,
    input: prompt,
  };

  if (useWebSearch) {
    body.tools = [{
      type: "web_search",
      search_context_size: evidenceBuild ? "medium" : "low"
    }];
  }

  if (evidenceBuild) {
    body.text = {
      format: {
        type: "json_schema",
        name: "professional_training_module",
        strict: true,
        schema: professionalTrainingSchema,
      },
    };
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok) {
    const message =
      data?.error?.message ??
      data?.message ??
      `OpenAI HTTP ${response.status}`;
    throw new Error(message);
  }

  const text = extractOutputText(data);
  if (!text) throw new Error("OpenAI returned no output text.");

  return {
    text,
    sources: collectSources(data),
    responseId: data?.id ?? null,
    usage: data?.usage ?? null,
  };
};

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);

  if (!WORKER_SECRET || req.headers.get("x-lellee-agent-worker-secret") !== WORKER_SECRET) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }

  let payload: any = {};
  try { payload = await req.json(); } catch (_) {}

  const mode = String(payload?.mode ?? "health");

  if (mode === "health") {
    return json({
      ok: Boolean(SUPABASE_URL && SERVICE_ROLE_KEY && WORKER_SECRET),
      worker: "dynamic-worker",
      version: "1.2",
      model: MODEL,
      has_supabase_url: Boolean(SUPABASE_URL),
      has_service_role_key: Boolean(SERVICE_ROLE_KEY),
      has_openai_api_key: Boolean(OPENAI_API_KEY),
      has_worker_secret: Boolean(WORKER_SECRET),
      worker_enabled: await readSetting("agent_worker_enabled"),
      external_execution_enabled: await readSetting("agent_external_execution_enabled"),
      external_research_enabled: await readSetting("agent_external_research_execution_enabled"),
      human_review_required: await readSetting("agent_human_review_required"),
    });
  }

  if (mode !== "run") return json({ ok: false, error: "unsupported_mode" }, 400);

  if (!OPENAI_API_KEY) {
    return json({ ok: false, error: "OPENAI_API_KEY_missing" }, 500);
  }

  const workerEnabled = isTrue(await readSetting("agent_worker_enabled"));
  const executionEnabled = isTrue(await readSetting("agent_external_execution_enabled"));
  const researchEnabled = isTrue(await readSetting("agent_external_research_execution_enabled"));
  const humanReview = isTrue(await readSetting("agent_human_review_required"));

  if (!workerEnabled || !executionEnabled || !humanReview) {
    return json({
      ok: false,
      error: "worker_guardrail_block",
      worker_enabled: workerEnabled,
      external_execution_enabled: executionEnabled,
      human_review_required: humanReview,
    }, 409);
  }

  const requestedLimit = Number(payload?.limit ?? 3);
  const limit = Math.max(1, Math.min(Number.isFinite(requestedLimit) ? requestedLimit : 3, 5));

  const { data: tasks, error: claimError } = await sb.rpc(
    "lellee_claim_agent_tasks",
    { p_limit: limit },
  );

  if (claimError) {
    return json({ ok: false, error: "claim_failed", detail: claimError.message }, 500);
  }

  if (!tasks?.length) return json({ ok: true, processed: 0, message: "No queued tasks." });

  const results: any[] = [];
  let externalCreditBlocked = false;

  for (const task of tasks) {
    if (externalCreditBlocked) {
      await sb.from("agent_tasks").update({
        status: "blocked",
        updated_at: new Date().toISOString(),
      }).eq("id", task.task_id);
      results.push({
        task_id: task.task_id,
        title: task.title,
        status: "blocked",
        error: "external_api_credits_required",
      });
      continue;
    }

    let runId: string | null = null;
    try {
      const useWebSearch =
        researchEnabled &&
        (
          ["provider_research", "prospect_research"].includes(task.agent_type) ||
          task.agent_key === "professional-training-evidence-builder"
        );

      const { data: run, error: runError } = await sb
        .from("agent_runs")
        .insert({
          task_id: task.task_id,
          status: "running",
          execution_mode: "external_model",
          model_provider_label: "OpenAI",
          model_label: MODEL,
          started_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (runError) throw new Error(`run_insert_failed: ${runError.message}`);
      runId = run.id;

      const ai = await callOpenAI(task, useWebSearch);
      const outputType = outputTypeFor(task.task_type);

      const { error: outputError } = await sb.from("agent_outputs").insert({
        task_id: task.task_id,
        run_id: runId,
        output_type: outputType,
        output_text: ai.text,
        confidence_label: "medium",
        citations_or_sources: ai.sources,
        review_status: "pending",
      });
      if (outputError) throw new Error(`output_insert_failed: ${outputError.message}`);

      await sb.from("agent_runs").update({
        status: "completed",
        completed_at: new Date().toISOString(),
        input_token_count: ai.usage?.input_tokens ?? null,
        output_token_count: ai.usage?.output_tokens ?? null,
      }).eq("id", runId);

      await sb.from("agent_tasks").update({
        status: "needs_review",
        updated_at: new Date().toISOString(),
      }).eq("id", task.task_id);

      await sb.from("agent_audit_log").insert({
        event_type: "worker_completed_task",
        agent_id: task.agent_id,
        task_id: task.task_id,
        safe_metadata: {
          model: MODEL,
          web_search_used: useWebSearch,
          output_type: outputType,
          response_id: ai.responseId,
        },
      });

      results.push({
        task_id: task.task_id,
        title: task.title,
        status: "needs_review",
        web_search_used: useWebSearch,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (runId) {
        await sb.from("agent_runs").update({
          status: "failed",
          error_code: message.slice(0, 200),
          completed_at: new Date().toISOString(),
        }).eq("id", runId);
      }

      const creditBlocked = /no credits remaining|insufficient[_ ]quota|billing/i.test(message);
      const terminalStatus = creditBlocked ? "blocked" : "failed";

      await sb.from("agent_tasks").update({
        status: terminalStatus,
        updated_at: new Date().toISOString(),
      }).eq("id", task.task_id);

      await sb.from("agent_audit_log").insert({
        event_type: creditBlocked ? "worker_blocked_external_credits" : "worker_failed_task",
        agent_id: task.agent_id,
        task_id: task.task_id,
        safe_metadata: { error: message.slice(0, 500) },
      });

      if (creditBlocked) externalCreditBlocked = true;

      results.push({
        task_id: task.task_id,
        title: task.title,
        status: terminalStatus,
        error: creditBlocked ? "external_api_credits_required" : message,
      });
    }
  }

  return json({
    ok: true,
    processed: results.length,
    results,
  });
});
