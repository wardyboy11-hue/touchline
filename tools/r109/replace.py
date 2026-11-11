# r109 plain language pass: exact before -> after pairs. Run once from the repo root. Writes /workspace/r109_language/changes.json
# Note: the positions.js "Public links tagged..." and tl-spotify.js playlist pairs needed different escaping and were applied by hand; changes.json has the exact text.
import json,sys,os
FAM=['family.html','parents.html']
R=[
# ---- Quick fixes: My role ----
(['coach/anim/s1111_training.html','tools/anim/s1111/page.html'],'data-mode="role">My role</button>','data-mode="role">Just my position</button>','Session page button'),
(['shape/index.html'],'data-m="role">My role</button>','data-m="role">Just my position</button>','Shape page button'),
(FAM,'Tap My role to see your own job.','Tap Just my position to see what you do.','Training 11/11 card, players'),
(['coach/app.js'],'tap My role for your job.','tap Just my position to see what you do.','Alert text filled in for Send to players'),
(['tools/anim/s1111/mkpdf.js'],'Pick My role to see your own job.','Tap Just my position to see what you do.','Session plan PDF'),
(['positions.js'],'\')">My role</button>','\')">My position</button>','Me tab button'),
(['positions.js'],'Open my role guide','Open my position guide','Me tab button'),
(['positions.js'],'Open role guide','Open position guide','Position page button'),
(['positions.js'],'>Role guide<','>Position guide<','Position page heading'),
(['positions.js'],"(forChild?'His role':'My role')","(forChild?'His position':'My position')",'Me tab card heading'),
(['positions.js'],"aria-label','My role'","aria-label','My position'",'Screen reader label'),
(['positions.js'],'<h2 style="margin:0">My role</h2>','<h2 style="margin:0">My position</h2>','Position page title'),
(['positions.js'],"'Animations, Positions notes, library links and clips sent to his profile.'","'Videos, notes and clips for his position, plus anything the coaches sent him.'",'Parent Me card'),
(['positions.js'],"'Your 3-5-2 resources: animations, Positions notes, library links and clips sent to you.'","'Videos, notes and clips for your position, plus anything the coaches sent you.'",'Player Me card'),
(['positions.js'],'Pick where you play in our 3-5-2 and you get the guide, clips and drills for it.','Pick where you play and you get the guide, clips and drills for it.','Home position card'),
(['positions.js'],'Local clips that work offline once opened. Includes 3-5-2 in transition where it helps this role.','Short videos for this position. They still work without signal once you have opened them.','Position page'),
(['positions.js'],"Public links tagged for this role. Coaches' Voice stays coach-only. Paid items are link-only.",'Free links the coaches picked for this position.','Position page'),
(['positions.js'],'Nothing tagged for this role yet.','Nothing for this position yet.','Position page'),
(FAM,"label:'His role',sub:'Animations, Positions notes, library links and clips sent to his profile. Shirt number only here.'","label:'His position',sub:'Videos, notes and clips for his position, plus anything the coaches sent him. Shown by shirt number only.'",'Parent Me card'),
(FAM,'>Your role card</span>','>Your position for the next game</span>','Home card tag'),
(['voice.js']," 'My role',\n"," 'My position',\n",'Ask suggestion chip'),
(['voice.js'],"['my role','role card','what is my role','show my role']","['my role','my position','role card','what is my role','show my role','what is my position','where do i play']",'Ask understands both'),
(['voice.js'],"'Opening your role card.'","'Opening your position page.'",'Ask reply'),
# ---- Families: jargon ----
(FAM+['coach/index.html'],'Welcome to <b>Wigan Junior Latics Blues U15</b> Touchline Hub','Welcome to the <b>Wigan Junior Latics U15 Blues</b> team app','Loading screen'),
(FAM,'Stuck? See the FAQ</a>','Stuck? See common questions</a>','Top of every tab'),
(FAM,'">FAQ and help</button>','">Questions and help</button>','Me tab button'),
(FAM,'<h2 style="margin-top:8px">MoM vote</h2><p>MoM vote opens ','<h2 style="margin-top:8px">Man of the match vote</h2><p>Voting opens ','Home vote card'),
(FAM,'If No, you can optionally tell the coaches why further down.','If it is No, you can tell the coaches why below. You do not have to.','Can you come card'),
(FAM,'<h2>Our team code <span class="small muted">optional</span></h2>','<h2>Our team rules <span class="small muted">optional</span></h2>','Player Me card (code clashed with the sign in code)'),
(FAM,'Opens from kick-off on your phone. Server sync follows once Tim has deployed the latest script.','Voting opens at kick off.','Vote card'),
(FAM,'then counts you down. Works offline once opened.','then counts you down. Works without signal once you have opened it.','Stretching card'),
(FAM,"d:'Official FA learning hub'","d:'The FA\\'s own learning website'",'Links list'),
(FAM,'"Shape and transition in the game", "Watch','"Shape, and switching between attack and defence", "Watch','Animation list'),
(FAM,'60 minutes. Warm up, rondo, two practices with Tim and Deano, then a game.','60 minutes. Warm up, a keep ball game (rondo), two practices with Tim and Deano, then a game.','Training 11/11 card'),
(FAM,'>Turn on notifications</button>','>Turn on alerts</button>','Alerts button, same words as the first open prompt'),
(FAM,'>Turn notifications off</button>','>Turn alerts off</button>','Alerts button'),
(FAM,"'<h2 style=\"margin-top:8px\">Turn on notifications</h2><p><b>Without this you will not hear about training, games or attendance requests.</b></p>'","'<h2 style=\"margin-top:8px\">Turn on alerts</h2><p><b>Without alerts you will not hear when training or a game changes.</b></p>'",'Home action card'),
(FAM,'<div class="card"><h2>Notifications</h2><p class="small muted">A short message to your phone if a game is off, a kick off time changes or there is something you need to know. Rare, never marketing.</p>','<div class="card"><h2>Notifications</h2><p class="small muted">Alerts are short messages to your phone when a game is off, a kick off time changes or there is something you need to know. Not many, and never adverts.</p>','Me alerts card'),
(FAM,'Pre-match music on Games has Open in Spotify and Load Spotify player.','Pre match music on Games has Open in Spotify and Play it here.','Help text'),
(FAM,'Games is headed Player matchday or Parent matchday.','Games is headed Match days.','Help text'),
(FAM,'The in-app sound stops if you leave the page.','The sound stops if you leave the page.','Help text'),
(['tl-spotify.js'],"The coaches\\\\\\' playlist. Open in Spotify uses the Spotify app or site. Load Spotify player connects to Spotify. Touchline does not see what you play and does not sign you in. Touchline does not download the songs.","The coaches\\\\\\' playlist. Open in Spotify opens the Spotify app. Play it here plays it on this page. We do not see what you play.",'Games tab music card'),
(['tl-spotify.js'],'style="margin-top:8px">Load Spotify player</button>','style="margin-top:8px">Play it here</button>','Games tab music card'),
(['tl-pages.js'],"player ? 'Player matchday' : 'Parent matchday', 'Next games are first. Kit, directions, lifts and the share button stay on each game. Emergency is on the Home shortcut row.'","'Match days', 'Your next game is at the top. Each game shows the kit, directions, lifts and a Share button. If something goes wrong on the day, use Emergency on Home.'",'Games tab heading'),
(['tl-pages.js'],"player ? 'Player resources' : 'Parent resources', 'Clips and pictures the coaches have checked. Share sits on each clip. Podcasts are under Listen.'","'Videos and pictures', 'Videos and pictures the coaches have checked. Each one has a Share button. Podcasts are under Listen.'",'Media tab heading'),
(['tl-alarm.js'],'<h2>Wake-up</h2>','<h2>Wake up alarm</h2>','Games tab'),
(['tl-alarm.js'],'<h3>In-app sound</h3>','<h3>Sound in the app</h3>','Games tab'),
(['tl-alarm.js'],'>Arm preview</button>','>Set it</button>','Games tab'),
(['tl-alarm.js'],"'iPhone cannot set a Clock alarm from a website. There is no documented link for it.' : 'This browser cannot open the phone clock.'","'iPhone does not let a website set a Clock alarm.' : 'This phone does not let a website set an alarm.'",'Games tab'),
(['tl-alarm.js'],"', Europe/London'","' UK time'",'Games tab'),
(['tl-alarm.js'],'London now: <b','Time now: <b','Games tab'),
(['tl-alarm.js'],'. London now is \'','. The time now is \'','Games tab'),
(['tl-alarm.js'],'It is not a phone alarm and it is not a notification. No Match of the Day recording is included.','It is not a phone alarm.','Games tab'),
(['prestretch.js'],'short dynamic warm-up. Tell us any niggles (chips only), we weight the sequence, and save it on your profile to replay.','A short warm up before the game. Tap anything that feels sore and we change the stretches to suit. You can save it and use it again.','Stretch card'),
(['fitness.js'],"'Goals, a PT-style plan, and tick sessions off. Saved to your profile.'","'Set a goal, get a plan like a personal trainer would give you, and tick off each session. Saved to your profile.'",'Fitness card'),
(['cd.js'],'<span class="small muted">Live countdown</span>','<span class="small muted">Time to go</span>','Coming up cards'),
# ---- Accounts ----
(['acct.js'],"if(dirty&&!confirm('Some changes have not synced yet. Sign out anyway?'))return;","if(dirty&&!confirm('Some changes have not been saved to the team yet. Sign out anyway?'))return;",'Sign out check'),
# ---- Coach ----
(['coach/app.js'],"lastMsg='Synced '+new Date()","lastMsg='Saved '+new Date()",'Header status'),
(['coach/app.js'],"if(manual)toast('Synced');","if(manual)toast('Saved');",'Toast'),
(['coach/app.js'],'aria-label="Sunlight mode">Sun</button>','aria-label="Bright screen for sunlight">Bright</button>','Header button'),
(['coach/app.js'],'Waiting for the latest backend update.','Not switched on yet. It needs the latest Google Sheet script.','Players voice'),
(['coach/app.js'],'The head injury part of the backend is not switched on yet.','Head injury records are not switched on in the Google Sheet yet.','Head injury page'),
(['coach/app.js'],'Clip views need backend version 28. Until it is live this column shows ?.','Clip views are not switched on yet. Until they are, this column shows ?.','Clip table'),
(['coach/app.js'],'Saved. Push: ','Saved. Phone alerts: ','Toast after fixture change'),
(['coach/app.js'],'Posted on their page. Push: ','Posted on their page. Phone alerts: ','Toast after attendance request'),
(['coach/app.js'],'A push to every family with alerts on','A phone alert to every family with alerts on','Attendance requests'),
(['coach/app.js'],"'Comms hub'","'Comms: team page and messages'",'Comms heading'),
(['coach/app.js'],'Can push later games back a week','Can move later games back a week','Fixture change'),
(['coach/app.js'],'> Push later fixtures back a week','> Move later fixtures back a week','Fixture change'),
(['coach/cdev.js'],'The questions part of the backend is not switched on yet (release 75 backend).','Questions are not switched on in the Google Sheet yet.','Coach development'),
]
log=[];bad=[]
for files,old,new,where in R:
  tot=0
  for f in files:
    p=os.path.join('.',f)
    if not os.path.exists(p):continue
    c=open(p,encoding='utf8').read();n=c.count(old)
    if n:open(p,'w',encoding='utf8').write(c.replace(old,new));tot+=n
  log.append({'files':files,'before':old,'after':new,'where':where,'count':tot})
  if not tot:bad.append((files,old[:80]))
json.dump(log,open('/workspace/r109_language/changes.json','w'),indent=1)
print('pairs',len(R),'missing',len(bad))
for b in bad:print('MISSING',b)
