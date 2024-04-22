# Song Search API

## Search Songs

### Endpoint

https://song-search-api.vercel.app/search-songs

### Request Body

```json
{
  "searchQuery": "https://open.spotify.com/intl-pt/track/7aNGkb56V20mvaoHuEDHKE?si=6894ff81162e4c6a"
}
```

Response

```json
{
  "songs": [
    {
      "name": "Desce e Sobe",
      "image": "https://i.scdn.co/image/ab67616d0000b273999684ec85a8374b9c105e11",
      "url": "https://open.spotify.com/track/7aNGkb56V20mvaoHuEDHKE",
      "songId": "7aNGkb56V20mvaoHuEDHKE",
      "album": "Desce e Sobe",
      "artist": "Milbeats",
      "artists": ["Milbeats", "Complexo dos Hits"],
      "isrc": "BKCMX2400163",
      "duration": 168
    }
  ],
  "hasMore": false,
  "nextId": null,
  "nextOffset": null,
  "offset": 0,
  "limit": 1
}
```

## Generate Simple Link

### Endpoint

https://song-search-api.vercel.app/simple-link

### Request Body

```json
{
  "songs": [
    {
      "name": "Desce e Sobe",
      "url": "https://open.spotify.com/track/7aNGkb56V20mvaoHuEDHKE",
      "songId": "7aNGkb56V20mvaoHuEDHKE",
      "album": "Desce e Sobe",
      "artist": "Milbeats",
      "artists": ["Milbeats", "Complexo dos Hits"],
      "isrc": "BKCMX2400163",
      "duration": 168
    }
  ],
  "hasMore": false,
  "nextId": null,
  "nextOffset": null,
  "offset": 0,
  "limit": 1
}
```

Response

```json
{
  "success": true,
  "message": "Simple link generated successfully",
  "link": "https://music.youtube.com/watch?v=_i06HOX3mGE"
}
```

## Generate Audio Formats

### Endpoint

https://song-search-api.vercel.app/audio-formats

### Request Body

```json
{
  "url": "https://music.youtube.com/watch?v=_i06HOX3mGE"
}
```

Response

```json
{
  "success": true,
  "message": "Audio formats generated successfully",
  "formats": [
    {
      "itag": 774,
      "mimeType": "audio/webm; codecs=\"opus\"",
      "bitrate": 312799,
      "initRange": {
        "start": "0",
        "end": "258"
      },
      "indexRange": {
        "start": "259",
        "end": "544"
      },
      "lastModified": "1712786423817057",
      "contentLength": "5872135",
      "quality": "tiny",
      "projectionType": "RECTANGULAR",
      "averageBitrate": 278496,
      "audioQuality": "AUDIO_QUALITY_HIGH",
      "approxDurationMs": "168681",
      "audioSampleRate": "48000",
      "audioChannels": 2,
      "loudnessDb": 5.5100002,
      "url": "https://rr1---sn-p5qs7nsk.googlevideo.com/videoplayback?expire=1713772426&ei=KsMlZuatL6uiy_sP6dqdgAI&ip=3.235.144.208&id=o-ACLTqt-1Pfk--R4wB8Y3MEXbSp_dCwYAIrskkTyOMfVx&itag=774&source=youtube&requiressl=yes&xpc=EgVo2aDSNQ%3D%3D&mh=jb&mm=31%2C29&mn=sn-p5qs7nsk%2Csn-p5qlsn76&ms=au%2Crdu&mv=u&mvi=1&pl=20&gcr=us&bui=AaUN6a00SCSXhcEDg2GsghGzY8FBoew6T_Yn14ShEbBmDUnrCF6m_CRSDxcrcSEnS_tyEFrrjPeNYdHO&spc=UWF9f6tVTfjyYEKK2Kqmx9Pib0tgEHLTFvCjISonVMfqeHQdEOqsxWaDvrUF&vprv=1&svpuc=1&mime=audio%2Fwebm&ns=4FtVTGY0AHGhPyljsn04tQQQ&gir=yes&clen=5872135&dur=168.681&lmt=1712786423817057&mt=1713750413&fvip=2&keepalive=yes&c=WEB&sefc=1&txp=2318224&n=ENMVtt_r-fV0NQ&sparams=expire%2Cei%2Cip%2Cid%2Citag%2Csource%2Crequiressl%2Cxpc%2Cgcr%2Cbui%2Cspc%2Cvprv%2Csvpuc%2Cmime%2Cns%2Cgir%2Cclen%2Cdur%2Clmt&lsparams=mh%2Cmm%2Cmn%2Cms%2Cmv%2Cmvi%2Cpl&lsig=ALClDIEwRgIhAPG-D9m2mPC4Hz4T7-y_GUdiFwfMEkBmLB6-PVzQSnJ6AiEArfVHuWTNmt1uAwd6oOEnl9J4rxcNt9kIh6g_dSSfLIU%3D&sig=AJfQdSswRAIgdzsfrr0EcQgqmvUaqiMzbezAWkGfZh2TpKkiY07Cha8CIB9M5p_NaiW030lonHqdw6TkpR2HuMXNbDxWK23eAJWt"
    }
  ]
}
```

Este arquivo README.md descreve os endpoints da API de busca de músicas, fornecendo informações sobre como usá-los, os corpos das solicitações necessárias e os formatos de resposta esperados.
