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

      if (!httpRequest?.body) {
        return badRequest("Request body is required");
      }

      for (const field of requiredFields) {
        if (!((field as keyof GetPlaylistSongsParams) in httpRequest?.body)) {
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
