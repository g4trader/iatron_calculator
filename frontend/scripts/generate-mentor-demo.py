from pathlib import Path
import subprocess,json,hashlib,re
root=Path(__file__).resolve().parents[2];out=root/'frontend/assets/mentory-demo';temp=Path('/tmp/mentory-demo-video');temp.mkdir(exist_ok=True);out.mkdir(parents=True,exist_ok=True)
scenes=[('Sua sala de aula','Uma experiência para aprender no seu ritmo.','Bem-vindo à demonstração da MENTOR.iatron. Este vídeo apresenta a experiência da sala de aula. A narração é sintética e o conteúdo é demonstrativo, sem orientações clínicas.'),('Você controla o ritmo','Pause, avance e retome quando quiser.','Use os controles para pausar, ajustar o volume e escolher a velocidade de reprodução. Você também pode ativar as legendas e expandir o vídeo para tela cheia, quando o navegador oferecer esse recurso.'),('Tudo conectado à aula','Vídeo, roteiro, materiais e reflexão.','Abaixo do vídeo, você encontra o roteiro, os objetivos e os materiais da aula. Explore os documentos e registre uma pergunta de estudo. As anotações desta demonstração são temporárias.'),('Continue sua jornada','Explore a próxima aula da trilha.','Ao voltar a esta aula, a posição do vídeo será retomada enquanto a demonstração permanecer aberta. A conclusão é marcada por você. Explore os módulos e veja como será a experiência com as videoaulas do curso.')]
font='/System/Library/Fonts/Supplemental/Arial.ttf';bold='/System/Library/Fonts/Supplemental/Arial Bold.ttf';chapters=[];offset=0;vtt=['WEBVTT','']
def stamp(n):
 ms=round(n*1000);return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02}.{ms%1000:03}'
for i,(title,subtitle,narration) in enumerate(scenes):
 (temp/f'narration-{i}.txt').write_text(narration)
 subprocess.run(['/usr/bin/say','-v','Luciana','-r','155','-f',str(temp/f'narration-{i}.txt'),'-o',str(temp/f'audio-{i}.aiff')],check=True)
 duration=float(subprocess.check_output(['/usr/local/bin/ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',str(temp/f'audio-{i}.aiff')]))+0.8
 chapters.append({'title':title,'start':round(offset,3)})
 for key,value in [('title',title),('subtitle',subtitle),('footer','VÍDEO DEMONSTRATIVO  ·  NARRAÇÃO SINTÉTICA'),('brand','MENTOR.iatron'),('count',f'EXPERIÊNCIA DE APRENDIZAGEM     0{i+1} / 04')]: (temp/f'{key}-{i}.txt').write_text(value)
 filters=["drawbox=x=0:y=0:w=iw:h=10:color=0x149ab3:t=fill","drawbox=x=80:y=205:w=72:h=6:color=0x55d0dc:t=fill"]
 for key,y,size,color,f in [('brand',70,30,'white',bold),('count',150,20,'0x8fd9e4',font),('title',260,56,'white',bold),('subtitle',350,28,'0xd0e5f0',font),('footer',635,18,'0xaac9da',font)]: filters.append(f"drawtext=fontfile='{f}':textfile='{temp}/{key}-{i}.txt':x=80:y={y}:fontsize={size}:fontcolor={color}")
 filters.append('fade=t=in:st=0:d=0.25')
 subprocess.run(['/usr/local/bin/ffmpeg','-hide_banner','-loglevel','error','-y','-f','lavfi','-i','color=c=0x102741:s=1280x720:r=24','-i',str(temp/f'audio-{i}.aiff'),'-t',str(duration),'-vf',','.join(filters),'-af','apad','-c:v','libx264','-preset','fast','-crf','24','-pix_fmt','yuv420p','-c:a','aac','-b:a','96k','-ar','44100','-ac','2',str(temp/f'scene-{i}.mp4')],check=True)
 parts=re.split(r'(?<=\.)\s+',narration);start=offset;total=sum(len(p) for p in parts)
 for part in parts:
  end=start+(duration-0.5)*len(part)/total;vtt += [f'{stamp(start)} --> {stamp(end)}',part,''];start=end
 offset+=duration
(temp/'concat.txt').write_text(''.join(f"file '{temp}/scene-{i}.mp4'\n" for i in range(4)))
subprocess.run(['/usr/local/bin/ffmpeg','-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',str(temp/'concat.txt'),'-c','copy','-movflags','+faststart',str(out/'lesson.mp4')],check=True)
subprocess.run(['/usr/local/bin/ffmpeg','-hide_banner','-loglevel','error','-y','-ss','1','-i',str(out/'lesson.mp4'),'-frames:v','1',str(out/'poster.jpg')],check=True)
(out/'captions.vtt').write_text('\n'.join(vtt))
(root/'frontend/lib/mentory/demo-video-chapters.json').write_text(json.dumps(chapters,ensure_ascii=False,indent=2)+'\n')
(out/'README.md').write_text('Vídeo original de demonstração, gerado localmente com FFmpeg e voz sintética padrão Luciana (macOS). Sem conteúdo clínico ou imagens de pessoas. MP4 H.264/AAC, 1280×720, legendas WebVTT. Servido exclusivamente por rota autenticada de equipe; não colocar em public/.\n')
(root/'docs/identidade-produtos/asset-manifest.json').write_text(json.dumps({'duration':offset,'chapters':chapters,'files':[{ 'name':p.name,'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in out.iterdir()]},ensure_ascii=False,indent=2))
print('Vídeo gerado:',round(offset,1),'segundos,', (out/'lesson.mp4').stat().st_size,'bytes')
