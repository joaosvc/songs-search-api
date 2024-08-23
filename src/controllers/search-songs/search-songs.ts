import { SearchResultMetadata } from "../../@types/types";
import { badRequest, ok, serverError } from "../helpers";
import { HttpRequest, HttpResponse, IController } from "../protocols";
import { GetSearchSongsParams } from "./protocols";
import Parser from "../../utils/search/parser";

export class GetSearchSongsController implements IController {
  async handle(
    httpRequest: HttpRequest<GetSearchSongsParams>
  ): Promise<HttpResponse<SearchResultMetadata | string>> {
    try {
      const requiredFields: (keyof GetSearchSongsParams)[] = ["searchQuery"];

      if (!httpRequest?.body) {
        return badRequest("Request body is required");
      }

      for (const field of requiredFields) {
        if (!((field as keyof GetSearchSongsParams) in httpRequest?.body)) {
          return badRequest(`Field ${field} is required`);
        }
      }

      const { searchQuery, offset, limit } = httpRequest.body!;

      const metadata = await Parser.searchSongs(searchQuery, offset, limit);

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
