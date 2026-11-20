const origin='https://lmd-publicite-web.pages.dev';
export async function onRequestGet({request,env}) {
 const url=new URL(request.url), state=url.searchParams.get('state'), code=url.searchParams.get('code');
 const cookie=(request.headers.get('Cookie')||'').match(/(?:^|;\s*)lmd_oauth_state=([^;]+)/)?.[1];
 const headers={'Cache-Control':'no-store','Set-Cookie':'lmd_oauth_state=; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=0','Referrer-Policy':'no-referrer'};
 const fail=(msg,status=400)=>new Response(msg,{status,headers});
 if(url.origin!==origin || !code || !state || state!==cookie) return fail('Connexion expirée ou invalide. Recommencez depuis /admin/.');
 if(!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) return fail('Configuration OAuth manquante',503);
 try {
 const r=await fetch('https://github.com/login/oauth/access_token',{method:'POST',headers:{Accept:'application/json','Content-Type':'application/json'},body:JSON.stringify({client_id:env.GITHUB_CLIENT_ID,client_secret:env.GITHUB_CLIENT_SECRET,code,redirect_uri:origin+'/api/callback'})});
 const data=await r.json(); if(!r.ok || !data.access_token) return fail('Connexion GitHub refusée',403);
 const user=await fetch('https://api.github.com/user',{headers:{Authorization:'Bearer '+data.access_token,'User-Agent':'LMD-CMS',Accept:'application/vnd.github+json'}});
 if(!user.ok || (await user.json()).login.toLowerCase()!=='martial27730') return fail('Compte non autorisé',403);
 const payload=JSON.stringify('authorization:github:success:'+JSON.stringify({token:data.access_token,provider:'github'})).replace(/</g,'\\u003c');
 const nonce=crypto.randomUUID();
 headers['Content-Type']='text/html; charset=utf-8'; headers['Content-Security-Policy']=`default-src 'none'; script-src 'nonce-${nonce}'; base-uri 'none'; frame-ancestors 'none'`;
 return new Response(`<!doctype html><html lang="fr"><meta charset="utf-8"><title>Connexion LMD</title><p>Connexion GitHub réussie.</p><script nonce="${nonce}">const origin=${JSON.stringify(origin)}; if(window.opener){window.addEventListener('message',e=>{if(e.origin===origin && e.source===window.opener){window.opener.postMessage(${payload},origin);window.close();} });window.opener.postMessage('authorizing:github',origin);}</script></html>`,{headers});
 } catch {return fail('Erreur de connexion GitHub',502);}
}