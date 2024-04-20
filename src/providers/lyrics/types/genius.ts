import axios, { AxiosInstance, AxiosResponse } from "axios";
import { JSDOM } from "jsdom";

interface LyricsResult {
  [title: string]: string;
}

export default class Genius {
  private readonly client: AxiosInstance;

  public constructor(
    readonly token: string = "alXXDbPZtK1m2RrZ8I4k2Hn8Ahsd0Gh_o076HYvcdlBvmc0ULL1H8Z8xRlew5qaG"
  ) {
    this.client = axios.create({
      baseURL: "https://api.genius.com/",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      timeout: 10000,
    });
  }

  public async getResults(
    name: string,
    artists: string[]
  ): Promise<LyricsResult> {
    const artistsStr = artists.join(", ");
    const title = `${name} - ${artistsStr}`;

    try {
      const response: AxiosResponse = await this.client.get("search", {
        params: { q: title },
      });

      const hits = response.data.response.hits;
      const results: LyricsResult = {};

      hits.forEach((hit: any) => {
        results[hit.result.full_title] = hit.result.id;
      });

      return results;
    } catch (error) {
      console.error("Error retrieving results:", error);
      return {};
    }
  }

  public async extractLyrics(url: string): Promise<string | null> {
    try {
      const songResponse: AxiosResponse = await this.client.get(`songs/${url}`);
      const songUrl = songResponse.data.response.song.url;

      let lyrics: string = "";
      let counter = 0;
      let soup: any = null;

      while (counter < 4) {
        const geniusPageResponse: AxiosResponse = await this.client.get(
          songUrl
        );

        if (!(geniusPageResponse.status === 200)) {
          counter++;
          continue;
        }

        const dom = new JSDOM(geniusPageResponse.data);
        soup = dom.window.document;

        break;
      }

      if (!soup) {
        return null;
      }

      const lyricsDiv = soup.querySelector("div.lyrics");
      const lyricsContainers = soup.querySelectorAll(
        "div[class^=Lyrics__Container]"
      );

      if (lyricsDiv) {
        lyrics = lyricsDiv.textContent || "";
      } else if (lyricsContainers.length > 0) {
        lyricsContainers.forEach((container: any) => {
          lyrics += container.textContent || "";
        });
      } else {
        return null;
      }

      if (!lyrics) {
        return null;
      }

      lyrics = lyrics.trim();

      ["desc", "Desc"].forEach((toRemove) => {
        lyrics = lyrics.replace(toRemove, "");
      });

      return lyrics.trim();
    } catch (error) {
      console.error("Error extracting lyrics:", error);
      return null;
    }
  }
}
