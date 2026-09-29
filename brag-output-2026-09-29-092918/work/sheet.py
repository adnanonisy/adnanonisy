import sys; from PIL import Image
ts=sys.argv[1:]; ims=[Image.open(f'stills/t{float(t):.2f}.png').resize((960,540)) for t in ts]
W=Image.new('RGB',(1920,540*((len(ims)+1)//2)),'white')
for i,im in enumerate(ims): W.paste(im,((i%2)*960,(i//2)*540))
W.save('stills/sheet.png')
