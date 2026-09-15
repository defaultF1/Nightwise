import staticFiles from '@fastify/static';
import {resolve,basename} from 'node:path';
import {existsSync} from 'node:fs';
import type {FastifyInstance} from 'fastify';
export async function serveGeoWeb(app:FastifyInstance,root=resolve('dist')){
 if(!existsSync(resolve(root,'index.html')))throw new Error('Website build missing. Run npm run build:hosted first.');
 app.addHook('onSend',async(_req,reply,payload)=>{reply.header('X-Content-Type-Options','nosniff').header('Referrer-Policy','strict-origin-when-cross-origin');return payload;});
 await app.register(staticFiles,{root,dotfiles:'deny',setHeaders(res,path){res.header('Cache-Control',path.replaceAll('\\','/').includes('/assets/')?'public, max-age=31536000, immutable':'no-cache');if(basename(path)==='index.html')res.header('Cache-Control','no-store');}});
 app.setNotFoundHandler((req,reply)=>{
  if(req.url.startsWith('/api/')||req.method!=='GET'||req.url.split('?')[0].includes('.'))return reply.code(404).send({message:'Not found'});
  return reply.sendFile('index.html',{maxAge:0,immutable:false});
 });
}
