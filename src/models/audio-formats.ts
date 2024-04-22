import { AudioFormatsMetadata } from "../@types/types";
import YoutubeService from "../services/youtube/youtube-service";

export default class AudioFormats {
  public static async fromUrl(url: string): Promise<AudioFormatsMetadata> {
    try {
      const response = await YoutubeService.fromUrl(url);
      const formats =
        response.player_response.streamingData.adaptiveFormats.filter(
          (format) => {
            return format?.mimeType?.includes("audio/webm");
          }
        );

      return {
        success: true,
        message: "Audio formats generated successfully",
        formats: formats,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Error generating audio formats, ${error.message}`,
        formats: [],
      };
    }
  }
}
