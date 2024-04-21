import { SearchResultMetadata } from "../../@types/types";
import { badRequest, ok, serverError } from "../helpers";
import { HttpRequest, HttpResponse, IController } from "../protocols";
import { GetArtistAlbumsParams } from "./protocols";
import Parser from "../../utils/parser";

export class GetArtistAlbumsController implements IController {
  async handle(
    httpRequest: HttpRequest<GetArtistAlbumsParams>
  ): Promise<HttpResponse<SearchResultMetadata | string>> {
    try {
      const requiredFields: (keyof GetArtistAlbumsParams)[] = [
        "artistId",
        "offset",
        "limit",
      ];

      if (!httpRequest?.body) {
        return badRequest("Request body is required");
      }

      for (const field of requiredFields) {
        if (!((field as keyof GetArtistAlbumsParams) in httpRequest?.body)) {
          return badRequest(`Field ${field} is required`);
        }
      }

      const { artistId, offset, limit } = httpRequest.body!;

      const metadata = await Parser.searchAlbumSongs(artistId, offset, limit);

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
