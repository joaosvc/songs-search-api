import { SearchResultMetadata } from "../../@types/types";
import { badRequest, ok, serverError } from "../helpers";
import { HttpRequest, HttpResponse, IController } from "../protocols";
import { GetAlbumSongsParams } from "./protocols";
import Parser from "../../utils/parser";

export class GetAlbumSongsController implements IController {
  async handle(
    httpRequest: HttpRequest<GetAlbumSongsParams>
  ): Promise<HttpResponse<SearchResultMetadata | string>> {
    try {
      const requiredFields: (keyof GetAlbumSongsParams)[] = [
        "albumId",
        "offset",
        "limit",
      ];

      if (!httpRequest?.body) {
        return badRequest("Request body is required");
      }

      for (const field of requiredFields) {
        if (!((field as keyof GetAlbumSongsParams) in httpRequest?.body)) {
          return badRequest(`Field ${field} is required`);
        }
      }

      const { albumId, offset, limit } = httpRequest.body!;

      const metadata = await Parser.searchAlbumSongs(albumId, offset, limit);

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
