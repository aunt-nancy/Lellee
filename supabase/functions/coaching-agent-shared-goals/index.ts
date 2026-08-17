import { jsonResponse, withAgentGuard } from "../_shared/agent-auth.ts";
Deno.serve(async (request)=>{
  if(request.method!=="GET") return jsonResponse({error:"Method not allowed"},405);
  return withAgentGuard(request,{agentKey:"coaching",capability:"coaching.shared_goals",consentRequired:true,handler:async({userId,userClient})=>{
    const {data,error}=await userClient.from("coaching_goals").select("id,title,status,target_date,updated_at").eq("user_id",userId).eq("shared_with_coach",true).order("updated_at",{ascending:false});
    if(error) return jsonResponse({error:"Shared coaching goals unavailable"},500);
    return jsonResponse({ok:true,agent:"coaching",capability:"coaching.shared_goals",goals:data||[]});
  }});
});
