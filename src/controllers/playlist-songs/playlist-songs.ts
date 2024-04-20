import { SearchResultMetadata } from "../../@types/types";
import { badRequest, ok, serverError } from "../helpers";
import { HttpRequest, HttpResponse, IController } from "../protocols";
import { GetPlaylistSongsParams } from "./protocols";
import Parser from "../../utils/parser";

export class GetPlaylistSongsController implements IController {
  async handle(
    httpRequest: HttpRequest<GetPlaylistSongsParams>
  ): Promise<HttpResponse<SearchResultMetadata | string>> {
    try {
      const requiredFields: (keyof GetPlaylistSongsParams)[] = [
        "playlistId",
        "offset",
        "limit",
      ];

      for (const field of requiredFields) {
        if (!httpRequest?.body?.[field as keyof GetPlaylistSongsParams]) {
          return badRequest(`Field ${field} is required`);
        }
      }

      const { playlistId, offset, limit } = httpRequest.body!;

      const metadata = await Parser.searchPlaylistSongs(
        playlistId,
        offset,
        limit
      );

      return ok<SearchResultMetadata>(metadata);
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
