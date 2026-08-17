import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export type AgentAuthorizationResult = { userId: string; userClient: SupabaseClient; adminClient: SupabaseClient };

function env(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function bearerToken(request: Request): string {
  const auth = request.headers.get("Authorization") || "";
  if (!auth.toLowerCase().startsWith("bearer ")) throw new Response("Unauthorized", { status: 401 });
  return auth.slice(7).trim();
}

function sanitizeMetadata(input: Record<string, unknown>) {
  const blocked = ["journal","private_message","clinical_note","substance_use","mental_health","payment","government_id","service_role","authorization"];
  const walk = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(walk);
    if (!value || typeof value !== "object") return value;
    const output: Record<string, unknown> = {};
    for (const [key,val] of Object.entries(value as Record<string, unknown>)) {
      if (blocked.some(term => key.toLowerCase().includes(term))) continue;
      output[key] = walk(val);
    }
    return output;
  };
  return walk(input) as Record<string, unknown>;
}

async function audit(adminClient: SupabaseClient, userId: string|null, agentKey: string, capability: string, outcome: "allowed"|"denied", metadata: Record<string,unknown> = {}) {
  await adminClient.from("agent_access_audit").insert({ user_id:userId, agent_key:agentKey, capability, outcome, metadata:sanitizeMetadata(metadata) });
}

export async function authorizeAgentAction(request: Request, agentKey: string, capability: string, consentRequired=false): Promise<AgentAuthorizationResult> {
  const url=env("SUPABASE_URL"), anonKey=env("SUPABASE_ANON_KEY"), serviceRoleKey=env("SUPABASE_SERVICE_ROLE_KEY");
  const token=bearerToken(request);
  const userClient=createClient(url,anonKey,{global:{headers:{Authorization:`Bearer ${token}`}},auth:{persistSession:false,autoRefreshToken:false}});
  const adminClient=createClient(url,serviceRoleKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:userData,error:userError}=await userClient.auth.getUser();
  const userId=userData?.user?.id || null;
  if(userError || !userId){ await audit(adminClient,null,agentKey,capability,"denied",{reason:"invalid_user_session"}); throw new Response("Unauthorized",{status:401}); }

  const {data:agent}=await adminClient.from("agent_registry").select("agent_key,is_enabled").eq("agent_key",agentKey).maybeSingle();
  if(!agent?.is_enabled){ await audit(adminClient,userId,agentKey,capability,"denied",{reason:"agent_disabled_or_unknown"}); throw new Response("Agent unavailable",{status:403}); }

  const {data:grant}=await adminClient.from("agent_capability_grants").select("is_allowed").eq("agent_key",agentKey).eq("capability",capability).maybeSingle();
  if(!grant?.is_allowed){ await audit(adminClient,userId,agentKey,capability,"denied",{reason:"capability_not_allowed"}); throw new Response("Capability denied",{status:403}); }

  if(consentRequired){
    const {data:consent}=await adminClient.from("user_agent_consents").select("is_granted,revoked_at").eq("user_id",userId).eq("agent_key",agentKey).eq("capability",capability).maybeSingle();
    if(!consent?.is_granted || consent?.revoked_at){ await audit(adminClient,userId,agentKey,capability,"denied",{reason:"user_consent_missing_or_revoked"}); throw new Response("User consent required",{status:403}); }
  }
  await audit(adminClient,userId,agentKey,capability,"allowed",{reason:"authorization_passed"});
  return {userId,userClient,adminClient};
}

export function jsonResponse(body: unknown, status=200){
  return new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
}

export async function withAgentGuard(request: Request, config: {agentKey:string; capability:string; consentRequired?:boolean; handler:(ctx:AgentAuthorizationResult)=>Promise<Response>}) {
  try { const ctx=await authorizeAgentAction(request,config.agentKey,config.capability,config.consentRequired||false); return await config.handler(ctx); }
  catch(error){ if(error instanceof Response) return error; console.error("Agent enforcement error",error); return jsonResponse({error:"Request could not be completed"},500); }
}
