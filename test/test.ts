import YoutubeService from "../src/services/youtube/youtube-service";

const YOUTUBE_URL = "https://www.youtube.com/watch?v=8zlzDbXb5SU";
const MUSIC_URL = "https://music.youtube.com/watch?v=_i06HOX3mGE";

YoutubeService.fromUrl(MUSIC_URL)
  .then((info) => {
    console.log(info.player_response.streamingData);
  })
  .catch((err) => console.log(err));
