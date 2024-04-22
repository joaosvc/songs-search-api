/**
 * Get video ID.
 *
 * There are a few type of video URL formats.
 *  - https://www.youtube.com/watch?v=VIDEO_ID
 *  - https://m.youtube.com/watch?v=VIDEO_ID
 *  - https://youtu.be/VIDEO_ID
 *  - https://www.youtube.com/v/VIDEO_ID
 *  - https://www.youtube.com/embed/VIDEO_ID
 *  - https://music.youtube.com/watch?v=VIDEO_ID
 *  - https://gaming.youtube.com/watch?v=VIDEO_ID
 *
 * @param {string} link
 * @return {string}
 * @throws {Error} If unable to find a id
 * @throws {TypeError} If videoid doesn't match specs
 */
const VALID_QUERY_DOMAINS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "gaming.youtube.com",
]);
const VALID_PATH_DOMAINS =
  /^https?:\/\/(youtu\.be\/|(www\.)?youtube\.com\/(embed|v|shorts)\/)/;
const ID_REGEX = /^[a-zA-Z0-9-_]{11}$/;

export default class YoutubeDomains {
  public static getURLVideoID(link: string): string {
    const parsed = new URL(link.trim());
    let id = parsed.searchParams.get("v");

    if (VALID_PATH_DOMAINS.test(link.trim()) && !id) {
      const paths = parsed.pathname.split("/");
      id = parsed.host === "youtu.be" ? paths[1] : paths[2];
    } else if (!VALID_QUERY_DOMAINS.has(parsed.hostname)) {
      throw new Error("Not a YouTube domain");
    }

    if (!id) {
      throw new Error(`No video id found: "${link}"`);
    }

    id = id.substring(0, 11);

    if (!this.validateID(id)) {
      // Assuming validateID is a function defined elsewhere that uses idRegex
      throw new TypeError(
        `Video id (${id}) does not match expected format (${ID_REGEX.toString()})`
      );
    }

    return id;
  }

  public static validateID(id: string): boolean {
    return ID_REGEX.test(id);
  }

  public static validateURL(url: string): boolean {
    try {
      this.getURLVideoID(url);
      return true;
    } catch {
      return false;
    }
  }
}
