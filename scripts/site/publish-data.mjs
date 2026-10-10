import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
export function assertDataOnlyChanges(paths){
 if(paths.some(path=>!/^public\/data\/[^\r\n]+\.json$/.test(path)||path.split('/').some(part=>part==='..'||part==='.')))throw Error('Remote contains non-data changes; stop and regenerate on the new code.');
}
export function publishData({cwd=process.cwd(),message='data: refresh public snapshots'}={}){
 const git=(...args)=>execFileSync('git',args,{cwd,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 if(!git('status','--porcelain','--','public/data'))return false;
 git('config','user.name','github-actions[bot]');git('config','user.email','41898282+github-actions[bot]@users.noreply.github.com');
 git('add','--','public/data');git('commit','-m',message);
 git('fetch','origin','main');
 const commits=git('rev-list','HEAD..origin/main').split('\n').filter(Boolean);
 for(const commit of commits)assertDataOnlyChanges(git('diff-tree','--no-commit-id','--name-only','-r',commit).split('\n').filter(Boolean));
 git('rebase','origin/main'); // Any JSON conflict stops; no overwrite or force push.
 git('push','origin','HEAD:main');return true;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){try{process.stdout.write(publishData()?'Published validated data.\n':'No data changes.\n');}catch(error){console.error(error.message);process.exitCode=1;}}
