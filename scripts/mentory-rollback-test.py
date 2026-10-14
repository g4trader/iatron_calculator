import subprocess,pathlib,json
base='postgresql://iatron@127.0.0.1:55439/'
name='iatron_mentory_rollback_test'
repo=pathlib.Path(__file__).resolve().parents[1]
def run(args,**kwargs):return subprocess.check_output(args,**kwargs).decode()
run(['createdb','-h','127.0.0.1','-p','55439','-U','iatron',name])
try:
 dump=subprocess.check_output(['pg_dump',base+'iatron_redesign','--no-owner','--no-acl'])
 subprocess.run(['psql',base+name,'-v','ON_ERROR_STOP=1'],input=dump,check=True,stdout=subprocess.DEVNULL)
 query='SELECT count(*) FROM "User"; SELECT count(*) FROM "Subscription"; SELECT count(*) FROM "License";'
 before=run(['psql',base+name,'-At','-c',query])
 run(['psql',base+name,'-v','ON_ERROR_STOP=1','-f',str(repo/'docs/mentory/rollback.sql')])
 after=run(['psql',base+name,'-At','-c',query])
 assert before==after
 count=run(['psql',base+name,'-At','-c',"SELECT count(*) FROM pg_tables WHERE schemaname='public' AND tablename LIKE 'mentory_%';"])
 assert count.strip()=='0'
 run(['psql',base+name,'-v','ON_ERROR_STOP=1','-f',str(repo/'frontend/prisma/migrations/20261015000100_mentory/migration.sql')])
 print(json.dumps({'rollback':'PASS','reapply':'PASS','existing_user_subscription_license_counts_preserved':True,'database':'isolated disposable clone'},indent=2))
finally:run(['dropdb','-h','127.0.0.1','-p','55439','-U','iatron',name])
