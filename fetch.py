import urllib.request, re, json
url = 'https://www.youtube.com/playlist?list=PLyBAqOWU1mfUGnBl8IMAcutxMeeHw1--p'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
html = urllib.request.urlopen(req).read().decode('utf-8')
matches = re.findall(r'\"videoId\":\"([a-zA-Z0-9_-]{11})\"', html)
videos = list(dict.fromkeys(matches))[:100]
with open('videos.json', 'w') as f:
    json.dump(videos, f)
