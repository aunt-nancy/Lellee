import { jsonResponse, withAgentGuard } from "../_shared/agent-auth.ts";
Deno.serve(async (request)=>{
  if(request.method!=="POST") return jsonResponse({error:"Method not allowed"},405);
  return withAgentGuard(request,{agentKey:"housing",capability:"housing.search",handler:async({userId,userClient})=>{
    const body=await request.json().catch(()=>({}));
    const input={city:typeof body.city==="string"?body.city.slice(0,120):null,state:typeof body.state==="string"?body.state.slice(0,80):null,zipCode:typeof body.zipCode==="string"?body.zipCode.slice(0,20):null,budgetMin:Number.isFinite(Number(body.budgetMin))?Number(body.budgetMin):null,budgetMax:Number.isFinite(Number(body.budgetMax))?Number(body.budgetMax):null};
    const {data,error}=await userClient.from("housing_preferences").select("city,state,zip_code,budget_min,budget_max,household_size,accessibility_needs,pet_needs").eq("user_id",userId).maybeSingle();
    if(error) return jsonResponse({error:"Housing preferences unavailable"},500);
    return jsonResponse({ok:true,agent:"housing",capability:"housing.search",input,preferences:data||null});
  }});
});
