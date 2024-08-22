import {
  FullSimpleLinkMetadata,
  SimpleLinkMetadata,
  Song,
} from "../../@types/types";
import { badRequest, ok, serverError } from "../helpers";
import { HttpRequest, HttpResponse, IController } from "../protocols";
import { GetFullSearchSongsParams } from "./protocols";
import Parser from "../../utils/search/parser";
import YoutubeSearch from "../../models/youtube-search";

export class GetFullSearchSongsController implements IController {
  async handle(
    httpRequest: HttpRequest<GetFullSearchSongsParams>
  ): Promise<HttpResponse<FullSimpleLinkMetadata | string>> {
    try {
      const searchQuery = String(httpRequest?.params?.searchQuery!);

      if (!searchQuery) {
        return badRequest("Missing searchQuery");
      }

      const searchResult = await Parser.searchAllSongs(searchQuery);

      const processedSongs = <SimpleLinkMetadata[]>(
        (
          await Promise.all(
            searchResult.map((song: Song) => YoutubeSearch.fromParams(song))
          )
        ).filter((metadata) => metadata.success && metadata.song)
      );

      return ok({
        metadata: processedSongs,
      });
    } catch (error) {
      if (error instanceof Error) {
        return badRequest(error.message);
      } else {
        console.error(error);
        return serverError();
      }
    }
  }
}
