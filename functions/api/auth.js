const origin = 'https://lmd-publicite-web.pages.dev';
export async function onRequestGet({request,env}) {
 if(new URL(request.url).origin !== origin) return new Response('Origine non autorisée',{status:403});
 if(!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) return new Response('Variables OAuth manquantes',{status:503});
 const state=crypto.randomUUID()+crypto.randomUUID();
 const url=new URL('https://github.com/login/oauth/authorize');
 url.search=new URLSearchParams({client_id:env.GITHUB_CLIENT_ID,redirect_uri:origin+'/api/callback',scope:'repo',state}).toString();
 return new Response(null,{status:302,headers:{Location:url.href,'Set-Cookie':`lmd_oauth_state=${state}; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,'Cache-Control':'no-store'}});
}