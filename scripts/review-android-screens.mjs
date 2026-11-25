// Visual review on the connected device using a disposable Supabase account.
// Account and records are removed in finally. Credentials are never logged.
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {randomUUID} from 'node:crypto';
import {mkdirSync,writeFileSync} from 'node:fs';
import {setTimeout as delay} from 'node:timers/promises';
const requireCore=createRequire(new URL('../packages/core/package.json',import.meta.url));
const {createClient}=requireCore('@supabase/supabase-js');
const project='fdfhqmmlbxgpzfsatavm';
const device=process.env.ANDROID_SERIAL;
if(!device)throw new Error('Set ANDROID_SERIAL');
const keys=JSON.parse(execFileSync('pnpm',['exec','supabase','projects','api-keys','--project-ref',project,'--output','json'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}));
const admin=createClient(`https://${project}.supabase.co`,keys.find(k=>k.name==='service_role').api_key,{auth:{persistSession:false,autoRefreshToken:false}});
function adb(...args){try{return execFileSync('adb',['-s',device,...args],{encoding:'utf8',timeout:30000,stdio:['ignore','pipe','pipe']});}catch{throw new Error('Device command failed; arguments withheld');}}
const output='/tmp/doitbad-layout-review';
mkdirSync(output,{recursive:true});
function checked(result){if(result.error)throw new Error(result.error.message);return result.data;}
async function xml(){
  let lastError;
  for(let attempt=0;attempt<5;attempt++){
    try{
      adb('shell','uiautomator','dump','/sdcard/doitbad-layout.xml');
      return adb('shell','cat','/sdcard/doitbad-layout.xml');
    }catch(error){
      lastError=error;
      await delay(800);
    }
  }
  throw lastError;
}
async function open(route){adb('shell','am','start','-W','-a','android.intent.action.VIEW','-d',`'doitbad://${route}'`,'tech.doitbad.app');await delay(700);}
async function capture(name){
  if(!adb('shell','dumpsys','window').split('\n').some(l=>l.includes('mCurrentFocus')&&l.includes('tech.doitbad.app')))throw new Error('DoItBad is not foreground');
  const tree=await xml();
  if(tree.includes('access_token='))throw new Error('Auth callback visible; screenshot withheld');
  writeFileSync(`${output}/${name}.xml`,tree);
  adb('shell','screencap','-p','/sdcard/doitbad-layout.png');
  adb('pull','/sdcard/doitbad-layout.png',`${output}/${name}.png`);
  console.log(`CAPTURED ${name}`);
}
async function tap(text){
  for(let attempt=0;attempt<5;attempt++){
    const tree=await xml();
    const node=[...tree.matchAll(/<node\b[^>]+>/g)].map(m=>m[0]).find(n=>n.includes(`text="${text}"`)||n.includes(`content-desc="${text}"`));
    const bounds=node?.match(/bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);
    if(bounds){const [,x1,y1,x2,y2]=bounds.map(Number);if(x2>x1 && y2>y1 && y1<1500){adb('shell','input','tap',String(Math.round((x1+x2)/2)),String(Math.round((y1+y2)/2)));await delay(450);return;}}
    adb('shell','input','swipe','360','1250','360','400','300');
  }
  throw new Error(`Could not find control: ${text}`);
}
let user;
try{
  adb('shell','am','force-stop','tech.doitbad.app');
  adb('shell','am','start','-W','-n','tech.doitbad.app/.MainActivity');
  await delay(300);await capture('01-splash');
  await open('boas-vindas');await capture('02-welcome');
  await open('entrar?mode=signup');await capture('04-signup');
  await open('entrar');await capture('03-login');
  const email=`layout-${randomUUID()}@example.invalid`;
  user=checked(await admin.auth.admin.createUser({email,password:`${randomUUID()}Aa1!`,email_confirm:true})).user;
  const link=checked(await admin.auth.admin.generateLink({type:'magiclink',email,options:{redirectTo:'doitbad://entrar'}}));
  const response=await fetch(link.properties.action_link,{redirect:'manual'});
  const callback=response.headers.get('location');
  if(!callback?.startsWith('doitbad://entrar#access_token=')||callback.includes("'"))throw new Error('Invalid auth callback');
  adb('shell','am','force-stop','tech.doitbad.app');
  adb('shell','am','start','-W','-a','android.intent.action.VIEW','-d',`'${callback}'`,'tech.doitbad.app');
  await delay(2500);
  await capture('10-history');
  for(const [route,name] of [['tarefas','11-tasks'],['agenda','12-calendar'],['mapa','13-map'],['desafios','14-challenges'],['retomada','15-recovery'],['intencoes','16-intentions'],['estatisticas','17-stats'],['zen','18-zen']]){await open(route);await capture(name);}
  await open('tarefa');await capture('05-task');
  await tap('Sua tarefa');
  adb('shell','input','text','Preparar%sa%sapresentacao%sdo%sprojeto%scom%sum%stitulo%sbem%slongo');
  await capture('05-task-keyboard');
  adb('shell','input','keyevent','KEYCODE_BACK');
  await tap('Continuar');await capture('06-blockers');
  await tap('Continuar');await capture('07-step');
  await tap('Iniciar 2 minutos');await delay(1200);await capture('08-timer');
  // UIAutomator can briefly expose the previous hierarchy while this CTA is
  // visible against the Moto G20 system navigation area.
  adb('shell','input','tap','360','1440');await delay(1000);await capture('09-done');
  console.log(`Visual artifacts: ${output}`);
}finally{
  if(user){checked(await admin.auth.admin.deleteUser(user.id));adb('shell','am','force-stop','tech.doitbad.app');console.log('Removed disposable account and records.');}
}
