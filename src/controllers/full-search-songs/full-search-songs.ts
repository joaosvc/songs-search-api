import { FullSimpleLinkMetadata, Song } from "../../@types/types";
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
      const requiredFields: (keyof GetFullSearchSongsParams)[] = [
        "searchQuery",
      ];

      if (!httpRequest?.body) {
        return badRequest("Request body is required");
      }

      for (const field of requiredFields) {
        if (!((field as keyof GetFullSearchSongsParams) in httpRequest?.body)) {
          return badRequest(`Field ${field} is required`);
        }
      }

      const { searchQuery, offset, limit } = httpRequest.body!;

      const searchResult: any = await Parser.searchSongs(
        searchQuery,
        offset,
        limit
      );

      searchResult.type = "songs" in searchResult ? "songs" : "albums";

      if ("songs" in searchResult) {
        searchResult.metadata = (
          await Promise.all(
            searchResult.songs.map((song: Song) =>
              YoutubeSearch.fromParams(song)
            )
          )
        ).filter((metadata) => metadata.success && metadata.song);
        delete searchResult.songs;
      } else {
        searchResult.metadata = searchResult.albums;
        delete searchResult.albums;
      }

      return ok<any>({
        ...searchResult,
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
